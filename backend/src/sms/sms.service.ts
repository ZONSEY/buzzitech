import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from 'generated/prisma';
import { formatCurrency } from 'src/common/utils/currency.util';
import { ConsoleSmsProvider } from './providers/console-sms.provider';

interface InterventionSmsContext {
  title: string;
  reference: string;
  client: { telephone: string | null };
}

interface OrderSmsContext {
  reference: string;
  totalAmount: string | number | Prisma.Decimal;
  user: { telephone: string | null };
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly provider: ConsoleSmsProvider) {}

  async sendInterventionOnTheWay(intervention: InterventionSmsContext) {
    await this.safeSend(
      intervention.client.telephone,
      () =>
        `BUZZITECH : votre technicien est en route pour « ${intervention.title} » (réf. ${intervention.reference}).`,
    );
  }

  async sendInterventionCompleted(intervention: InterventionSmsContext) {
    await this.safeSend(
      intervention.client.telephone,
      () =>
        `BUZZITECH : la mission « ${intervention.title} » (réf. ${intervention.reference}) est terminée. Votre rapport est disponible dans votre espace client.`,
    );
  }

  async sendOrderConfirmation(order: OrderSmsContext) {
    await this.safeSend(
      order.user.telephone,
      () =>
        `BUZZITECH : commande ${order.reference} confirmée pour un montant de ${formatCurrency(order.totalAmount)}. Merci pour votre confiance !`,
    );
  }

  private async safeSend(
    to: string | null,
    buildMessage: () => string,
  ): Promise<void> {
    if (!to) {
      return;
    }
    try {
      await this.provider.send(to, buildMessage());
    } catch (error) {
      this.logger.error(error);
    }
  }
}
