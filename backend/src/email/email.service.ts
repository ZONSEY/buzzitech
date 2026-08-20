import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto, EmailAttachment } from './dto/send-email.dto';
import { NodemailerProvider } from './providers/nodemailer.provider';
import {
  ContactMessage,
  Intervention,
  Order,
  ProjectRequest,
  User,
} from 'generated/prisma';

type OrderWithUser = Order & {
  user: { email: string; nom: string; prenom: string };
};

type ProjectRequestWithUser = ProjectRequest & {
  user: { email: string; nom: string; prenom: string };
};

type InterventionWithClient = Intervention & {
  client: { email: string; nom: string; prenom: string };
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly provider: NodemailerProvider,
    private readonly configService: ConfigService,
  ) {}

  async send(dto: SendEmailDto) {
    return this.provider.send(
      dto.to,
      dto.subject,
      dto.template,
      dto.context ?? {},
      dto.attachments,
    );
  }

  async sendWelcomeEmail(user: User) {
    await this.safeSend(() =>
      this.provider.send(user.email, 'Bienvenue sur Buzzitech', 'welcome', {
        fullname: `${user.prenom} ${user.nom}`,
      }),
    );
  }

  async sendOrderConfirmation(
    // ASSOMPTION : Order n'inclut pas `user` par défaut côté Prisma —
    // le type est étendu ici pour matcher ce que cette méthode
    // consomme réellement (order.user.email, .prenom, .nom).
    // Assure-toi que l'appelant charge bien la commande avec
    // include: { user: true }.
    order: Order & {
      user: {
        email: string;
        nom: string;
        prenom: string;
      };
    },
  ) {
    await this.safeSend(() =>
      this.provider.send(
        order.user.email,

        'Confirmation de commande',

        'order-confirmation',

        {
          fullname: `${order.user.prenom} ${order.user.nom}`,

          reference: order.reference,

          amount: order.totalAmount,
        },
      ),
    );
  }

  async sendPaymentSuccess(order: OrderWithUser) {
    await this.safeSend(() =>
      this.provider.send(
        order.user.email,
        'Paiement réussi',
        'payment-success',
        {
          fullname: `${order.user.prenom} ${order.user.nom}`,
          reference: order.reference,
          amount: order.totalAmount,
        },
      ),
    );
  }

  async sendPaymentFailed(order: OrderWithUser, reason?: string) {
    await this.safeSend(() =>
      this.provider.send(
        order.user.email,
        'Échec du paiement',
        'payment-failed',
        {
          fullname: `${order.user.prenom} ${order.user.nom}`,
          reference: order.reference,
          amount: order.totalAmount,
          reason,
        },
      ),
    );
  }

  async sendProjectCreated(projectRequest: ProjectRequestWithUser) {
    await this.safeSend(() =>
      this.provider.send(
        projectRequest.user.email,
        'Votre demande de projet a bien été reçue',
        'project-created',
        {
          fullname: `${projectRequest.user.prenom} ${projectRequest.user.nom}`,
          title: projectRequest.title,
        },
      ),
    );
  }

  async sendPasswordReset(user: User, resetUrl: string) {
    await this.safeSend(() =>
      this.provider.send(
        user.email,
        'Réinitialisation de votre mot de passe',
        'reset-password',
        { url: resetUrl },
      ),
    );
  }

  async sendVerificationEmail(user: User, verifyUrl: string) {
    await this.safeSend(() =>
      this.provider.send(
        user.email,
        'Confirmez votre adresse email',
        'verify-email',
        { fullname: `${user.prenom} ${user.nom}`, url: verifyUrl },
      ),
    );
  }

  async sendInterventionCompleted(
    intervention: InterventionWithClient,
    reportAttachment?: EmailAttachment,
  ) {
    await this.safeSend(() =>
      this.provider.send(
        intervention.client.email,
        `Intervention terminée — ${intervention.title}`,
        'intervention-completed',
        {
          fullname: `${intervention.client.prenom} ${intervention.client.nom}`,
          title: intervention.title,
          reference: intervention.reference,
          report: intervention.report,
        },
        reportAttachment ? [reportAttachment] : undefined,
      ),
    );
  }

  async sendContactReply(contactMessage: ContactMessage, replyMessage: string) {
    await this.safeSend(() =>
      this.provider.send(
        contactMessage.email,
        'Réponse à votre demande - BUZZITECH',
        'contact-reply',
        { message: replyMessage, fullname: contactMessage.name },
      ),
    );
  }

  async sendAdminNewOrder(order: OrderWithUser) {
    const adminEmail = this.configService.get<string>('mail.adminEmail');
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL non configuré : notification de nouvelle commande ignorée.',
      );
      return;
    }

    await this.safeSend(() =>
      this.provider.send(
        adminEmail,
        'Nouvelle commande reçue',
        'order-confirmation',
        {
          fullname: `${order.user.prenom} ${order.user.nom}`,
          reference: order.reference,
          amount: order.totalAmount,
        },
      ),
    );
  }

  async sendAdminNewProject(projectRequest: ProjectRequestWithUser) {
    const adminEmail = this.configService.get<string>('mail.adminEmail');
    if (!adminEmail) {
      this.logger.warn(
        'ADMIN_EMAIL non configuré : notification de nouveau projet ignorée.',
      );
      return;
    }

    await this.safeSend(() =>
      this.provider.send(
        adminEmail,
        'Nouvelle demande de projet',
        'project-created',
        {
          fullname: `${projectRequest.user.prenom} ${projectRequest.user.nom}`,
          title: projectRequest.title,
        },
      ),
    );
  }

  async sendInvoiceEmail(
    order: Order & { user: { email: string; nom: string; prenom: string } },
    attachment: EmailAttachment,
  ) {
    await this.safeSend(() =>
      this.provider.send(
        order.user.email,
        `Facture ${order.reference}`,
        'order-confirmation',
        {
          fullname: `${order.user.prenom} ${order.user.nom}`,
          reference: order.reference,
          amount: order.totalAmount,
        },
        [attachment],
      ),
    );
  }

  private async safeSend(action: () => Promise<void>): Promise<void> {
    // NOTE: la version précédente s'appelait récursivement à l'infini
    // (this.safeSend(() => this.safeSend(...))) quel que soit le
    // résultat du try/catch, et contenait un spread vide invalide
    // (this.provider.send(...)) qui ne compilait même pas. Ici,
    // safeSend se contente d'exécuter l'action et de logger l'erreur
    // sans jamais faire planter l'appelant.
    try {
      await action();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
