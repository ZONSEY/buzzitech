import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({
        where: {
          userId,
        },
      });

      // Première adresse => devient automatiquement l'adresse par défaut
      if (count === 0) {
        dto.isDefault = true;
      }

      if (dto.isDefault) {
        await tx.address.updateMany({
          where: {
            userId,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.create({
        data: {
          ...dto,
          userId,
        },
      });
    });
  }

  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });
  }

  async findOne(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Adresse introuvable.');
    }

    return address;
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!address) {
        throw new NotFoundException('Adresse introuvable.');
      }

      if (dto.isDefault) {
        await tx.address.updateMany({
          where: {
            userId,
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.address.update({
        where: {
          id,
        },
        data: dto,
      });
    });
  }

  async setDefault(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!address) {
        throw new NotFoundException('Adresse introuvable.');
      }

      await tx.address.updateMany({
        where: {
          userId,
        },
        data: {
          isDefault: false,
        },
      });

      return tx.address.update({
        where: {
          id,
        },
        data: {
          isDefault: true,
        },
      });
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!address) {
        throw new NotFoundException('Adresse introuvable.');
      }

      const addresses = await tx.address.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (addresses.length === 1) {
        throw new BadRequestException(
          'Vous devez conserver au moins une adresse.',
        );
      }

      await tx.address.delete({
        where: {
          id,
        },
      });

      if (address.isDefault) {
        const nextDefault = addresses.find((a) => a.id !== id);

        if (nextDefault) {
          await tx.address.update({
            where: {
              id: nextDefault.id,
            },
            data: {
              isDefault: true,
            },
          });
        }
      }

      return {
        message: 'Adresse supprimée avec succès.',
      };
    });
  }
}
