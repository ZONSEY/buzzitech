import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma, BusinessServiceStatus } from 'generated/prisma';

import { PrismaService } from '../prisma/prisma.service';

import { CreateBusinessServiceDto } from './dto/create-business-service.dto';
import { UpdateBusinessServiceDto } from './dto/update-business-service.dto';
import { BusinessServiceFilterDto } from './dto/business-service-filter.dto';

import { BusinessServiceMapper } from './mapper/business-service.mapper';

@Injectable()
export class BusinessServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusinessServiceDto) {
    const normalizedName = dto.name.trim();
    const normalizedSlug = dto.slug.trim().toLowerCase();

    const exists = await this.prisma.businessService.findFirst({
      where: {
        OR: [{ name: normalizedName }, { slug: normalizedSlug }],
      },
    });

    if (exists) {
      throw new ConflictException(
        'Un service avec ce nom ou ce slug existe déjà.',
      );
    }

    const category = await this.prisma.businessServiceCategory.findUnique({
      where: {
        id: dto.categoryId,
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    const service = await this.prisma.businessService.create({
      data: {
        ...dto,

        name: normalizedName,

        slug: normalizedSlug,
      },

      include: {
        category: true,
      },
    });

    return BusinessServiceMapper.toResponse(service);
  }

  async findAll(filter: BusinessServiceFilterDto) {
    const skip = (filter.page - 1) * filter.limit;

    const where: Prisma.BusinessServiceWhereInput = {
      ...(filter.search && {
        OR: [
          {
            name: {
              contains: filter.search,

              mode: 'insensitive',
            },
          },

          {
            description: {
              contains: filter.search,

              mode: 'insensitive',
            },
          },

          {
            shortDescription: {
              contains: filter.search,

              mode: 'insensitive',
            },
          },
        ],
      }),

      ...(filter.categoryId && {
        categoryId: filter.categoryId,
      }),

      ...(filter.status && {
        status: filter.status,
      }),

      ...(filter.featured !== undefined && {
        featured: filter.featured,
      }),

      ...((filter.minPrice !== undefined || filter.maxPrice !== undefined) && {
        price: {
          ...(filter.minPrice !== undefined && {
            gte: filter.minPrice,
          }),

          ...(filter.maxPrice !== undefined && {
            lte: filter.maxPrice,
          }),
        },
      }),
    };

    const [services, total] = await Promise.all([
      this.prisma.businessService.findMany({
        where,

        skip,

        take: filter.limit,

        orderBy: {
          [filter.sortBy]: filter.order,
        },

        include: {
          category: true,
        },
      }),

      this.prisma.businessService.count({
        where,
      }),
    ]);

    return {
      data: services.map((s) => BusinessServiceMapper.toResponse(s)),

      meta: {
        page: filter.page,

        limit: filter.limit,

        total,

        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }
  async findOne(id: string) {
    const service = await this.prisma.businessService.findUnique({
      where: {
        id,
      },

      include: {
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    return BusinessServiceMapper.toResponse(service);
  }

  async update(id: string, dto: UpdateBusinessServiceDto) {
    await this.findOne(id);

    const normalizedName = dto.name?.trim();

    const normalizedSlug = dto.slug?.trim().toLowerCase();

    if (normalizedName || normalizedSlug) {
      const exists = await this.prisma.businessService.findFirst({
        where: {
          id: {
            not: id,
          },

          OR: [
            ...(normalizedName ? [{ name: normalizedName }] : []),

            ...(normalizedSlug ? [{ slug: normalizedSlug }] : []),
          ],
        },
      });

      if (exists) {
        throw new ConflictException(
          'Un autre service possède déjà ce nom ou ce slug.',
        );
      }
    }

    if (dto.categoryId) {
      const category = await this.prisma.businessServiceCategory.findUnique({
        where: {
          id: dto.categoryId,
        },
      });

      if (!category) {
        throw new NotFoundException('Catégorie introuvable.');
      }
    }

    const updated = await this.prisma.businessService.update({
      where: {
        id,
      },

      data: {
        ...(normalizedName && {
          name: normalizedName,
        }),

        ...(normalizedSlug && {
          slug: normalizedSlug,
        }),

        ...(dto.description && {
          description: dto.description,
        }),

        ...(dto.shortDescription !== undefined && {
          shortDescription: dto.shortDescription,
        }),

        ...(dto.price !== undefined && {
          price: dto.price,
        }),

        ...(dto.estimatedDuration !== undefined && {
          estimatedDuration: dto.estimatedDuration,
        }),

        ...(dto.image !== undefined && {
          image: dto.image,
        }),

        ...(dto.featured !== undefined && {
          featured: dto.featured,
        }),

        ...(dto.status && {
          status: dto.status,
        }),

        ...(dto.categoryId && {
          categoryId: dto.categoryId,
        }),
      },

      include: {
        category: true,
      },
    });

    return BusinessServiceMapper.toResponse(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    const orders = await this.prisma.orderItem.count({
      where: {
        businessServiceId: id,
      },
    });

    if (orders > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce service. Il est présent dans ${orders} commande(s).`,
      );
    }

    await this.prisma.businessService.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Service supprimé avec succès.',
    };
  }

  async toggleStatus(id: string) {
    const service = await this.prisma.businessService.findUnique({
      where: {
        id,
      },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    const updated = await this.prisma.businessService.update({
      where: {
        id,
      },

      data: {
        status:
          service.status === BusinessServiceStatus.AVAILABLE
            ? BusinessServiceStatus.UNAVAILABLE
            : BusinessServiceStatus.AVAILABLE,
      },

      include: {
        category: true,
      },
    });

    return BusinessServiceMapper.toResponse(updated);
  }

  async toggleFeatured(id: string) {
    const service = await this.prisma.businessService.findUnique({
      where: {
        id,
      },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    const updated = await this.prisma.businessService.update({
      where: {
        id,
      },

      data: {
        featured: !service.featured,
      },

      include: {
        category: true,
      },
    });

    return BusinessServiceMapper.toResponse(updated);
  }

  async statistics() {
    const [total, available, unavailable, featured, average] =
      await Promise.all([
        this.prisma.businessService.count(),

        this.prisma.businessService.count({
          where: {
            status: BusinessServiceStatus.AVAILABLE,
          },
        }),

        this.prisma.businessService.count({
          where: {
            status: BusinessServiceStatus.UNAVAILABLE,
          },
        }),

        this.prisma.businessService.count({
          where: {
            featured: true,
          },
        }),

        this.prisma.businessService.aggregate({
          _avg: {
            price: true,
          },
        }),
      ]);

    return {
      total,

      available,

      unavailable,

      featured,

      averagePrice: Number(average._avg.price ?? 0),
    };
  }

  // NOTE: ce bloc était collé au milieu de findAll(), utilisant `id`
  // et `limit` qui n'étaient pas des paramètres de cette méthode —
  // ce qui faisait planter findAll() (ou renvoyait le mauvais
  // résultat) à chaque appel. C'est en réalité le corps de
  // findRelatedServices(), extrait ici dans sa propre méthode.
  async findRelatedServices(id: string, limit = 4) {
    const service = await this.prisma.businessService.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    const related = await this.prisma.businessService.findMany({
      where: {
        id: { not: id },
        categoryId: service.categoryId,
        status: BusinessServiceStatus.AVAILABLE,
      },
      take: limit,
      include: {
        category: true,
      },
    });

    return related.map((s) => BusinessServiceMapper.toResponse(s));
  }

  // Ajouté : le contrôleur appelait déjà findAvailable() et
  // findFeatured(), mais ces méthodes n'existaient pas dans le
  // service.
  async findAvailable() {
    const services = await this.prisma.businessService.findMany({
      where: {
        status: BusinessServiceStatus.AVAILABLE,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return services.map((s) => BusinessServiceMapper.toResponse(s));
  }

  async findFeatured() {
    const services = await this.prisma.businessService.findMany({
      where: {
        featured: true,
        status: BusinessServiceStatus.AVAILABLE,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return services.map((s) => BusinessServiceMapper.toResponse(s));
  }
}
