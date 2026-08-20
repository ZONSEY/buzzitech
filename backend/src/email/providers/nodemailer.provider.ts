import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  EmailProvider,
  EmailAttachment,
} from '../interfaces/email-provider.interface';

@Injectable()
export class NodemailerProvider implements EmailProvider {
  constructor(private readonly mailerService: MailerService) {}

  async send(
    to: string,

    subject: string,

    template: string,

    context: Record<string, unknown>,

    attachments?: EmailAttachment[],
  ) {
    await this.mailerService.sendMail({
      to,

      subject,

      template,

      context,

      attachments,
    });
  }
}
