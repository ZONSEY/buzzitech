import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('WishlistService', () => {
  let service: WishlistService;

  const prisma = {
    wishlistItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    product: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
  });

  describe('add', () => {
    it('rejette si le produit est introuvable', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.add('user-1', 'prod-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
    });

    it('rejette si le produit est déjà dans la liste', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.wishlistItem.findUnique.mockResolvedValue({ id: 'item-1' });

      await expect(service.add('user-1', 'prod-1')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.wishlistItem.create).not.toHaveBeenCalled();
    });

    it('ajoute le produit à la liste de souhaits', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.wishlistItem.findUnique.mockResolvedValue(null);

      const result = await service.add('user-1', 'prod-1');

      expect(prisma.wishlistItem.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', productId: 'prod-1' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('remove', () => {
    it("rejette si le produit n'est pas dans la liste", async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue(null);

      await expect(service.remove('user-1', 'prod-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.wishlistItem.delete).not.toHaveBeenCalled();
    });

    it('retire le produit de la liste de souhaits', async () => {
      prisma.wishlistItem.findUnique.mockResolvedValue({ id: 'item-1' });

      const result = await service.remove('user-1', 'prod-1');

      expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('findMine', () => {
    it("retourne les produits de la liste de souhaits de l'utilisateur", async () => {
      prisma.wishlistItem.findMany.mockResolvedValue([
        {
          id: 'item-1',
          createdAt: new Date('2026-01-01'),
          product: { id: 'prod-1', name: 'Écran' },
        },
      ]);

      const result = await service.findMine('user-1');

      expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result).toEqual([
        {
          id: 'item-1',
          createdAt: new Date('2026-01-01'),
          product: { id: 'prod-1', name: 'Écran' },
        },
      ]);
    });
  });
});
