import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from 'generated/prisma';

import { PrismaService } from '../prisma/prisma.service';

import { CreateBusinessServiceCategoryDto } from './dto/create-business-service-category.dto';
import { UpdateBusinessServiceCategoryDto } from './dto/update-business-service-category.dto';
import { BusinessServiceCategoryFilterDto } from './dto/business-service-category-filter.dto';

import { BusinessServiceCategoryMapper } from './mapper/business-service-category.mapper';

@Injectable()
export class BusinessServiceCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBusinessServiceCategoryDto) {
    const name = dto.name.trim();
    const slug = dto.slug.trim().toLowerCase();

    const exists = await this.prisma.businessServiceCategory.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    });

    if (exists) {
      throw new ConflictException(
        'Une catégorie possède déjà ce nom ou ce slug.',
      );
    }

    const category = await this.prisma.businessServiceCategory.create({
      data: {
        ...dto,

        name,

        slug,
      },

      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    return BusinessServiceCategoryMapper.toResponse(category);
  }

  async findAll(filter: BusinessServiceCategoryFilterDto) {
    const skip = (filter.page - 1) * filter.limit;

    const where: Prisma.BusinessServiceCategoryWhereInput = {
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
        ],
      }),

      ...(filter.isActive !== undefined && {
        isActive: filter.isActive === 'true',
      }),
    };

    const [categories, total] = await Promise.all([
      this.prisma.businessServiceCategory.findMany({
        where,

        skip,

        take: filter.limit,

        orderBy: {
          [filter.sortBy]: filter.order,
        },

        include: {
          _count: {
            select: {
              services: true,
            },
          },
        },
      }),

      this.prisma.businessServiceCategory.count({
        where,
      }),
    ]);

    return {
      data: categories.map((c) => BusinessServiceCategoryMapper.toResponse(c)),

      meta: {
        page: filter.page,

        limit: filter.limit,

        total,

        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.prisma.businessServiceCategory.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    return BusinessServiceCategoryMapper.toResponse(category);
  }

  async update(id: string, dto: UpdateBusinessServiceCategoryDto) {
    await this.findOne(id);

    const name = dto.name?.trim();
    const slug = dto.slug?.trim().toLowerCase();

    if (name || slug) {
      const exists = await this.prisma.businessServiceCategory.findFirst({
        where: {
          id: {
            not: id,
          },

          OR: [...(name ? [{ name }] : []), ...(slug ? [{ slug }] : [])],
        },
      });

      if (exists) {
        throw new ConflictException(
          'Une autre catégorie possède déjà ce nom ou ce slug.',
        );
      }
    }

    const updated = await this.prisma.businessServiceCategory.update({
      where: {
        id,
      },

      data: {
        ...(name && { name }),

        ...(slug && { slug }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),
      },

      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    return BusinessServiceCategoryMapper.toResponse(updated);
  }

  async remove(id: string) {
    await this.findOne(id);

    const services = await this.prisma.businessService.count({
      where: {
        categoryId: id,
      },
    });

    if (services > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette catégorie. Elle contient ${services} service(s).`,
      );
    }

    await this.prisma.businessServiceCategory.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Catégorie supprimée avec succès.',
    };
  }

  async toggleStatus(id: string) {
    const category = await this.prisma.businessServiceCategory.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    const updated = await this.prisma.businessServiceCategory.update({
      where: {
        id,
      },

      data: {
        isActive: !category.isActive,
      },

      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    return BusinessServiceCategoryMapper.toResponse(updated);
  }

  async findActive() {
    const categories = await this.prisma.businessServiceCategory.findMany({
      where: {
        isActive: true,
      },

      orderBy: {
        name: 'asc',
      },

      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    return categories.map((c) => BusinessServiceCategoryMapper.toResponse(c));
  }

  async countServices(id: string) {
    await this.findOne(id);

    const total = await this.prisma.businessService.count({
      where: {
        categoryId: id,
      },
    });

    return {
      categoryId: id,

      services: total,
    };
  }

  async statistics() {
    const [total, active, inactive, used] = await Promise.all([
      this.prisma.businessServiceCategory.count(),

      this.prisma.businessServiceCategory.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.businessServiceCategory.count({
        where: {
          isActive: false,
        },
      }),

      this.prisma.businessServiceCategory.count({
        where: {
          services: {
            some: {},
          },
        },
      }),
    ]);

    return {
      total,

      active,

      inactive,

      used,

      unused: total - used,
    };
  }
}
