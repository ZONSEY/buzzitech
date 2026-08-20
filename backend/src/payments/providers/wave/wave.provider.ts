import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentStatus, NotificationType } from 'generated/prisma';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import {
  CreateCheckoutResponse,
  PaymentProvider,
  RefundResponse,
} from '../../interfaces/payment-provider.interface';

// Client minimal pour l'API "Checkout" de Wave Business
// (https://docs.wave.com/business). Wave facture en centimes de XOF
// (comme XOF n'a pas de sous-unité, "amount" est directement le
// montant entier en francs CFA, envoyé sous forme de chaîne).
interface WaveCheckoutSession {
  id: string;
  wave_launch_url: string;
  client_reference: string;
}

@Injectable()
export class WaveProvider implements PaymentProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  private get apiUrl(): string {
    return this.configService.getOrThrow<string>('mobilePayments.wave.apiUrl');
  }

  private get apiKey(): string {
    return this.configService.getOrThrow<string>('mobilePayments.wave.apiKey');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Wave API error (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }

  async createCheckout(orderId: string): Promise<CreateCheckoutResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    const frontendUrl = this.configService.getOrThrow<string>('app.corsOrigin');

    const session = await this.request<WaveCheckoutSession>(
      '/v1/checkout/sessions',
      {
        method: 'POST',
        body: JSON.stringify({
          amount: Math.round(Number(order.totalAmount)).toString(),
          currency: 'XOF',
          client_reference: order.id,
          success_url: `${frontendUrl}/espace-client/commandes/${order.id}?payment=success`,
          error_url: `${frontendUrl}/espace-client/commandes/${order.id}?payment=cancelled`,
        }),
      },
    );

    return {
      checkoutUrl: session.wave_launch_url,
      providerPaymentId: session.id,
    };
  }

  async refund(paymentId: string): Promise<RefundResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !payment.transactionId) {
      throw new NotFoundException('Paiement introuvable.');
    }

    await this.request(
      `/v1/checkout/sessions/${payment.transactionId}/refund`,
      { method: 'POST' },
    );

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.REFUNDED, refundedAt: new Date() },
    });

    return { success: true, providerRefundId: payment.transactionId };
  }

  // Vérifie la signature HMAC-SHA256 envoyée par Wave dans l'en-tête
  // `Wave-Signature`, selon leur schéma de signature de webhook.
  private verifySignature(payload: Buffer, signature: string): boolean {
    const webhookSecret = this.configService.getOrThrow<string>(
      'mobilePayments.wave.webhookSecret',
    );
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!this.verifySignature(payload, signature)) {
      throw new Error('Signature Wave invalide.');
    }

    const event = JSON.parse(payload.toString()) as {
      type: string;
      data: { id: string; client_reference: string };
    };

    if (event.type !== 'checkout.session.completed') {
      return;
    }

    const orderId = event.data.client_reference;

    await this.prisma.payment.updateMany({
      where: { transactionId: event.data.id },
      data: { status: PaymentStatus.PAID, paidAt: new Date() },
    });

    const paidOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED },
      include: { user: { select: { email: true, nom: true, prenom: true } } },
    });

    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: event.data.id },
    });

    if (payment) {
      await this.notificationsService.create({
        userId: paidOrder.userId,
        title: 'Paiement effectué',
        message: 'Votre paiement Wave a été validé.',
        type: NotificationType.SUCCESS,
        icon: 'credit-card',
        link: `/payments/${payment.id}`,
      });
    }

    await this.emailService.sendPaymentSuccess(paidOrder);
    await this.emailService.sendAdminNewOrder(paidOrder);
  }
}
