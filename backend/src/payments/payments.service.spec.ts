import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentFactory } from './payement.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentStatus, UserRole } from 'generated/prisma';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const provider = {
    createCheckout: jest.fn(),
    refund: jest.fn(),
    handleWebhook: jest.fn(),
  };

  const factory = {
    getProvider: jest.fn().mockReturnValue(provider),
  };

  const prisma = {
    order: { findUnique: jest.fn(), update: jest.fn() },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const client = { id: 'user-1', role: UserRole.CLIENT };
  const admin = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    jest.clearAllMocks();
    factory.getProvider.mockReturnValue(provider);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PaymentFactory, useValue: factory },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('checkout', () => {
    it('rejette si la commande est introuvable', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.checkout('order-1', client)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("rejette si la commande n'appartient pas à l'utilisateur (non admin)", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'other-user',
        status: OrderStatus.PENDING,
        totalAmount: 1000,
      });

      await expect(service.checkout('order-1', client)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("autorise un admin à payer la commande d'un autre utilisateur", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'other-user',
        status: OrderStatus.PENDING,
        totalAmount: 1000,
      });
      provider.createCheckout.mockResolvedValue({
        providerPaymentId: 'sess_1',
        providerPaymentIntentId: 'pi_1',
      });

      const result = await service.checkout('order-1', admin);

      expect(result.providerPaymentId).toBe('sess_1');
      expect(prisma.payment.create).toHaveBeenCalled();
    });

    it("rejette si la commande n'est plus PENDING", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: client.id,
        status: OrderStatus.COMPLETED,
        totalAmount: 1000,
      });

      await expect(service.checkout('order-1', client)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('crée le paiement et retourne la réponse du provider', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: client.id,
        status: OrderStatus.PENDING,
        totalAmount: 1000,
      });
      provider.createCheckout.mockResolvedValue({
        providerPaymentId: 'sess_1',
        providerPaymentIntentId: 'pi_1',
      });

      const result = await service.checkout('order-1', client);

      const createCall = prisma.payment.create as jest.Mock<
        unknown,
        [{ data: Record<string, unknown> }]
      >;
      expect(createCall.mock.calls[0][0].data).toMatchObject({
        orderId: 'order-1',
        stripeSessionId: 'sess_1',
        stripePaymentIntentId: 'pi_1',
      });
      expect(result.providerPaymentId).toBe('sess_1');
    });
  });

  describe('getPaymentById', () => {
    it('rejette si le paiement est introuvable', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.getPaymentById('pay-1', client)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("rejette si le paiement n'appartient pas à l'utilisateur", async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        order: { userId: 'other-user' },
      });

      await expect(service.getPaymentById('pay-1', client)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('refund', () => {
    it('rejette si le paiement est introuvable', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      await expect(service.refund('pay-1')).rejects.toThrow(NotFoundException);
    });

    it("rejette si le paiement n'est pas PAID", async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.PENDING,
        order: { id: 'order-1', status: OrderStatus.PENDING },
      });

      await expect(service.refund('pay-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejette si le provider refuse le remboursement', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        gateway: 'STRIPE',
        status: PaymentStatus.PAID,
        order: { id: 'order-1', status: OrderStatus.COMPLETED },
      });
      provider.refund.mockResolvedValue({ success: false });

      await expect(service.refund('pay-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it('marque le paiement remboursé et annule la commande associée', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        gateway: 'STRIPE',
        status: PaymentStatus.PAID,
        order: { id: 'order-1', status: OrderStatus.COMPLETED },
      });
      provider.refund.mockResolvedValue({ success: true });

      const result = await service.refund('pay-1');

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.REFUNDED },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: OrderStatus.CANCELLED },
      });
      expect(result.success).toBe(true);
    });

    it('ne touche pas à une commande déjà annulée', async () => {
      prisma.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        gateway: 'STRIPE',
        status: PaymentStatus.PAID,
        order: { id: 'order-1', status: OrderStatus.CANCELLED },
      });
      provider.refund.mockResolvedValue({ success: true });

      await service.refund('pay-1');

      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });
});
