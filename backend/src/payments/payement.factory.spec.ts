import { PaymentFactory } from './payement.factory';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { OrangeMoneyProvider } from './providers/orange-money/orange-money.provider';
import { WaveProvider } from './providers/wave/wave.provider';
import { PaydunyaProvider } from './providers/paydunya/paydunya.provider';
import { PaymentGateway } from 'generated/prisma';

describe('PaymentFactory', () => {
  const stripe = {} as StripeProvider;
  const orangeMoney = {} as OrangeMoneyProvider;
  const wave = {} as WaveProvider;
  const paydunya = {} as PaydunyaProvider;

  const factory = new PaymentFactory(stripe, orangeMoney, wave, paydunya);

  it('route vers le provider Stripe', () => {
    expect(factory.getProvider(PaymentGateway.STRIPE)).toBe(stripe);
  });

  it('route vers le provider Orange Money', () => {
    expect(factory.getProvider(PaymentGateway.ORANGE_MONEY)).toBe(orangeMoney);
  });

  it('route vers le provider Wave', () => {
    expect(factory.getProvider(PaymentGateway.WAVE)).toBe(wave);
  });

  it('route vers le provider PayDunya', () => {
    expect(factory.getProvider(PaymentGateway.PAYDUNYA)).toBe(paydunya);
  });

  it('rejette un gateway non supporté', () => {
    expect(() => factory.getProvider('UNKNOWN' as PaymentGateway)).toThrow();
  });
});
