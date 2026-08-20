import { Module } from '@nestjs/common';
import { InterventionsController } from './interventions.controller';
import { InterventionsService } from './interventions.service';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';
import { SmsModule } from 'src/sms/sms.module';

@Module({
  imports: [NotificationsModule, EmailModule, SmsModule],
  controllers: [InterventionsController],
  providers: [InterventionsService],
})
export class InterventionsModule {}
