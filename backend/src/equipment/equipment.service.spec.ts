import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('EquipmentService', () => {
  let service: EquipmentService;

  const prisma = {
    equipment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
  });

  describe('create', () => {
    it("convertit les dates avant l'insertion", async () => {
      prisma.equipment.create.mockResolvedValue({ id: 'eq-1' });

      await service.create({
        name: 'Caméra dôme 4MP',
        clientId: 'client-1',
        installedAt: '2026-08-01',
        warrantyUntil: '2028-08-01',
      });

      const createCall = prisma.equipment.create as jest.Mock<
        unknown,
        [{ data: { installedAt: unknown; warrantyUntil: unknown } }]
      >;
      expect(createCall.mock.calls[0][0].data.installedAt).toBeInstanceOf(Date);
      expect(createCall.mock.calls[0][0].data.warrantyUntil).toBeInstanceOf(
        Date,
      );
    });
  });

  describe('remove', () => {
    it('rejette si introuvable', async () => {
      prisma.equipment.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('supprime un équipement existant', async () => {
      prisma.equipment.findUnique.mockResolvedValue({ id: 'eq-1' });

      const result = await service.remove('eq-1');

      expect(prisma.equipment.delete).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
      });
      expect(result.message).toBeDefined();
    });
  });
});
