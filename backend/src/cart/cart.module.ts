import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';
import { PromoCodesModule } from 'src/promo-codes/promo-codes.module';
import { SmsModule } from 'src/sms/sms.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    EmailModule,
    PromoCodesModule,
    SmsModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
