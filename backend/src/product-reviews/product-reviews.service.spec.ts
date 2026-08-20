import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProductReviewsService } from './product-reviews.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'generated/prisma';

describe('ProductReviewsService', () => {
  let service: ProductReviewsService;

  const prisma = {
    productReview: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: { findUnique: jest.fn() },
  };

  const client = { id: 'user-1', role: UserRole.CLIENT };
  const admin = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReviewsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProductReviewsService>(ProductReviewsService);
  });

  describe('create', () => {
    it('rejette si le produit est introuvable', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-1', 'prod-1', { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejette si un avis existe déjà pour ce couple utilisateur/produit', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.productReview.findUnique.mockResolvedValue({ id: 'review-1' });

      await expect(
        service.create('user-1', 'prod-1', { rating: 5 }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.productReview.create).not.toHaveBeenCalled();
    });

    it('crée un avis', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'prod-1' });
      prisma.productReview.findUnique.mockResolvedValue(null);
      prisma.productReview.create.mockResolvedValue({ id: 'review-1' });

      const result = await service.create('user-1', 'prod-1', {
        rating: 4,
        comment: 'Bon produit',
      });

      expect(prisma.productReview.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            userId: 'user-1',
            productId: 'prod-1',
            rating: 4,
            comment: 'Bon produit',
          },
        }),
      );
      expect(result).toEqual({ id: 'review-1' });
    });
  });

  describe('update / remove — propriété', () => {
    it("rejette la modification par un autre client que l'auteur", async () => {
      prisma.productReview.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'other-user',
      });

      await expect(
        service.update(client, 'review-1', { rating: 3 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it("autorise un admin à supprimer l'avis d'un autre utilisateur", async () => {
      prisma.productReview.findUnique.mockResolvedValue({
        id: 'review-1',
        userId: 'other-user',
      });

      const result = await service.remove(admin, 'review-1');

      expect(prisma.productReview.delete).toHaveBeenCalledWith({
        where: { id: 'review-1' },
      });
      expect(result).toEqual({ success: true });
    });

    it("rejette si l'avis est introuvable", async () => {
      prisma.productReview.findUnique.mockResolvedValue(null);

      await expect(service.remove(client, 'review-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByProduct', () => {
    it('retourne les avis avec la note moyenne', async () => {
      prisma.productReview.findMany.mockResolvedValue([{ id: 'review-1' }]);
      prisma.productReview.aggregate.mockResolvedValue({
        _avg: { rating: 4.5 },
        _count: 2,
      });

      const result = await service.findByProduct('prod-1');

      expect(result).toEqual({
        data: [{ id: 'review-1' }],
        meta: { count: 2, averageRating: 4.5 },
      });
    });

    it("retourne une moyenne de 0 quand il n'y a aucun avis", async () => {
      prisma.productReview.findMany.mockResolvedValue([]);
      prisma.productReview.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: 0,
      });

      const result = await service.findByProduct('prod-1');

      expect(result.meta).toEqual({ count: 0, averageRating: 0 });
    });
  });
});
