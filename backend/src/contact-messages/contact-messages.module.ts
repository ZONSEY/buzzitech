import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EmailModule } from 'src/email/email.module';
import { ContactMessagesController } from './contact-messages.controller';
import { ContactMessagesService } from './contact-messages.service';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService],
})
export class ContactMessagesModule {}
