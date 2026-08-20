import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DiscountType, Prisma } from 'generated/prisma';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { PromoCodeFilterDto } from './dto/promo-code-filter.dto';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePromoCodeDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.promoCode.findUnique({
      where: { code },
    });
    if (existing) {
      throw new ConflictException('Ce code promo existe déjà.');
    }

    return this.prisma.promoCode.create({
      data: {
        code,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser ?? 1,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
  }

  async findAll(filter: PromoCodeFilterDto) {
    const where: Prisma.PromoCodeWhereInput = {};
    if (filter.search) {
      where.code = { contains: filter.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        include: { _count: { select: { orders: true } } },
      }),
      this.prisma.promoCode.count({ where }),
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

  async update(id: string, dto: UpdatePromoCodeDto) {
    await this.findOrThrow(id);

    return this.prisma.promoCode.update({
      where: { id },
      data: {
        code: dto.code ? dto.code.trim().toUpperCase() : undefined,
        description: dto.description,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        maxUsesPerUser: dto.maxUsesPerUser,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);

    const usageCount = await this.prisma.order.count({
      where: { promoCodeId: id },
    });
    if (usageCount > 0) {
      throw new ConflictException(
        'Ce code a déjà été utilisé sur des commandes : désactivez-le plutôt que de le supprimer.',
      );
    }

    await this.prisma.promoCode.delete({ where: { id } });
    return { message: 'Code promo supprimé avec succès.' };
  }

  /**
   * Valide un code promo pour un client et un montant de panier donnés, et
   * calcule la remise applicable. Accepte un client Prisma optionnel pour
   * pouvoir être appelée depuis l'intérieur d'une transaction de checkout
   * (garantit que la limite d'utilisation est vérifiée de façon cohérente
   * avec la création de la commande).
   */
  async validate(
    code: string,
    userId: string,
    orderTotal: number,
    client: DbClient = this.prisma,
  ) {
    const promoCode = await client.promoCode.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promoCode || !promoCode.isActive) {
      throw new BadRequestException('Code promo invalide.');
    }

    const now = new Date();
    if (promoCode.startsAt && promoCode.startsAt > now) {
      throw new BadRequestException("Ce code promo n'est pas encore actif.");
    }
    if (promoCode.expiresAt && promoCode.expiresAt < now) {
      throw new BadRequestException('Ce code promo a expiré.');
    }

    if (
      promoCode.minOrderAmount &&
      orderTotal < Number(promoCode.minOrderAmount)
    ) {
      throw new BadRequestException(
        `Ce code nécessite un montant minimum de ${Number(promoCode.minOrderAmount)} FCFA.`,
      );
    }

    if (promoCode.maxUses !== null) {
      const totalUses = await client.order.count({
        where: { promoCodeId: promoCode.id },
      });
      if (totalUses >= promoCode.maxUses) {
        throw new BadRequestException(
          "Ce code promo a atteint son nombre maximum d'utilisations.",
        );
      }
    }

    if (promoCode.maxUsesPerUser !== null) {
      const userUses = await client.order.count({
        where: { promoCodeId: promoCode.id, userId },
      });
      if (userUses >= promoCode.maxUsesPerUser) {
        throw new BadRequestException('Vous avez déjà utilisé ce code promo.');
      }
    }

    const discountAmount =
      promoCode.discountType === DiscountType.PERCENTAGE
        ? Math.round((orderTotal * Number(promoCode.discountValue)) / 100)
        : Math.min(Number(promoCode.discountValue), orderTotal);

    return { promoCode, discountAmount };
  }

  private async findOrThrow(id: string) {
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { id },
    });
    if (!promoCode) {
      throw new NotFoundException('Code promo introuvable.');
    }
    return promoCode;
  }
}
