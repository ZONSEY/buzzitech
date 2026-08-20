import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentStatus, NotificationType } from 'generated/prisma';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import {
  CreateCheckoutResponse,
  PaymentProvider,
  RefundResponse,
} from '../../interfaces/payment-provider.interface';

// Client pour l'API "Web Payment" d'Orange Money. Les noms d'endpoints
// précis (/oauth/v3/token, /omcoreapi/1.0.2/mp/init) varient selon le
// pays de rattachement du compte marchand Orange Money — à confirmer
// avec la documentation fournie par Orange lors de l'activation du
// compte marchand, ORANGE_MONEY_API_URL pointant vers l'environnement
// (sandbox ou production) correspondant.
interface OrangeMoneyTokenResponse {
  access_token: string;
  expires_in: number;
}

interface OrangeMoneyInitResponse {
  payment_url: string;
  pay_token: string;
  notif_token: string;
}

@Injectable()
export class OrangeMoneyProvider implements PaymentProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private get apiUrl(): string {
    return this.configService.getOrThrow<string>(
      'mobilePayments.orangeMoney.apiUrl',
    );
  }

  // Le token OAuth2 client_credentials expire (typiquement 1h) : on le
  // redemande à chaque paiement plutôt que de gérer un cache, le volume
  // de checkouts ne justifiant pas la complexité d'un cache partagé.
  private async getAccessToken(): Promise<string> {
    const clientId = this.configService.getOrThrow<string>(
      'mobilePayments.orangeMoney.clientId',
    );
    const clientSecret = this.configService.getOrThrow<string>(
      'mobilePayments.orangeMoney.clientSecret',
    );
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch(`${this.apiUrl}/oauth/v3/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(
        `Orange Money OAuth error (${response.status}): ${await response.text()}`,
      );
    }

    const data = (await response.json()) as OrangeMoneyTokenResponse;
    return data.access_token;
  }

  async createCheckout(orderId: string): Promise<CreateCheckoutResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    const merchantKey = this.configService.getOrThrow<string>(
      'mobilePayments.orangeMoney.merchantKey',
    );
    const frontendUrl = this.configService.getOrThrow<string>('app.corsOrigin');
    const appUrl = this.configService.getOrThrow<string>('app.url');
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.apiUrl}/omcoreapi/1.0.2/mp/init`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_key: merchantKey,
        currency: 'XOF',
        order_id: order.id,
        amount: Math.round(Number(order.totalAmount)),
        return_url: `${frontendUrl}/espace-client/commandes/${order.id}?payment=success`,
        cancel_url: `${frontendUrl}/espace-client/commandes/${order.id}?payment=cancelled`,
        notif_url: `${appUrl}/api/payments/webhook/orange-money`,
        lang: 'fr',
        reference: order.reference,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Orange Money init error (${response.status}): ${await response.text()}`,
      );
    }

    const data = (await response.json()) as OrangeMoneyInitResponse;

    return {
      checkoutUrl: data.payment_url,
      providerPaymentId: data.pay_token,
    };
  }

  refund(): Promise<RefundResponse> {
    // L'API Web Payment d'Orange Money ne propose pas de remboursement
    // automatisé standard : il se fait manuellement via l'espace
    // marchand Orange. On le signale explicitement plutôt que de
    // prétendre avoir remboursé.
    return Promise.resolve({ success: false });
  }

  // NOTE : contrairement à Stripe/Wave, l'API Web Payment d'Orange Money
  // ne signe pas ses notifications avec un en-tête de signature
  // vérifiable côté serveur — l'authenticité s'appuie sur le
  // `notif_token` renvoyé lors de l'init et à comparer à celui reçu ici
  // (non implémenté : nécessite de stocker ce token par paiement).
  async handleWebhook(payload: Buffer): Promise<void> {
    const notification = JSON.parse(payload.toString()) as {
      status: 'SUCCESS' | 'FAILED';
      order_id: string;
      pay_token: string;
      txnid?: string;
    };

    const order = await this.prisma.order.findUnique({
      where: { id: notification.order_id },
      include: { user: { select: { email: true, nom: true, prenom: true } } },
    });

    if (!order) {
      return;
    }

    if (notification.status === 'SUCCESS') {
      await this.prisma.payment.updateMany({
        where: { transactionId: notification.pay_token },
        data: { status: PaymentStatus.PAID, paidAt: new Date() },
      });

      const paidOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CONFIRMED },
        include: {
          user: { select: { email: true, nom: true, prenom: true } },
        },
      });

      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: notification.pay_token },
      });

      if (payment) {
        await this.notificationsService.create({
          userId: paidOrder.userId,
          title: 'Paiement effectué',
          message: 'Votre paiement Orange Money a été validé.',
          type: NotificationType.SUCCESS,
          icon: 'credit-card',
          link: `/payments/${payment.id}`,
        });
      }

      await this.emailService.sendPaymentSuccess(paidOrder);
      await this.emailService.sendAdminNewOrder(paidOrder);
    } else {
      await this.prisma.payment.updateMany({
        where: { transactionId: notification.pay_token },
        data: { status: PaymentStatus.FAILED },
      });

      await this.emailService.sendPaymentFailed(
        order,
        'Paiement Orange Money refusé.',
      );
    }
  }
}
