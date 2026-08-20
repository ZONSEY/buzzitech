import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(productId: string, filename: string) {
    const url = filename.startsWith('http')
      ? filename
      : `/uploads/products/${filename}`;

    return this.prisma.productImage.create({
      data: {
        productId,
        url,
        isPrimary: false,
      },
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.productImage.delete({
      where: { id },
    });
  }
}
