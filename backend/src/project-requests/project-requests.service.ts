import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, ProjectStatus, UserRole } from 'generated/prisma';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { EstimateProjectDto } from './dto/estimate-project.dto';
import { PROJECT_STATUS_TRANSITIONS } from './constants/project-status-transition';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import { formatCurrency } from 'src/common/utils/currency.util';
import { drawPdfHeader } from 'src/common/utils/pdf-header.util';
import { drawPdfTable } from 'src/common/utils/pdf-table.util';
import { drawPdfFooters, drawPdfStamp } from 'src/common/utils/pdf-footer.util';
import { generateProjectReference } from 'src/common/utils/reference.util';
import { PROJECT_QUOTE_VAT_RATE } from './constants/quote.constants';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { UpdateQuoteItemDto } from './dto/update-quote-item.dto';
import PDFDocument from 'pdfkit';

@Injectable()
export class ProjectRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    // Ajouté : this.emailService était utilisé sans jamais être injecté.
    private readonly emailService: EmailService,
  ) {}

  async create(userId: string, dto: CreateProjectRequestDto) {
    const project = await this.prisma.projectRequest.create({
      data: {
        ...dto,
        reference: generateProjectReference(),
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        userId,
      },
      include: {
        user: {
          select: { email: true, nom: true, prenom: true },
        },
      },
    });

    // NOTE: cet appel était placé APRÈS le `return` — donc jamais
    // exécuté (code mort), et référençait `project` avant sa
    // déclaration. Corrigé : le résultat de create() est capturé
    // dans `project`, l'e-mail est envoyé avant de retourner.
    await this.emailService.sendProjectCreated(project);
    await this.emailService.sendAdminNewProject(project);

    return project;
  }

  async findMyRequests(userId: string) {
    return this.prisma.projectRequest.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const project = await this.prisma.projectRequest.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!project) {
      throw new NotFoundException('Demande de projet introuvable.');
    }

    return project;
  }

  async getQuotePdf(
    user: { id: string; role: UserRole },
    id: string,
  ): Promise<Buffer> {
    const where =
      user.role === UserRole.ADMIN ? { id } : { id, userId: user.id };

    const project = await this.prisma.projectRequest.findFirst({
      where,
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        quoteItems: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!project) {
      throw new NotFoundException('Demande de projet introuvable.');
    }

    return this.generateQuotePdf(project);
  }

  private generateQuotePdf(project: {
    reference?: string | null;
    title: string;
    description: string;
    status: ProjectStatus;
    budget: unknown;
    deadline: Date | null;
    estimatedDuration: number | null;
    adminComment: string | null;
    createdAt: Date;
    user: { nom: string; prenom: string; email: string };
    quoteItems: { designation: string; quantity: number; unitPrice: unknown }[];
  }): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, left: 40, right: 40, bottom: 85 },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    drawPdfHeader(
      doc,
      project.reference
        ? `Devis ${project.reference} — Buzzitech Assistance`
        : 'Devis — Buzzitech Assistance',
    );

    const infoRows: Record<string, string>[] = [
      {
        field: 'Date de la demande',
        value: project.createdAt.toISOString().split('T')[0],
      },
      { field: 'Statut', value: project.status },
      { field: 'Client', value: `${project.user.prenom} ${project.user.nom}` },
      { field: 'Email', value: project.user.email },
    ];
    if (project.budget !== null && project.budget !== undefined) {
      infoRows.push({
        field: 'Budget estimé par le client',
        value: formatCurrency(project.budget as number),
      });
    }
    if (project.deadline) {
      infoRows.push({
        field: 'Échéance souhaitée',
        value: project.deadline.toISOString().split('T')[0],
      });
    }

    drawPdfTable(
      doc,
      [
        { header: 'Champ', key: 'field', width: 180 },
        { header: 'Détail', key: 'value', width: 335 },
      ],
      infoRows,
    );

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).text(project.title);
    doc.font('Helvetica').fontSize(11).moveDown(0.5);
    doc.text(project.description, { width: 500 });
    doc.moveDown();

    if (project.quoteItems.length > 0) {
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Estimation Buzzitech', { underline: true });
      doc.font('Helvetica').fontSize(11).moveDown(0.5);

      const totalHT = project.quoteItems.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      );
      const totalTVA = totalHT * PROJECT_QUOTE_VAT_RATE;
      const totalTTC = totalHT + totalTVA;

      drawPdfTable(
        doc,
        [
          { header: 'Désignation', key: 'designation', width: 245 },
          { header: 'Qté', key: 'qty', width: 60, align: 'right' },
          {
            header: 'Prix unitaire',
            key: 'unitPrice',
            width: 100,
            align: 'right',
          },
          { header: 'Total HT', key: 'total', width: 110, align: 'right' },
        ],
        project.quoteItems.map((item) => ({
          designation: item.designation,
          qty: item.quantity.toString(),
          unitPrice: formatCurrency(item.unitPrice as number),
          total: formatCurrency(Number(item.unitPrice) * item.quantity),
        })),
      );

      doc.moveDown(0.5);
      const summaryRows: Record<string, string>[] = [
        { field: 'Total HT', value: formatCurrency(totalHT) },
        {
          field: `TVA (${Math.round(PROJECT_QUOTE_VAT_RATE * 100)}%)`,
          value: formatCurrency(totalTVA),
        },
        { field: 'Total TTC', value: formatCurrency(totalTTC) },
      ];
      if (project.estimatedDuration) {
        summaryRows.push({
          field: 'Durée estimée',
          value: `${project.estimatedDuration} jour(s)`,
        });
      }

      drawPdfTable(
        doc,
        [
          { header: 'Récapitulatif', key: 'field', width: 355 },
          { header: 'Montant', key: 'value', width: 160, align: 'right' },
        ],
        summaryRows,
      );

      doc.moveDown(0.5);
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('Conditions de règlement', { underline: true });
      doc
        .font('Helvetica')
        .fontSize(10)
        .moveDown(0.3)
        .text('Paiement intégral à la commande.');

      if (project.adminComment) {
        doc.moveDown(0.5);
        doc
          .font('Helvetica-Oblique')
          .text(project.adminComment, { width: 500 });
        doc.font('Helvetica');
      }
    } else {
      doc.moveDown();
      doc
        .font('Helvetica-Oblique')
        .text(
          "Ce devis est en cours d'analyse : l'estimation détaillée sera ajoutée par nos équipes.",
        );
      doc.font('Helvetica');
    }

    doc.moveDown(2);
    drawPdfStamp(doc);

    drawPdfFooters(doc);
    doc.end();

    return endPromise;
  }

  async findAll() {
    return this.prisma.projectRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
          },
        },
        quoteItems: { orderBy: { displayOrder: 'asc' } },
        intervention: { select: { id: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStatus(id: string, status: ProjectStatus) {
    const project = await this.prisma.projectRequest.findUnique({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }

    const allowed = PROJECT_STATUS_TRANSITIONS[project.status];

    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Impossible de passer de ${project.status} à ${status}.`,
      );
    }

    const updatedProject = await this.prisma.projectRequest.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    // NOTE: ce bloc de notification était orphelin en fin de fichier
    // (hors de toute méthode, référençant une variable `project`
    // inexistante à cet endroit). D'après son message ("en cours
    // d'analyse"), il correspond au passage au statut ANALYSIS.
    // Ajuste la condition si l'intention était différente.
    if (status === ProjectStatus.ANALYSIS) {
      await this.notificationsService.create({
        userId: updatedProject.userId,
        title: 'Projet reçu',
        message: 'Votre demande est en cours d’analyse.',
        type: NotificationType.INFO,
        icon: 'folder',
        link: `/projects/${updatedProject.id}`,
      });
    }

    return updatedProject;
  }

  async estimateProject(id: string, dto: EstimateProjectDto) {
    const project = await this.prisma.projectRequest.findUnique({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }

    return this.prisma.projectRequest.update({
      where: {
        id,
      },
      data: {
        estimatedDuration: dto.estimatedDuration,
        adminComment: dto.adminComment,
      },
      include: {
        quoteItems: { orderBy: { displayOrder: 'asc' } },
      },
    });
  }

  async addQuoteItem(projectId: string, dto: CreateQuoteItemDto) {
    const project = await this.prisma.projectRequest.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Projet introuvable.');
    }

    const maxOrder = await this.prisma.quoteLineItem.aggregate({
      where: { projectRequestId: projectId },
      _max: { displayOrder: true },
    });

    await this.prisma.quoteLineItem.create({
      data: {
        projectRequestId: projectId,
        designation: dto.designation,
        quantity: dto.quantity ?? 1,
        unitPrice: dto.unitPrice,
        displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
      },
    });

    return this.recalculateEstimate(projectId);
  }

  async updateQuoteItem(itemId: string, dto: UpdateQuoteItemDto) {
    const item = await this.prisma.quoteLineItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException('Ligne de devis introuvable.');
    }

    await this.prisma.quoteLineItem.update({
      where: { id: itemId },
      data: {
        designation: dto.designation,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
      },
    });

    return this.recalculateEstimate(item.projectRequestId);
  }

  async removeQuoteItem(itemId: string) {
    const item = await this.prisma.quoteLineItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException('Ligne de devis introuvable.');
    }

    await this.prisma.quoteLineItem.delete({ where: { id: itemId } });

    return this.recalculateEstimate(item.projectRequestId);
  }

  /**
   * Recalcule et persiste le total TTC (estimatedCost) d'après les lignes
   * de devis, pour garder un champ de lecture rapide côté liste admin sans
   * devoir resommer les lignes à chaque affichage.
   */
  private async recalculateEstimate(projectId: string) {
    const items = await this.prisma.quoteLineItem.findMany({
      where: { projectRequestId: projectId },
    });

    const totalHT = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );
    const totalTTC =
      items.length > 0 ? totalHT * (1 + PROJECT_QUOTE_VAT_RATE) : null;

    return this.prisma.projectRequest.update({
      where: { id: projectId },
      data: { estimatedCost: totalTTC },
      include: {
        quoteItems: { orderBy: { displayOrder: 'asc' } },
      },
    });
  }
}
