import { Injectable } from '@nestjs/common';
import { AuditSeverity, Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditLog } from './interfaces/audit-log.interface';
import { AuditFilterDto } from './dto/audit-filter.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLog) {
    return this.prisma.audit.create({
      data: {
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        // Record<string, unknown> n'est pas structurellement compatible
        // avec le type JSON de Prisma (InputJsonValue) à cause de la
        // variance sur les tableaux readonly : cast explicite nécessaire.
        details: data.details as Prisma.InputJsonValue | undefined,
        success: data.success ?? true,
        severity: data.severity ?? AuditSeverity.INFO,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        userId: data.userId,
      },
    });
  }

  async findAll(filters: AuditFilterDto) {
    const page = filters.page;

    const limit = filters.limit;

    const skip = (page - 1) * limit;

    const where = {
      action: filters.action,

      entity: filters.entity,

      userId: filters.userId,

      createdAt:
        filters.from || filters.to
          ? {
              gte: filters.from ? new Date(filters.from) : undefined,

              lte: filters.to ? new Date(filters.to) : undefined,
            }
          : undefined,
    };

    // Une clé calculée ne peut pas être undefined : filters.sortBy est
    // optionnel dans AuditFilterDto, d'où le fallback sur 'createdAt'.
    const sortBy = filters.sortBy ?? 'createdAt';
    const order = filters.order ?? 'desc';

    const [items, total] = await Promise.all([
      this.prisma.audit.findMany({
        where,

        skip,

        take: limit,

        orderBy: {
          [sortBy]: order,
        },

        include: {
          user: {
            select: {
              nom: true,

              prenom: true,

              email: true,
            },
          },
        },
      }),

      this.prisma.audit.count({
        where,
      }),
    ]);

    return {
      data: items,

      meta: {
        page,

        limit,

        total,

        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
