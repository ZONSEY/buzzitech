import { Prisma } from 'generated/prisma';
import { BusinessServiceResponseDto } from '../dto/business-service-response.dto';

type ServiceWithCategory = Prisma.BusinessServiceGetPayload<{
  include: { category: true };
}>;

export class BusinessServiceMapper {
  static toResponse(service: ServiceWithCategory): BusinessServiceResponseDto {
    return {
      id: service.id,

      name: service.name,

      slug: service.slug,

      description: service.description,

      shortDescription: service.shortDescription ?? undefined,

      price: Number(service.price),

      estimatedDuration: service.estimatedDuration ?? undefined,

      status: service.status,

      featured: service.featured,

      image: service.image ?? undefined,

      categoryId: service.categoryId,

      categoryName: service.category.name,

      createdAt: service.createdAt,

      updatedAt: service.updatedAt,
    };
  }
}
