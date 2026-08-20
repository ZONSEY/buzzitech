import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';

import { BrandMapper } from './mapper/brand.mapper';
import { Prisma } from 'generated/prisma';
import { AuditService } from 'src/audit/audit.service';
@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // Ajouté : userId, nécessaire pour le log d'audit ci-dessous.
  async create(dto: CreateBrandDto, userId: string) {
    const exists = await this.prisma.brand.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: dto.slug }],
      },
    });

    if (exists) {
      throw new ConflictException(
        'Une marque avec ce nom ou ce slug existe déjà.',
      );
    }

    const brand = await this.prisma.brand.create({
      data: {
        ...dto,
        slug: dto.slug.toLowerCase().trim(),
        name: dto.name.trim(),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    await this.auditService.log({
      action: 'CREATE_BRAND',
      entity: 'Brand',
      entityId: brand.id,
      details: {
        name: brand.name,
        slug: brand.slug,
      },
      userId,
    });

    return BrandMapper.toResponse(brand);
  }

  async findAll(filter: BrandFilterDto) {
    const skip = (filter.page - 1) * filter.limit;

    const where: Prisma.BrandWhereInput = {
      ...(filter.search && {
        OR: [
          {
            name: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
          {
            slug: {
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

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,

        skip,

        take: filter.limit,

        orderBy: {
          [filter.sortBy]: filter.order,
        },

        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      }),

      this.prisma.brand.count({
        where,
      }),
    ]);

    return {
      data: brands.map((b) => BrandMapper.toResponse(b)),

      meta: {
        page: filter.page,

        limit: filter.limit,

        total,

        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }
  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: {
        id,
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Marque introuvable.');
    }

    return BrandMapper.toResponse(brand);
  }
  // Ajouté : userId, nécessaire pour le log d'audit ci-dessous.
  async update(id: string, dto: UpdateBrandDto, userId: string) {
    // Capturé pour le log d'audit (avant/après) plus bas.
    const oldBrand = await this.findOne(id);

    if (dto.name || dto.slug) {
      const exists = await this.prisma.brand.findFirst({
        where: {
          id: {
            not: id,
          },

          OR: [
            ...(dto.name ? [{ name: dto.name.trim() }] : []),

            ...(dto.slug ? [{ slug: dto.slug.toLowerCase().trim() }] : []),
          ],
        },
      });

      if (exists) {
        throw new ConflictException(
          'Une autre marque possède déjà ce nom ou ce slug.',
        );
      }
    }

    const brand = await this.prisma.brand.update({
      where: {
        id,
      },

      data: {
        ...(dto.name && {
          name: dto.name.trim(),
        }),

        ...(dto.slug && {
          slug: dto.slug.toLowerCase().trim(),
        }),

        ...(dto.logo !== undefined && {
          logo: dto.logo,
        }),

        // NOTE: le bloc isActive a été retiré ici — UpdateBrandDto
        // (PartialType de CreateBrandDto) n'a pas ce champ, et le
        // changement de statut a déjà sa propre route dédiée :
        // toggleStatus(). Le mélanger dans update() dupliquerait cette
        // logique sans le typage pour le supporter.
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    await this.auditService.log({
      action: 'UPDATE_BRAND',
      entity: 'Brand',
      entityId: brand.id,
      details: {
        before: oldBrand,
        after: brand,
      },
      userId,
    });

    return BrandMapper.toResponse(brand);
  }

  // Ajouté : userId, nécessaire pour le log d'audit ci-dessous.
  async remove(id: string, userId: string) {
    await this.findOne(id);

    const productsCount = await this.prisma.product.count({
      where: {
        brandId: id,
      },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer cette marque. Elle est utilisée par ${productsCount} produit(s).`,
      );
    }

    await this.prisma.brand.delete({
      where: {
        id,
      },
    });

    await this.auditService.log({
      action: 'DELETE_BRAND',
      entity: 'Brand',
      entityId: id,
      userId,
    });

    return {
      message: 'Marque supprimée avec succès.',
    };
  }

  async toggleStatus(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: {
        id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Marque introuvable.');
    }

    const updated = await this.prisma.brand.update({
      where: {
        id,
      },

      data: {
        isActive: !brand.isActive,
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return BrandMapper.toResponse(updated);
  }

  async countProducts(id: string) {
    await this.findOne(id);

    const total = await this.prisma.product.count({
      where: {
        brandId: id,
      },
    });

    return {
      brandId: id,

      products: total,
    };
  }

  async findActive() {
    const brands = await this.prisma.brand.findMany({
      where: {
        isActive: true,
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },

      orderBy: {
        name: 'asc',
      },
    });

    return brands.map((b) => BrandMapper.toResponse(b));
  }

  async findUsed() {
    const brands = await this.prisma.brand.findMany({
      where: {
        products: {
          some: {},
        },
      },

      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return brands.map((b) => BrandMapper.toResponse(b));
  }
}
