import { Prisma } from 'generated/prisma';

type RealisationWithRelations = Prisma.RealisationGetPayload<{
  include: {
    category: true;
    images: { orderBy: { displayOrder: 'asc' } };
  };
}>;

export class RealisationMapper {
  static toResponse(realisation: RealisationWithRelations) {
    return {
      id: realisation.id,
      title: realisation.title,
      slug: realisation.slug,
      description: realisation.description,
      shortDescription: realisation.shortDescription,
      clientName: realisation.clientName,
      location: realisation.location,
      completedAt: realisation.completedAt,
      featured: realisation.featured,
      isActive: realisation.isActive,
      category: realisation.category ?? null,
      images: realisation.images ?? [],
      createdAt: realisation.createdAt,
      updatedAt: realisation.updatedAt,
    };
  }
}
