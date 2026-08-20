import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { CreateMaterialItemDto } from './dto/create-material-item.dto';
import { UpdateMaterialItemDto } from './dto/update-material-item.dto';
import { MaterialItemFilterDto } from './dto/material-item-filter.dto';

@Injectable()
export class MaterialItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaterialItemDto) {
    return this.prisma.materialItem.create({
      data: {
        name: dto.name,
        unit: dto.unit,
        stockQuantity: dto.stockQuantity ?? 0,
        minStockAlert: dto.minStockAlert,
      },
    });
  }

  async findAll(filter: MaterialItemFilterDto) {
    const where: Prisma.MaterialItemWhereInput = {};

    if (filter.activeOnly) {
      where.isActive = true;
    }
    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.materialItem.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.materialItem.count({ where }),
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

  async update(id: string, dto: UpdateMaterialItemDto) {
    await this.findOrThrow(id);

    return this.prisma.materialItem.update({
      where: { id },
      data: {
        name: dto.name,
        unit: dto.unit,
        stockQuantity: dto.stockQuantity,
        minStockAlert: dto.minStockAlert,
        isActive: dto.isActive,
      },
    });
  }

  async uploadImage(id: string, url: string) {
    await this.findOrThrow(id);
    return this.prisma.materialItem.update({
      where: { id },
      data: { imageUrl: url },
    });
  }

  async removeImage(id: string) {
    await this.findOrThrow(id);
    return this.prisma.materialItem.update({
      where: { id },
      data: { imageUrl: null },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);

    const usageCount = await this.prisma.interventionMaterial.count({
      where: { materialItemId: id },
    });
    if (usageCount > 0) {
      throw new ConflictException(
        'Cet article a déjà été utilisé dans des interventions : désactivez-le plutôt que de le supprimer.',
      );
    }

    await this.prisma.materialItem.delete({ where: { id } });
    return { message: 'Article de catalogue supprimé avec succès.' };
  }

  private async findOrThrow(id: string) {
    const item = await this.prisma.materialItem.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Article de catalogue introuvable.');
    }
    return item;
  }
}
