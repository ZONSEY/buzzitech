import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import type { EmailAttachment } from 'src/email/dto/send-email.dto';
import { SmsService } from 'src/sms/sms.service';
import {
  InterventionStatus,
  NotificationType,
  Prisma,
  UserRole,
} from 'generated/prisma';
import { generateInterventionReference } from 'src/common/utils/reference.util';
import { drawPdfHeader } from 'src/common/utils/pdf-header.util';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { CompleteInterventionDto } from './dto/complete-intervention.dto';
import { ObservationsDto } from './dto/observations.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { InterventionFilterDto } from './dto/intervention-filter.dto';
import { RateInterventionDto } from './dto/rate-intervention.dto';

const PERSON_SELECT = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  telephone: true,
};

const INCLUDE = {
  client: { select: PERSON_SELECT },
  technician: { select: PERSON_SELECT },
  address: true,
  photos: { orderBy: { createdAt: 'asc' as const } },
  materials: { orderBy: { createdAt: 'asc' as const } },
  orderItem: {
    include: { product: true, businessService: true },
  },
  projectRequest: true,
};

type CurrentUser = { id: string; role: UserRole };

@Injectable()
export class InterventionsService {
  private readonly logger = new Logger(InterventionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async create(dto: CreateInterventionDto) {
    const client = await this.prisma.user.findUnique({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client introuvable.');
    }

    if (dto.technicianId) {
      await this.assertIsTechnician(dto.technicianId);
    }

    // Si la mission découle d'une demande de projet et qu'aucune
    // localisation n'a été fournie explicitement, on reprend celle
    // choisie par le client sur la carte lors de sa demande.
    let locationLat = dto.locationLat;
    let locationLng = dto.locationLng;
    let locationAddress = dto.locationAddress;

    if (
      dto.projectRequestId &&
      locationLat === undefined &&
      locationLng === undefined
    ) {
      const projectRequest = await this.prisma.projectRequest.findUnique({
        where: { id: dto.projectRequestId },
        select: {
          locationLat: true,
          locationLng: true,
          locationAddress: true,
        },
      });
      if (projectRequest?.locationLat != null && projectRequest.locationLng != null) {
        locationLat = projectRequest.locationLat;
        locationLng = projectRequest.locationLng;
        locationAddress = locationAddress ?? projectRequest.locationAddress ?? undefined;
      }
    }

    const intervention = await this.prisma.intervention.create({
      data: {
        reference: generateInterventionReference(),
        title: dto.title,
        description: dto.description,
        scheduledAt: new Date(dto.scheduledAt),
        clientId: dto.clientId,
        technicianId: dto.technicianId,
        addressId: dto.addressId,
        addressText: dto.addressText,
        orderItemId: dto.orderItemId,
        projectRequestId: dto.projectRequestId,
        locationLat,
        locationLng,
        locationAddress,
      },
      include: INCLUDE,
    });

    if (intervention.technicianId) {
      await this.notifyTechnicianAssigned(intervention);
    }

    return intervention;
  }

  async findAll(filter: InterventionFilterDto) {
    const where: Prisma.InterventionWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.technicianId) {
      where.technicianId = filter.technicianId;
    }
    if (filter.search) {
      where.OR = [
        { reference: { contains: filter.search, mode: 'insensitive' } },
        { title: { contains: filter.search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { nom: { contains: filter.search, mode: 'insensitive' } },
              { prenom: { contains: filter.search, mode: 'insensitive' } },
              { email: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }
    if (filter.from || filter.to) {
      where.scheduledAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined,
      };
    }

    return this.paginate(where, filter);
  }

  async findMine(technicianId: string, filter: InterventionFilterDto) {
    const where: Prisma.InterventionWhereInput = { technicianId };

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.from || filter.to) {
      where.scheduledAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined,
      };
    }

    return this.paginate(where, filter);
  }

  async findMineAsClient(clientId: string, filter: InterventionFilterDto) {
    return this.paginate({ clientId }, filter);
  }

  async findOne(user: CurrentUser, id: string) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable.');
    }

    this.assertCanView(user, intervention);

    return intervention;
  }

