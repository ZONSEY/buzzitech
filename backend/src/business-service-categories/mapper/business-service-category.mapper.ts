import { Prisma } from 'generated/prisma';
import { BusinessServiceCategoryResponseDto } from '../dto/business-service-category-response.dto';

type CategoryWithCount = Prisma.BusinessServiceCategoryGetPayload<{
  include: { _count: { select: { services: true } } };
}>;

export class BusinessServiceCategoryMapper {
  static toResponse(
    category: CategoryWithCount,
  ): BusinessServiceCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? undefined,
      isActive: category.isActive,
      servicesCount: category._count?.services ?? 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
