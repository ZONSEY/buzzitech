import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { generateInterventionReference } from 'src/common/utils/reference.util';
import {
  ContractFrequency,
  InterventionStatus,
  NotificationType,
  Prisma,
} from 'generated/prisma';
import { CreateMaintenanceContractDto } from './dto/create-maintenance-contract.dto';
import { UpdateMaintenanceContractDto } from './dto/update-maintenance-contract.dto';
import { MaintenanceContractFilterDto } from './dto/maintenance-contract-filter.dto';

const CLIENT_SELECT = { id: true, nom: true, prenom: true, email: true };

@Injectable()
export class MaintenanceContractsService {
  private readonly logger = new Logger(MaintenanceContractsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateMaintenanceContractDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();

    return this.prisma.maintenanceContract.create({
      data: {
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        nextScheduledAt: startDate,
        clientId: dto.clientId,
        technicianId: dto.technicianId,
        addressId: dto.addressId,
      },
      include: {
        client: { select: CLIENT_SELECT },
        technician: { select: CLIENT_SELECT },
      },
    });
  }

  async findAll(filter: MaintenanceContractFilterDto) {
    const where: Prisma.MaintenanceContractWhereInput = {};
    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { nom: { contains: filter.search, mode: 'insensitive' } },
              { prenom: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.maintenanceContract.findMany({
        where,
        include: {
          client: { select: CLIENT_SELECT },
          technician: { select: CLIENT_SELECT },
          _count: { select: { interventions: true } },
        },
        orderBy: { nextScheduledAt: 'asc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.maintenanceContract.count({ where }),
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

  async update(id: string, dto: UpdateMaintenanceContractDto) {
    await this.findOrThrow(id);

    return this.prisma.maintenanceContract.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        technicianId: dto.technicianId,
        addressId: dto.addressId,
        isActive: dto.isActive,
      },
      include: {
        client: { select: CLIENT_SELECT },
        technician: { select: CLIENT_SELECT },
      },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    await this.prisma.maintenanceContract.delete({ where: { id } });
    return { message: 'Contrat de maintenance supprimé avec succès.' };
  }

  /**
   * Génère les interventions dues (contrats actifs dont `nextScheduledAt`
   * est atteinte) et avance chaque contrat à sa prochaine échéance.
   * Exécuté automatiquement chaque jour, et exposé via un endpoint admin
   * pour déclenchement manuel (tests, rattrapage).
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async generateDueInterventions(): Promise<{ generated: number }> {
    const now = new Date();

    const due = await this.prisma.maintenanceContract.findMany({
      where: {
        isActive: true,
        nextScheduledAt: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });

    for (const contract of due) {
      const intervention = await this.prisma.intervention.create({
        data: {
          reference: generateInterventionReference(),
          title: contract.title,
          description: contract.description,
          scheduledAt: contract.nextScheduledAt,
          clientId: contract.clientId,
          technicianId: contract.technicianId,
          addressId: contract.addressId,
          maintenanceContractId: contract.id,
          status: InterventionStatus.SCHEDULED,
        },
      });

      if (intervention.technicianId) {
        await this.notificationsService.create({
          userId: intervention.technicianId,
          title: 'Nouvelle mission assignée',
          message: `« ${intervention.title} » (contrat de maintenance) — planifiée le ${intervention.scheduledAt.toLocaleDateString('fr-FR')}.`,
          type: NotificationType.INFO,
          icon: 'clipboard-list',
          link: `/technicien/missions/${intervention.id}`,
        });
      }

      await this.prisma.maintenanceContract.update({
        where: { id: contract.id },
        data: {
          nextScheduledAt: this.advanceDate(
            contract.nextScheduledAt,
            contract.frequency,
          ),
          lastGeneratedAt: now,
        },
      });
    }

    if (due.length > 0) {
      this.logger.log(
        `${due.length} intervention(s) générée(s) depuis des contrats de maintenance.`,
      );
    }

    return { generated: due.length };
  }

  private advanceDate(date: Date, frequency: ContractFrequency): Date {
    const next = new Date(date);
    switch (frequency) {
      case ContractFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case ContractFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        break;
      case ContractFrequency.BIANNUAL:
        next.setMonth(next.getMonth() + 6);
        break;
      case ContractFrequency.ANNUAL:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }

  private async findOrThrow(id: string) {
    const contract = await this.prisma.maintenanceContract.findUnique({
      where: { id },
    });
    if (!contract) {
      throw new NotFoundException('Contrat de maintenance introuvable.');
    }
    return contract;
  }
}
