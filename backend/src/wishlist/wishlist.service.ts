import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
            images: true,
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      product: item.product,
    }));
  }

  async add(userId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      throw new ConflictException(
        'Ce produit est déjà dans votre liste de souhaits.',
      );
    }

    await this.prisma.wishlistItem.create({
      data: { userId, productId },
    });

    return { success: true };
  }

  async remove(userId: string, productId: string) {
    const existing = await this.prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!existing) {
      throw new NotFoundException(
        "Ce produit n'est pas dans votre liste de souhaits.",
      );
    }

    await this.prisma.wishlistItem.delete({ where: { id: existing.id } });

    return { success: true };
  }
}
