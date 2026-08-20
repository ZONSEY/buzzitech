import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DiscountType } from 'generated/prisma';

describe('PromoCodesService', () => {
  let service: PromoCodesService;

  const prisma = {
    promoCode: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    order: { count: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromoCodesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PromoCodesService>(PromoCodesService);
  });

  describe('create', () => {
    it('rejette un code déjà existant', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          code: 'PROMO10',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('normalise le code en majuscules', async () => {
      prisma.promoCode.findUnique.mockResolvedValue(null);
      prisma.promoCode.create.mockResolvedValue({ id: 'promo-1' });

      await service.create({
        code: 'promo10',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      });

      const createCall = prisma.promoCode.create as jest.Mock<
        unknown,
        [{ data: { code: string } }]
      >;
      expect(createCall.mock.calls[0][0].data.code).toBe('PROMO10');
    });
  });

  describe('validate', () => {
    const basePromo = {
      id: 'promo-1',
      code: 'PROMO10',
      isActive: true,
      startsAt: null,
      expiresAt: null,
      minOrderAmount: null,
      maxUses: null,
      maxUsesPerUser: 1,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
    };

    it('rejette un code inconnu', async () => {
      prisma.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.validate('BIDON', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejette un code désactivé', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        isActive: false,
      });

      await expect(service.validate('PROMO10', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejette un code pas encore actif', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        startsAt: new Date(Date.now() + 86400000),
      });

      await expect(service.validate('PROMO10', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejette un code expiré', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(service.validate('PROMO10', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejette si le panier est sous le minimum requis', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        minOrderAmount: 5000,
      });

      await expect(service.validate('PROMO10', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejette si le nombre max d'utilisations globales est atteint", async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        maxUses: 5,
      });
      prisma.order.count.mockResolvedValue(5);

      await expect(service.validate('PROMO10', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejette si l'utilisateur a déjà utilisé le code", async () => {
      prisma.promoCode.findUnique.mockResolvedValue(basePromo);
      prisma.order.count.mockResolvedValue(1);

      await expect(service.validate('PROMO10', 'user-1', 1000)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('calcule une remise en pourcentage', async () => {
      prisma.promoCode.findUnique.mockResolvedValue(basePromo);
      prisma.order.count.mockResolvedValue(0);

      const result = await service.validate('PROMO10', 'user-1', 1000);

      expect(result.discountAmount).toBe(100);
    });

    it('plafonne une remise fixe au montant du panier', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({
        ...basePromo,
        discountType: DiscountType.FIXED,
        discountValue: 5000,
      });
      prisma.order.count.mockResolvedValue(0);

      const result = await service.validate('PROMO10', 'user-1', 1000);

      expect(result.discountAmount).toBe(1000);
    });
  });

  describe('remove', () => {
    it('rejette si le code a déjà été utilisé sur des commandes', async () => {
      prisma.promoCode.findUnique.mockResolvedValue({ id: 'promo-1' });
      prisma.order.count.mockResolvedValue(2);

      await expect(service.remove('promo-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejette si le code est introuvable', async () => {
      prisma.promoCode.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
