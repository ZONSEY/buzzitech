import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentFactory } from './payement.factory';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { OrangeMoneyProvider } from './providers/orange-money/orange-money.provider';
import { WaveProvider } from './providers/wave/wave.provider';
import { PaydunyaProvider } from './providers/paydunya/paydunya.provider';
import { PaymentsService } from './payments.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';
@Module({
  imports: [NotificationsModule, EmailModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentFactory,
    StripeProvider,
    OrangeMoneyProvider,
    WaveProvider,
    PaydunyaProvider,
  ],
})
export class PaymentsModule {}
