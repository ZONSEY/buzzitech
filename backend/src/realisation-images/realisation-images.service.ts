import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RealisationImagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(realisationId: string, url: string, isPrimary = false) {
    return this.prisma.realisationImage.create({
      data: {
        realisationId,
        url,
        isPrimary,
      },
    });
  }

  async findByRealisation(realisationId: string) {
    return this.prisma.realisationImage.findMany({
      where: { realisationId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async delete(id: string) {
    return this.prisma.realisationImage.delete({
      where: { id },
    });
  }
}
