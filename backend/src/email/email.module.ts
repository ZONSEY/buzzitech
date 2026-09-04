import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';

import { join } from 'path';
import { EmailService } from './email.service';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      // Ajouté : nécessaire pour que ConfigService soit résolu
      // dans useFactory ci-dessous (sauf si ConfigModule est
      // déjà global ailleurs dans ton app — dans ce cas cette
      // ligne ne fait pas de mal, elle est juste redondante).
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get('mail.host'),

          port: config.get('mail.port'),

          secure: false,

          auth: {
            user: config.get('mail.user'),

            pass: config.get('mail.password'),
          },

          // Sans ça, nodemailer utilise ses timeouts par défaut (plusieurs
          // dizaines de secondes, voire plus) quand le SMTP est injoignable
          // (port sortant bloqué par l'hébergeur, etc.) — un envoi d'email
          // bloquait alors l'inscription entière (register() attend
          // sendWelcomeEmail avant de répondre). 10s : on échoue vite,
          // safeSend() logue et l'inscription continue normalement.
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 10_000,
        },

        defaults: {
          from: config.get('mail.from'),
        },

        template: {
          dir: join(
            process.cwd(),

            'src',

            'email',

            'templates',
          ),

          adapter: new HandlebarsAdapter(),

          options: {
            strict: true,
          },
        },
      }),
    }),
  ],

  providers: [EmailService, NodemailerProvider],

  exports: [EmailService],
})
export class EmailModule {}
