import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { generateSlug } from 'src/common/utils/slug.util';
import { CreateRealisationDto } from './dto/create-realisation.dto';
import { UpdateRealisationDto } from './dto/update-realisation.dto';
import { RealisationQueryDto } from './dto/realisation-query.dto';
import { RealisationMapper } from './mapper/realisation.mapper';

const INCLUDE = {
  category: true,
  images: { orderBy: { displayOrder: 'asc' as const } },
};

@Injectable()
export class RealisationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRealisationDto) {
    const slug = await this.uniqueSlug(dto.title);

    const realisation = await this.prisma.realisation.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        clientName: dto.clientName,
        location: dto.location,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
        featured: dto.featured ?? false,
        isActive: dto.isActive ?? true,
        categoryId: dto.categoryId,
      },
      include: INCLUDE,
    });

    return RealisationMapper.toResponse(realisation);
  }

  async findAll(query: RealisationQueryDto, publicOnly: boolean) {
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.RealisationWhereInput = {
      ...(publicOnly && { isActive: true }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [realisations, total] = await Promise.all([
      this.prisma.realisation.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sort ?? 'createdAt']: query.order ?? 'desc' },
        include: INCLUDE,
      }),
      this.prisma.realisation.count({ where }),
    ]);

    return {
      data: realisations.map((r) => RealisationMapper.toResponse(r)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string) {
    const realisation = await this.prisma.realisation.findUnique({
      where: { id },
      include: INCLUDE,
    });

    if (!realisation) {
      throw new NotFoundException('Réalisation introuvable.');
    }

    return RealisationMapper.toResponse(realisation);
  }

  async findBySlug(slug: string) {
    const realisation = await this.prisma.realisation.findUnique({
      where: { slug },
      include: INCLUDE,
    });

    if (!realisation) {
      throw new NotFoundException('Réalisation introuvable.');
    }

    return RealisationMapper.toResponse(realisation);
  }

  async update(id: string, dto: UpdateRealisationDto) {
    await this.findOne(id);

    const realisation = await this.prisma.realisation.update({
      where: { id },
      data: {
        ...dto,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
      },
      include: INCLUDE,
    });

    return RealisationMapper.toResponse(realisation);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.realisation.delete({ where: { id } });
    return { message: 'Réalisation supprimée avec succès.' };
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base = generateSlug(title);
    let slug = base;
    let suffix = 1;

    while (await this.prisma.realisation.findUnique({ where: { slug } })) {
      suffix += 1;
      slug = `${base}-${suffix}`;

      if (suffix > 50) {
        throw new ConflictException(
          'Impossible de générer un slug unique pour ce titre.',
        );
      }
    }

    return slug;
  }
}
