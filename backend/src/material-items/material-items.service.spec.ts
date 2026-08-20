import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { MaterialItemsService } from './material-items.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('MaterialItemsService', () => {
  let service: MaterialItemsService;

  const prisma = {
    materialItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    interventionMaterial: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialItemsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MaterialItemsService>(MaterialItemsService);
  });

  describe('uploadImage', () => {
    it("rejette si l'article est introuvable", async () => {
      prisma.materialItem.findUnique.mockResolvedValue(null);

      await expect(
        service.uploadImage('missing', 'https://example.com/photo.jpg'),
      ).rejects.toThrow(NotFoundException);
    });

    it("enregistre l'URL de l'image", async () => {
      prisma.materialItem.findUnique.mockResolvedValue({ id: 'mi-1' });
      prisma.materialItem.update.mockResolvedValue({
        id: 'mi-1',
        imageUrl: 'https://example.com/photo.jpg',
      });

      await service.uploadImage('mi-1', 'https://example.com/photo.jpg');

      expect(prisma.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mi-1' },
        data: { imageUrl: 'https://example.com/photo.jpg' },
      });
    });
  });

  describe('removeImage', () => {
    it("efface l'URL de l'image", async () => {
      prisma.materialItem.findUnique.mockResolvedValue({ id: 'mi-1' });
      prisma.materialItem.update.mockResolvedValue({
        id: 'mi-1',
        imageUrl: null,
      });

      await service.removeImage('mi-1');

      expect(prisma.materialItem.update).toHaveBeenCalledWith({
        where: { id: 'mi-1' },
        data: { imageUrl: null },
      });
    });
  });

  describe('remove', () => {
    it('rejette si le catalogue a déjà été utilisé', async () => {
      prisma.materialItem.findUnique.mockResolvedValue({ id: 'mi-1' });
      prisma.interventionMaterial.count.mockResolvedValue(2);

      await expect(service.remove('mi-1')).rejects.toThrow(ConflictException);
    });

    it('rejette si introuvable', async () => {
      prisma.materialItem.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
