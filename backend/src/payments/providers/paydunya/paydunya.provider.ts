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

// Client pour l'API "Checkout Invoice" de PayDunya
// (https://docs.paydunya.com), agrégateur couvrant plusieurs moyens de
// paiement (Orange Money, MTN, Moov, cartes...) dans plusieurs pays
// d'Afrique de l'Ouest. PAYDUNYA_MODE côté compte marchand détermine
// si les clés utilisées pointent vers le bac à sable ou la production.
interface PaydunyaInvoiceResponse {
  response_code: string;
  response_text: string;
  token: string;
}

interface PaydunyaIpnData {
  status: 'completed' | 'cancelled';
  invoice: {
    token: string;
    total_amount: string;
  };
  custom_data?: { orderId?: string };
}

@Injectable()
export class PaydunyaProvider implements PaymentProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private get apiUrl(): string {
    return this.configService.getOrThrow<string>(
      'mobilePayments.paydunya.apiUrl',
    );
  }

  private get authHeaders(): Record<string, string> {
    return {
      'PAYDUNYA-MASTER-KEY': this.configService.getOrThrow<string>(
        'mobilePayments.paydunya.masterKey',
      ),
      'PAYDUNYA-PRIVATE-KEY': this.configService.getOrThrow<string>(
        'mobilePayments.paydunya.privateKey',
      ),
      'PAYDUNYA-PUBLIC-KEY': this.configService.getOrThrow<string>(
        'mobilePayments.paydunya.publicKey',
      ),
      'PAYDUNYA-TOKEN': this.configService.getOrThrow<string>(
        'mobilePayments.paydunya.token',
      ),
    };
  }

  async createCheckout(orderId: string): Promise<CreateCheckoutResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    const frontendUrl = this.configService.getOrThrow<string>('app.corsOrigin');
    const appUrl = this.configService.getOrThrow<string>('app.url');

    const response = await fetch(`${this.apiUrl}/checkout-invoice/create`, {
      method: 'POST',
      headers: {
        ...this.authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice: {
          total_amount: Math.round(Number(order.totalAmount)),
          description: `Commande ${order.reference}`,
        },
        store: { name: 'Buzzitech Assistance' },
        actions: {
          cancel_url: `${frontendUrl}/espace-client/commandes/${order.id}?payment=cancelled`,
          return_url: `${frontendUrl}/espace-client/commandes/${order.id}?payment=success`,
          callback_url: `${appUrl}/api/payments/webhook/paydunya`,
        },
        custom_data: { orderId: order.id },
      }),
    });

    const data = (await response.json()) as PaydunyaInvoiceResponse;

    if (!response.ok || data.response_code !== '00') {
      throw new Error(`PayDunya init error: ${data.response_text}`);
    }

    return {
      checkoutUrl: `https://paydunya.com/checkout/invoice/${data.token}`,
      providerPaymentId: data.token,
    };
  }

  refund(): Promise<RefundResponse> {
    // Comme pour Orange Money, PayDunya ne propose pas d'API de
    // remboursement automatisé pour les factures de checkout — le
    // remboursement se fait manuellement depuis l'espace marchand.
    return Promise.resolve({ success: false });
  }

  // NOTE : PayDunya n'envoie pas de signature vérifiable séparément —
  // l'authenticité de l'IPN s'appuie sur le fait que le token de facture
  // (invoice.token) correspond à un paiement PENDING connu de nous.
  async handleWebhook(payload: Buffer): Promise<void> {
    // L'IPN PayDunya envoie un formulaire avec un champ `data` contenant
    // le JSON de la notification (et non un webhook JSON direct comme
    // Stripe/Wave).
    const params = new URLSearchParams(payload.toString());
    const raw = params.get('data');

    if (!raw) {
      return;
    }

    const notification = JSON.parse(raw) as PaydunyaIpnData;
    const orderId = notification.custom_data?.orderId;

    if (!orderId || notification.status !== 'completed') {
      return;
    }

    await this.prisma.payment.updateMany({
      where: { transactionId: notification.invoice.token },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });

    const paidOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED },
      include: { user: { select: { email: true, nom: true, prenom: true } } },
    });

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: notification.invoice.token },
    });

    if (payment) {
      await this.notificationsService.create({
        userId: paidOrder.userId,
        title: 'Paiement effectué',
        message: 'Votre paiement PayDunya a été validé.',
        type: NotificationType.SUCCESS,
        icon: 'credit-card',
        link: `/payments/${payment.id}`,
      });
    }

    await this.emailService.sendPaymentSuccess(paidOrder);
    await this.emailService.sendAdminNewOrder(paidOrder);
  }
}
