import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import { OrderStatus, UserRole } from 'generated/prisma';

describe('OrdersService', () => {
  let service: OrdersService;

  const prisma = {
    order: { findFirst: jest.fn(), findUnique: jest.fn() },
    product: { update: jest.fn() },
    $transaction: jest.fn(),
  };

  const auditService = { log: jest.fn() };
  const notificationsService = { create: jest.fn() };
  const emailService = { sendInvoiceEmail: jest.fn() };

  const client = { id: 'user-1', role: UserRole.CLIENT };
  const admin = { id: 'admin-1', role: UserRole.ADMIN };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('getOrderById', () => {
    it('restreint la recherche au propriétaire pour un client', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

      await service.getOrderById(client, 'order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1', userId: client.id },
        }),
      );
    });

    it('ne restreint pas la recherche par utilisateur pour un admin', async () => {
      prisma.order.findFirst.mockResolvedValue({ id: 'order-1' });

      await service.getOrderById(admin, 'order-1');

      expect(prisma.order.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1' } }),
      );
    });

    it('rejette si la commande est introuvable (ou pas la sienne)', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.getOrderById(client, 'order-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  interface FakeOrder {
    id: string;
    status: OrderStatus;
    items: Array<{ productId: string | null; quantity: number }>;
  }

  const runTransaction = (order: FakeOrder | null) => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Partial<FakeOrder> }) => ({
            ...order,
            ...data,
          })),
      },
      product: { update: jest.fn() },
    };
    prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
      cb(tx),
    );
    return tx;
  };

  describe('updateStatus', () => {
    it('rejette si la commande est introuvable', async () => {
      runTransaction(null);

      await expect(
        service.updateStatus('order-1', OrderStatus.CONFIRMED),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejette une transition de statut non autorisée', async () => {
      runTransaction({
        id: 'order-1',
        status: OrderStatus.COMPLETED,
        items: [],
      });

      await expect(
        service.updateStatus('order-1', OrderStatus.PENDING),
      ).rejects.toThrow(BadRequestException);
    });

    it('réapprovisionne le stock des produits en cas d’annulation', async () => {
      const tx = runTransaction({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-1', quantity: 3 }],
      });

      const result = await service.updateStatus(
        'order-1',
        OrderStatus.CANCELLED,
      );

      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { stock: { increment: 3 } },
      });
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('autorise une transition PENDING → CONFIRMED sans toucher au stock', async () => {
      const tx = runTransaction({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [{ productId: 'prod-1', quantity: 2 }],
      });
      // Après confirmation, le service recharge la commande complète pour
      // notifier + générer la facture : on la fournit ici.
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        reference: 'ORD-TEST',
        status: OrderStatus.CONFIRMED,
        createdAt: new Date('2026-01-01'),
        totalAmount: 100,
        subtotal: 100,
        shippingCost: 0,
        discount: 0,
        items: [],
        payments: [],
        address: {},
        user: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
      });

      await service.updateStatus('order-1', OrderStatus.CONFIRMED);

      expect(tx.product.update).not.toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalled();
    });
  });

  describe('cancelByCustomer', () => {
    it("rejette si la commande n'appartient pas au client", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'other-user',
        status: OrderStatus.PENDING,
      });

      await expect(service.cancelByCustomer(client, 'order-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("rejette si la commande n'est plus annulable en libre-service", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: client.id,
        status: OrderStatus.PROCESSING,
      });

      await expect(service.cancelByCustomer(client, 'order-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('annule la commande PENDING du client', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: client.id,
        status: OrderStatus.PENDING,
      });
      runTransaction({
        id: 'order-1',
        status: OrderStatus.PENDING,
        items: [],
      });

      const result = await service.cancelByCustomer(client, 'order-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it("autorise un admin à annuler la commande d'un autre utilisateur", async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        userId: 'other-user',
        status: OrderStatus.CONFIRMED,
      });
      runTransaction({
        id: 'order-1',
        status: OrderStatus.CONFIRMED,
        items: [],
      });

      const result = await service.cancelByCustomer(admin, 'order-1');

      expect(result.status).toBe(OrderStatus.CANCELLED);
    });
  });
});
