import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BusinessServiceStatus } from 'generated/prisma';

const RESULT_LIMIT = 5;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(q: string) {
    const [products, services, realisations] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: { take: 1, orderBy: { displayOrder: 'asc' } },
        },
        take: RESULT_LIMIT,
      }),
      this.prisma.businessService.findMany({
        where: {
          status: BusinessServiceStatus.AVAILABLE,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          image: true,
        },
        take: RESULT_LIMIT,
      }),
      this.prisma.realisation.findMany({
        where: {
          isActive: true,
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          images: { take: 1, orderBy: { displayOrder: 'asc' } },
        },
        take: RESULT_LIMIT,
      }),
    ]);

    return { products, services, realisations };
  }
}
