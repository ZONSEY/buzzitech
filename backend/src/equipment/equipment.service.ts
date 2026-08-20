import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from 'generated/prisma';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentFilterDto } from './dto/equipment-filter.dto';

const CLIENT_SELECT = { id: true, nom: true, prenom: true, email: true };

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEquipmentDto) {
    return this.prisma.equipment.create({
      data: {
        name: dto.name,
        category: dto.category,
        brand: dto.brand,
        serialNumber: dto.serialNumber,
        installedAt: dto.installedAt ? new Date(dto.installedAt) : undefined,
        warrantyUntil: dto.warrantyUntil
          ? new Date(dto.warrantyUntil)
          : undefined,
        notes: dto.notes,
        clientId: dto.clientId,
        addressId: dto.addressId,
        interventionId: dto.interventionId,
      },
      include: { client: { select: CLIENT_SELECT }, address: true },
    });
  }

  async findAll(filter: EquipmentFilterDto) {
    const where: Prisma.EquipmentWhereInput = {};
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { brand: { contains: filter.search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { nom: { contains: filter.search, mode: 'insensitive' } },
              { prenom: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        include: { client: { select: CLIENT_SELECT }, address: true },
        orderBy: { installedAt: 'desc' },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
      }),
      this.prisma.equipment.count({ where }),
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

  async findMine(clientId: string) {
    return this.prisma.equipment.findMany({
      where: { clientId },
      include: { address: true },
      orderBy: { installedAt: 'desc' },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.equipment.findMany({
      where: { clientId },
      include: { address: true },
      orderBy: { installedAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateEquipmentDto) {
    await this.findOrThrow(id);

    return this.prisma.equipment.update({
      where: { id },
      data: {
        name: dto.name,
        category: dto.category,
        brand: dto.brand,
        serialNumber: dto.serialNumber,
        installedAt: dto.installedAt ? new Date(dto.installedAt) : undefined,
        warrantyUntil: dto.warrantyUntil
          ? new Date(dto.warrantyUntil)
          : undefined,
        notes: dto.notes,
        addressId: dto.addressId,
      },
      include: { client: { select: CLIENT_SELECT }, address: true },
    });
  }

  async remove(id: string) {
    await this.findOrThrow(id);
    await this.prisma.equipment.delete({ where: { id } });
    return { message: 'Équipement supprimé avec succès.' };
  }

  private async findOrThrow(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
    });
    if (!equipment) {
      throw new NotFoundException('Équipement introuvable.');
    }
    return equipment;
  }
}
