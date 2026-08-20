import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'generated/prisma';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ProductReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProduct(productId: string) {
    const [reviews, aggregate] = await Promise.all([
      this.prisma.productReview.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, nom: true, prenom: true },
          },
        },
      }),
      this.prisma.productReview.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      data: reviews,
      meta: {
        count: aggregate._count,
        averageRating: aggregate._avg.rating ?? 0,
      },
    };
  }

  async create(userId: string, productId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    const existing = await this.prisma.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      throw new ConflictException(
        'Vous avez déjà laissé un avis sur ce produit.',
      );
    }

    return this.prisma.productReview.create({
      data: {
        userId,
        productId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
      },
    });
  }

  async update(
    user: { id: string; role: UserRole },
    reviewId: string,
    dto: UpdateReviewDto,
  ) {
    const review = await this.findOwnedOrThrow(user, reviewId);

    return this.prisma.productReview.update({
      where: { id: review.id },
      data: {
        rating: dto.rating ?? undefined,
        comment: dto.comment ?? undefined,
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
      },
    });
  }

  async remove(user: { id: string; role: UserRole }, reviewId: string) {
    const review = await this.findOwnedOrThrow(user, reviewId);

    await this.prisma.productReview.delete({ where: { id: review.id } });

    return { success: true };
  }

  private async findOwnedOrThrow(
    user: { id: string; role: UserRole },
    reviewId: string,
  ) {
    const review = await this.prisma.productReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Avis introuvable.');
    }

    if (review.userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Vous ne pouvez pas modifier l'avis d'un autre utilisateur.",
      );
    }

    return review;
  }
}
