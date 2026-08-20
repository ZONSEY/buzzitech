import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentStatus, NotificationType } from 'generated/prisma';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import {
  CreateCheckoutResponse,
  PaymentProvider,
  RefundResponse,
} from '../../interfaces/payment-provider.interface';

@Injectable()
export class StripeProvider implements PaymentProvider {
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    // Ajoutés : nécessaires pour notifier/e-mailer le client après un
    // paiement réussi ou échoué (voir handleWebhook ci-dessous).
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) {
    this.stripe = new Stripe(
      this.configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
      // apiVersion volontairement omis : le SDK utilise automatiquement
      // la version d'API à laquelle ce package est épinglé (stripe@22.x
      // → 2026-03-25.dahlia au moment de l'écriture). Fixer une chaîne
      // en dur ici casse la compilation à chaque montée de version du
      // SDK si elle ne correspond plus exactement.
    );
  }

  get client(): Stripe {
    return this.stripe;
  }

  async createCheckout(orderId: string): Promise<CreateCheckoutResponse> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
            businessService: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    // Réutilise CORS_ORIGIN (déjà l'URL du frontend, ex. http://localhost:4200)
    // plutôt qu'une variable FRONTEND_URL qui n'existe nulle part dans la config.
    const frontendUrl = this.configService.getOrThrow<string>('app.corsOrigin');

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      order.items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: 'xof',
          unit_amount: Math.round(Number(item.unitPrice) * 100),
          product_data: {
            name: item.product?.name ?? item.businessService?.name ?? 'Article',
          },
        },
      }));

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${frontendUrl}/orders/${order.id}?payment=success`,
      cancel_url: `${frontendUrl}/orders/${order.id}?payment=cancelled`,
      metadata: {
        orderId: order.id,
      },
    });

    if (!session.url) {
      throw new Error("Stripe n'a pas retourné d'URL de checkout.");
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    return {
      checkoutUrl: session.url,
      providerPaymentId: session.id,
      providerPaymentIntentId: paymentIntentId ?? undefined,
    };
  }

  async refund(paymentId: string): Promise<RefundResponse> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || !payment.stripeSessionId) {
      throw new NotFoundException('Paiement introuvable.');
    }

    // ASSOMPTION à vérifier : la session Checkout doit être résolue en
    // PaymentIntent pour effectuer le remboursement.
    const session = await this.stripe.checkout.sessions.retrieve(
      payment.stripeSessionId,
    );

    if (!session.payment_intent) {
      return { success: false };
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: session.payment_intent as string,
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });

    return {
      success: true,
      providerRefundId: refund.id,
    };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;

        if (!orderId) break;

        await this.prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: PaymentStatus.PAID, paidAt: new Date() },
        });

        const paidOrder = await this.prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CONFIRMED },
          include: {
            user: {
              select: { email: true, nom: true, prenom: true },
            },
          },
        });

        const payment = await this.prisma.payment.findFirst({
          where: { stripeSessionId: session.id },
        });

        // NOTE: ces deux appels étaient des blocs orphelins dans
        // payments.service.ts, référençant une variable `payment`
        // inexistante. Le webhook est le seul endroit où l'on sait
        // réellement qu'un paiement a réussi — replacés ici.
        if (payment) {
          await this.notificationsService.create({
            userId: paidOrder.userId,
            title: 'Paiement effectué',
            message: 'Votre paiement a été validé.',
            type: NotificationType.SUCCESS,
            icon: 'credit-card',
            link: `/payments/${payment.id}`,
          });
        }

        await this.emailService.sendPaymentSuccess(paidOrder);
        await this.emailService.sendAdminNewOrder(paidOrder);

        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;

        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: intent.id },
          data: {
            status: PaymentStatus.FAILED,
            failureReason: intent.last_payment_error?.message ?? undefined,
          },
        });

        const failedPayment = await this.prisma.payment.findFirst({
          where: { stripePaymentIntentId: intent.id },
          include: {
            order: {
              include: {
                user: {
                  select: { email: true, nom: true, prenom: true },
                },
              },
            },
          },
        });

        if (failedPayment) {
          await this.notificationsService.create({
            userId: failedPayment.order.userId,
            title: 'Paiement échoué',
            message: 'Le paiement n’a pas pu être effectué.',
            type: NotificationType.ERROR,
            icon: 'credit-card-off',
            link: `/payments/${failedPayment.id}`,
          });

          await this.emailService.sendPaymentFailed(
            failedPayment.order,
            intent.last_payment_error?.message,
          );
        }

        break;
      }
    }
  }
}
