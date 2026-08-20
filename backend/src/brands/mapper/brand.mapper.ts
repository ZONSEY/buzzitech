import { Prisma } from 'generated/prisma';
import { BrandResponseDto } from '../dto/brand-response.dto';

type BrandWithCount = Prisma.BrandGetPayload<{
  include: { _count: { select: { products: true } } };
}>;

export class BrandMapper {
  static toResponse(brand: BrandWithCount): BrandResponseDto {
    return {
      id: brand.id,

      name: brand.name,

      slug: brand.slug,

      logo: brand.logo ?? undefined,

      isActive: brand.isActive,

      productsCount: brand._count?.products ?? 0,

      createdAt: brand.createdAt,

      updatedAt: brand.updatedAt,
    };
  }
}
