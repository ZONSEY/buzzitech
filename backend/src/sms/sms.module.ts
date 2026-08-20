import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { ConsoleSmsProvider } from './providers/console-sms.provider';

@Module({
  providers: [SmsService, ConsoleSmsProvider],
  exports: [SmsService],
})
export class SmsModule {}
