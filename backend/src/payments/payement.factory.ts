import { Injectable } from '@nestjs/common';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { OrangeMoneyProvider } from './providers/orange-money/orange-money.provider';
import { WaveProvider } from './providers/wave/wave.provider';
import { PaydunyaProvider } from './providers/paydunya/paydunya.provider';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { PaymentGateway } from 'generated/prisma';

@Injectable()
export class PaymentFactory {
  constructor(
    private readonly stripe: StripeProvider,
    private readonly orangeMoney: OrangeMoneyProvider,
    private readonly wave: WaveProvider,
    private readonly paydunya: PaydunyaProvider,
  ) {}

  getProvider(gateway: PaymentGateway): PaymentProvider {
    switch (gateway) {
      case PaymentGateway.STRIPE:
        return this.stripe;

      case PaymentGateway.ORANGE_MONEY:
        return this.orangeMoney;

      case PaymentGateway.WAVE:
        return this.wave;

      case PaymentGateway.PAYDUNYA:
        return this.paydunya;

      default:
        throw new Error('Fournisseur non supporté');
    }
  }
}