  async update(id: string, dto: UpdateInterventionDto) {
    const existing = await this.prisma.intervention.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Intervention introuvable.');
    }

    if (dto.technicianId) {
      await this.assertIsTechnician(dto.technicianId);
    }

    const intervention = await this.prisma.intervention.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        status: dto.status,
        technicianId: dto.technicianId,
        addressId: dto.addressId,
        addressText: dto.addressText,
        locationLat: dto.locationLat,
        locationLng: dto.locationLng,
        locationAddress: dto.locationAddress,
      },
      include: INCLUDE,
    });

    // Nouveau technicien assigné (ou changé) : on le notifie. On ne
    // notifie pas si le technicien n'a pas changé, pour éviter le bruit
    // à chaque modification mineure (titre, description...).
    if (
      dto.technicianId &&
      dto.technicianId !== existing.technicianId &&
      intervention.status !== InterventionStatus.CANCELLED
    ) {
      await this.notifyTechnicianAssigned(intervention);
    }

    return intervention;
  }

  async accept(user: CurrentUser, id: string) {
    const intervention = await this.getForAction(user, id);

    if (user.role !== UserRole.TECHNICIEN) {
      throw new ForbiddenException(
        'Seul le technicien assigné peut accepter une mission.',
      );
    }

    if (intervention.status !== InterventionStatus.SCHEDULED) {
      throw new BadRequestException(
        'Seule une mission planifiée peut être acceptée.',
      );
    }

    return this.prisma.intervention.update({
      where: { id },
      data: { status: InterventionStatus.ACCEPTED },
      include: INCLUDE,
    });
  }

  async markOnTheWay(user: CurrentUser, id: string) {
    const intervention = await this.getForAction(user, id);

    if (intervention.status !== InterventionStatus.ACCEPTED) {
      throw new BadRequestException(
        'La mission doit être acceptée avant de démarrer le déplacement.',
      );
    }

    const updated = await this.prisma.intervention.update({
      where: { id },
      data: { status: InterventionStatus.ON_THE_WAY },
      include: INCLUDE,
    });

    await this.notificationsService.create({
      userId: updated.clientId,
      title: 'Technicien en route',
      message: `Le technicien est en déplacement pour « ${updated.title} ».`,
      type: NotificationType.INFO,
      icon: 'truck',
      link: `/espace-client/interventions/${updated.id}`,
    });
    await this.smsService.sendInterventionOnTheWay(updated);

    return updated;
  }

  async start(user: CurrentUser, id: string) {
    const intervention = await this.getForAction(user, id);

    if (intervention.status !== InterventionStatus.ON_THE_WAY) {
      throw new BadRequestException(
        'La mission doit être en déplacement avant de pouvoir être démarrée.',
      );
    }

    const updated = await this.prisma.intervention.update({
      where: { id },
      data: { status: InterventionStatus.IN_PROGRESS, startedAt: new Date() },
      include: INCLUDE,
    });

    await this.notificationsService.create({
      userId: updated.clientId,
      title: 'Technicien en intervention',
      message: `Le technicien est arrivé pour « ${updated.title} ».`,
      type: NotificationType.INFO,
      icon: 'wrench',
      link: `/espace-client/interventions/${updated.id}`,
    });

    return updated;
  }

  async updateObservations(
    user: CurrentUser,
    id: string,
    dto: ObservationsDto,
  ) {
    const intervention = await this.getForAction(user, id);

    if (intervention.status === InterventionStatus.COMPLETED) {
      throw new BadRequestException('Cette mission est déjà clôturée.');
    }

    return this.prisma.intervention.update({
      where: { id },
      data: { observations: dto.observations },
      include: INCLUDE,
    });
  }

  async addMaterial(user: CurrentUser, id: string, dto: AddMaterialDto) {
    await this.getForAction(user, id);

    const quantity = dto.quantity ?? 1;

    if (!dto.materialItemId && !dto.name) {
      throw new BadRequestException(
        'Précisez un article du catalogue ou un nom de matériel.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      let name = dto.name;

      if (dto.materialItemId) {
        const item = await tx.materialItem.findUnique({
          where: { id: dto.materialItemId },
        });
        if (!item || !item.isActive) {
          throw new NotFoundException('Article de catalogue introuvable.');
        }
        if (item.stockQuantity < quantity) {
          throw new BadRequestException(
            `Stock insuffisant pour « ${item.name} » (${item.stockQuantity} disponible(s)).`,
          );
        }

        await tx.materialItem.update({
          where: { id: item.id },
          data: { stockQuantity: { decrement: quantity } },
        });
        name = item.name;
      }

      await tx.interventionMaterial.create({
        data: {
          interventionId: id,
          name: name!,
          quantity,
          materialItemId: dto.materialItemId,
        },
      });
    });

    return this.prisma.intervention.findUnique({
      where: { id },
      include: INCLUDE,
    });
  }

  async removeMaterial(user: CurrentUser, id: string, materialId: string) {
    await this.getForAction(user, id);

    await this.prisma.$transaction(async (tx) => {
      const material = await tx.interventionMaterial.findUnique({
        where: { id: materialId },
      });
      if (!material) {
        throw new NotFoundException('Matériel introuvable.');
      }

      if (material.materialItemId) {
        await tx.materialItem.update({
          where: { id: material.materialItemId },
          data: { stockQuantity: { increment: material.quantity } },
        });
      }

      await tx.interventionMaterial.delete({ where: { id: materialId } });
    });

    return this.prisma.intervention.findUnique({
      where: { id },
      include: INCLUDE,
    });
  }

  async addPhoto(user: CurrentUser, id: string, url: string) {
    await this.getForAction(user, id);

    await this.prisma.interventionPhoto.create({
      data: { interventionId: id, url },
    });

    return this.prisma.intervention.findUnique({
      where: { id },
      include: INCLUDE,
    });
  }

  async removePhoto(user: CurrentUser, id: string, photoId: string) {
    await this.getForAction(user, id);

    await this.prisma.interventionPhoto.delete({ where: { id: photoId } });

    return this.prisma.intervention.findUnique({
      where: { id },
      include: INCLUDE,
    });
  }

  async complete(user: CurrentUser, id: string, dto: CompleteInterventionDto) {
    const intervention = await this.getForAction(user, id);

    if (intervention.status !== InterventionStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'La mission doit être démarrée avant de pouvoir être clôturée.',
      );
    }

    const completedAt = new Date();
    const actualDuration =
      dto.actualDuration ??
      (intervention.startedAt
        ? Math.round(
            (completedAt.getTime() - intervention.startedAt.getTime()) / 60000,
          )
        : undefined);

    const updated = await this.prisma.intervention.update({
      where: { id },
      data: {
        status: InterventionStatus.COMPLETED,
        completedAt,
        report: dto.report,
        actualDuration,
        clientSignature: dto.clientSignature,
      },
      include: INCLUDE,
    });

    await this.notificationsService.create({
      userId: updated.clientId,
      title: 'Intervention terminée',
      message: `La mission « ${updated.title} » est terminée. Le compte rendu est disponible.`,
      type: NotificationType.SUCCESS,
      icon: 'check-circle',
      link: `/espace-client/interventions/${updated.id}`,
    });

    // Le rapport PDF est un bonus joint à l'e-mail : une erreur de
    // génération (ex : signature illisible) ne doit jamais empêcher la
    // clôture de la mission elle-même.
    let reportAttachment: EmailAttachment | undefined;
    try {
      reportAttachment = {
        filename: `rapport-${updated.reference}.pdf`,
        content: await this.generateReportPdf(updated),
        contentType: 'application/pdf',
      };
    } catch (error) {
      this.logger.warn(
        `Échec de génération du rapport PDF pour ${updated.reference}`,
        error,
      );
    }

    await this.emailService.sendInterventionCompleted(
      updated,
      reportAttachment,
    );
    await this.smsService.sendInterventionCompleted(updated);

    return updated;
  }

  async getReportPdf(user: CurrentUser, id: string): Promise<Buffer> {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable.');
    }

    this.assertCanView(user, intervention);

    if (intervention.status !== InterventionStatus.COMPLETED) {
      throw new BadRequestException(
        'Le rapport est disponible une fois la mission clôturée.',
      );
    }

    return this.generateReportPdf(intervention);
  }

  private generateReportPdf(intervention: {
    reference: string;
    title: string;
    scheduledAt: Date;
    startedAt: Date | null;
    completedAt: Date | null;
    actualDuration: number | null;
    observations: string | null;
    report: string | null;
    clientSignature: string | null;
    client: { nom: string; prenom: string };
    technician: { nom: string; prenom: string } | null;
    materials: { name: string; quantity: number }[];
  }): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    drawPdfHeader(doc, "Rapport d'intervention — Buzzitech Assistance");

    doc.fontSize(12).text(`Référence : ${intervention.reference}`);
    doc.text(`Mission : ${intervention.title}`);
    doc.moveDown();

    doc.text(
      `Client : ${intervention.client.prenom} ${intervention.client.nom}`,
    );
    if (intervention.technician) {
      doc.text(
        `Technicien : ${intervention.technician.prenom} ${intervention.technician.nom}`,
      );
    }
    doc.moveDown();

    doc.text(
      `Planifiée le : ${intervention.scheduledAt.toISOString().split('T')[0]}`,
    );
    if (intervention.startedAt) {
      doc.text(
        `Démarrée le : ${intervention.startedAt.toLocaleString('fr-FR')}`,
      );
    }
    if (intervention.completedAt) {
      doc.text(
        `Terminée le : ${intervention.completedAt.toLocaleString('fr-FR')}`,
      );
    }
    if (intervention.actualDuration) {
      doc.text(`Durée réelle : ${intervention.actualDuration} minutes`);
    }
    doc.moveDown();

    if (intervention.observations) {
      doc.font('Helvetica-Bold').text('Observations', { underline: true });
      doc.font('Helvetica').moveDown(0.5);
      doc.text(intervention.observations, { width: 500 });
      doc.moveDown();
    }

    doc.font('Helvetica-Bold').text('Compte rendu', { underline: true });
    doc.font('Helvetica').moveDown(0.5);
    doc.text(intervention.report ?? '', { width: 500 });
    doc.moveDown();

    if (intervention.materials.length > 0) {
      doc.font('Helvetica-Bold').text('Matériel utilisé', { underline: true });
      doc.font('Helvetica').moveDown(0.5);
      for (const material of intervention.materials) {
        doc.text(`• ${material.name} × ${material.quantity}`);
      }
      doc.moveDown();
    }

    if (intervention.clientSignature) {
      const base64 = intervention.clientSignature.split(',').pop();
      if (base64) {
        doc.moveDown();
        doc
          .font('Helvetica-Bold')
          .text('Signature du client', { underline: true });
        doc.moveDown(0.5);
        doc.image(Buffer.from(base64, 'base64'), { fit: [200, 100] });
      }
    }

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#666666')
      .text(
        'Buzzitech Assistance — Ouagadougou, Burkina Faso — info@buzzitech.com',
        { align: 'center' },
      );

    doc.end();

    return endPromise;
  }

  async rateIntervention(
    user: CurrentUser,
    id: string,
    dto: RateInterventionDto,
  ) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable.');
    }

    if (intervention.clientId !== user.id) {
      throw new ForbiddenException(
        'Seul le client concerné peut noter cette intervention.',
      );
    }

    if (intervention.status !== InterventionStatus.COMPLETED) {
      throw new BadRequestException(
        'Seule une mission terminée peut être notée.',
      );
    }

    const updated = await this.prisma.intervention.update({
      where: { id },
      data: {
        clientRating: dto.rating,
        clientRatingComment: dto.comment,
        ratedAt: new Date(),
      },
      include: INCLUDE,
    });

    if (updated.technicianId) {
      await this.notificationsService.create({
        userId: updated.technicianId,
        title: 'Nouvelle note client',
        message: `Le client a noté « ${updated.title} » ${dto.rating}/5.`,
        type: NotificationType.INFO,
        icon: 'star',
        link: `/technicien/missions/${updated.id}`,
      });
    }

    return updated;
  }

  async cancel(id: string) {
    const existing = await this.prisma.intervention.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Intervention introuvable.');
    }

    return this.prisma.intervention.update({
      where: { id },
      data: { status: InterventionStatus.CANCELLED },
      include: INCLUDE,
    });
  }

  // --- Accès aux techniciens (pour le sélecteur d'assignation admin) ---
  async findTechnicians() {
    return this.prisma.user.findMany({
      where: { role: UserRole.TECHNICIEN },
      select: PERSON_SELECT,
      orderBy: { nom: 'asc' },
    });
  }

  // Chiffres du tableau de bord terrain du technicien.
  async getTechnicianStats(technicianId: string) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const activeStatuses: InterventionStatus[] = [
      InterventionStatus.SCHEDULED,
      InterventionStatus.ACCEPTED,
      InterventionStatus.ON_THE_WAY,
      InterventionStatus.IN_PROGRESS,
    ];

    const [active, today, completedThisMonth, ratingAgg] = await Promise.all([
      this.prisma.intervention.count({
        where: { technicianId, status: { in: activeStatuses } },
      }),
      this.prisma.intervention.count({
        where: {
          technicianId,
          status: { in: activeStatuses },
          scheduledAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      this.prisma.intervention.count({
        where: {
          technicianId,
          status: InterventionStatus.COMPLETED,
          completedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      this.prisma.intervention.aggregate({
        where: { technicianId, clientRating: { not: null } },
        _avg: { clientRating: true },
        _count: { clientRating: true },
      }),
    ]);

    return {
      active,
      today,
      completedThisMonth,
      averageRating: ratingAgg._avg.clientRating
        ? Math.round(ratingAgg._avg.clientRating * 10) / 10
        : null,
      ratingCount: ratingAgg._count.clientRating,
    };
  }

  private async paginate(
    where: Prisma.InterventionWhereInput,
    filter: InterventionFilterDto,
  ) {
    const [data, total] = await Promise.all([
      this.prisma.intervention.findMany({
        where,
        include: INCLUDE,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.intervention.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filter.limit)),
      },
    };
  }

  // Charge l'intervention et vérifie que l'utilisateur peut agir dessus
  // (le technicien assigné, ou un admin) — utilisé par toutes les
  // actions d'exécution (démarrer, observations, photos, matériel,
  // clôturer).
  private async getForAction(user: CurrentUser, id: string) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable.');
    }

    if (user.role !== UserRole.ADMIN && intervention.technicianId !== user.id) {
      throw new ForbiddenException('Cette mission ne vous est pas assignée.');
    }

    return intervention;
  }

  private assertCanView(
    user: CurrentUser,
    intervention: { clientId: string; technicianId: string | null },
  ): void {
    if (user.role === UserRole.ADMIN) return;
    if (intervention.technicianId === user.id) return;
    if (intervention.clientId === user.id) return;

    throw new ForbiddenException('Accès refusé à cette intervention.');
  }

  private async assertIsTechnician(userId: string): Promise<void> {
    const technician = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!technician || technician.role !== UserRole.TECHNICIEN) {
      throw new BadRequestException(
        "L'utilisateur assigné doit avoir le rôle Technicien.",
      );
    }
  }

  private async notifyTechnicianAssigned(intervention: {
    id: string;
    technicianId: string | null;
    title: string;
    scheduledAt: Date;
  }): Promise<void> {
    if (!intervention.technicianId) return;

    await this.notificationsService.create({
      userId: intervention.technicianId,
      title: 'Nouvelle mission assignée',
      message: `« ${intervention.title} » — planifiée le ${intervention.scheduledAt.toLocaleDateString('fr-FR')}.`,
      type: NotificationType.INFO,
      icon: 'clipboard-list',
      link: `/technicien/missions/${intervention.id}`,
    });
  }
}
