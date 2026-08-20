import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import { PromoCodesService } from 'src/promo-codes/promo-codes.service';
import { SmsService } from 'src/sms/sms.service';
import { BusinessServiceStatus } from 'generated/prisma';

describe('CartService', () => {
  let service: CartService;

  const emptyCart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [] as any[],
  };

  const product = {
    id: 'prod-1',
    name: 'Écran 24"',
    price: 100,
    stock: 5,
    isActive: true,
  };

  const prisma = {
    cart: { findUnique: jest.fn(), create: jest.fn() },
    cartItem: {
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: { findUnique: jest.fn() },
    businessService: { findUnique: jest.fn() },
    address: { findFirst: jest.fn() },
    order: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const notificationsService = { create: jest.fn() };
  const emailService = { sendOrderConfirmation: jest.fn() };
  const promoCodesService = { validate: jest.fn() };
  const smsService = { sendOrderConfirmation: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: EmailService, useValue: emailService },
        { provide: PromoCodesService, useValue: promoCodesService },
        { provide: SmsService, useValue: smsService },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  describe('addProduct', () => {
    it("crée un nouvel article quand le produit n'est pas déjà dans le panier", async () => {
      prisma.product.findUnique.mockResolvedValue(product);
      prisma.cart.findUnique
        .mockResolvedValueOnce({ ...emptyCart })
        .mockResolvedValueOnce({
          ...emptyCart,
          items: [
            {
              id: 'item-1',
              productId: product.id,
              quantity: 2,
              product: { ...product, images: [] },
              businessService: null,
            },
          ],
        });

      const result = await service.addProduct('user-1', {
        productId: product.id,
        quantity: 2,
      });

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: {
          cartId: emptyCart.id,
          productId: product.id,
          quantity: 2,
          unitPrice: product.price,
        },
      });
      expect(result.totalItems).toBe(2);
    });

    it('incrémente la quantité quand le produit est déjà présent', async () => {
      const cartWithItem = {
        ...emptyCart,
        items: [
          {
            id: 'item-1',
            productId: product.id,
            quantity: 1,
            product: { ...product, images: [] },
            businessService: null,
          },
        ],
      };
      prisma.product.findUnique.mockResolvedValue(product);
      prisma.cart.findUnique.mockResolvedValue(cartWithItem);

      await service.addProduct('user-1', {
        productId: product.id,
        quantity: 2,
      });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 3 },
      });
    });

    it('rejette si le produit est introuvable', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.addProduct('user-1', {
          productId: 'missing',
          quantity: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejette si le produit est inactif', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...product,
        isActive: false,
      });

      await expect(
        service.addProduct('user-1', {
          productId: product.id,
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette si le stock est insuffisant', async () => {
      prisma.product.findUnique.mockResolvedValue({ ...product, stock: 1 });
      prisma.cart.findUnique.mockResolvedValue({ ...emptyCart });

      await expect(
        service.addProduct('user-1', {
          productId: product.id,
          quantity: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('addBusinessService', () => {
    it('rejette si le service est indisponible', async () => {
      prisma.businessService.findUnique.mockResolvedValue({
        id: 'svc-1',
        price: 50,
        status: BusinessServiceStatus.UNAVAILABLE,
      });

      await expect(
        service.addBusinessService('user-1', {
          businessServiceId: 'svc-1',
          quantity: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("n'ajoute pas de doublon si le service est déjà dans le panier", async () => {
      prisma.businessService.findUnique.mockResolvedValue({
        id: 'svc-1',
        price: 50,
        status: BusinessServiceStatus.AVAILABLE,
      });
      prisma.cart.findUnique.mockResolvedValue({
        ...emptyCart,
        items: [
          {
            id: 'item-1',
            businessServiceId: 'svc-1',
            quantity: 1,
            product: null,
            businessService: { id: 'svc-1', name: 'Dépannage', price: 50 },
          },
        ],
      });

      await service.addBusinessService('user-1', {
        businessServiceId: 'svc-1',
        quantity: 1,
      });

      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it("rejette si l'article n'appartient pas au panier de l'utilisateur", async () => {
      prisma.cart.findUnique.mockResolvedValue({ ...emptyCart });

      await expect(
        service.removeItem('user-1', 'item-inconnu'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.cartItem.delete).not.toHaveBeenCalled();
    });
  });

  describe('checkout', () => {
    it('rejette si le panier est vide', async () => {
      prisma.cart.findUnique.mockResolvedValue({ ...emptyCart });

      await expect(
        service.checkout('user-1', {
          addressId: 'addr-1',
          paymentMethod: 'STRIPE',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("rejette si l'adresse n'appartient pas à l'utilisateur", async () => {
      prisma.cart.findUnique.mockResolvedValue({
        ...emptyCart,
        items: [
          {
            id: 'item-1',
            productId: product.id,
            quantity: 1,
            product: { ...product, images: [] },
            businessService: null,
          },
        ],
      });
      prisma.address.findFirst.mockResolvedValue(null);

      await expect(
        service.checkout('user-1', {
          addressId: 'addr-1',
          paymentMethod: 'STRIPE',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('crée la commande, notifie et vide le panier en cas de succès', async () => {
      const cartWithItem = {
        ...emptyCart,
        items: [
          {
            id: 'item-1',
            productId: product.id,
            quantity: 2,
            product: { ...product, images: [] },
            businessService: null,
          },
        ],
      };
      prisma.cart.findUnique.mockResolvedValue(cartWithItem);
      prisma.address.findFirst.mockResolvedValue({
        id: 'addr-1',
        userId: 'user-1',
      });

      const createdOrder = {
        id: 'order-1',
        reference: 'ORD-TEST',
        user: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
      };

      const tx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(product),
          update: jest.fn(),
        },
        order: { create: jest.fn().mockResolvedValue(createdOrder) },
        orderItem: { create: jest.fn() },
        payment: { create: jest.fn() },
        cartItem: { deleteMany: jest.fn() },
        audit: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
        cb(tx),
      );
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        reference: 'ORD-TEST',
      });

      const result = await service.checkout('user-1', {
        addressId: 'addr-1',
        paymentMethod: 'STRIPE',
      });

      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: product.id },
        data: { stock: { decrement: 2 } },
      });
      expect(tx.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: cartWithItem.id },
      });
      expect(notificationsService.create).toHaveBeenCalled();
      expect(emailService.sendOrderConfirmation).toHaveBeenCalledWith(
        createdOrder,
      );
      expect(result).toEqual({ id: 'order-1', reference: 'ORD-TEST' });
    });

    it('applique la remise du code promo à la commande et au paiement', async () => {
      const cartWithItem = {
        ...emptyCart,
        items: [
          {
            id: 'item-1',
            productId: product.id,
            quantity: 2,
            product: { ...product, images: [] },
            businessService: null,
          },
        ],
      };
      prisma.cart.findUnique.mockResolvedValue(cartWithItem);
      prisma.address.findFirst.mockResolvedValue({
        id: 'addr-1',
        userId: 'user-1',
      });
      promoCodesService.validate.mockResolvedValue({
        promoCode: { id: 'promo-1' },
        discountAmount: 20,
      });

      const createdOrder = {
        id: 'order-1',
        reference: 'ORD-TEST',
        user: { email: 'a@b.com', nom: 'Doe', prenom: 'John' },
      };

      const tx = {
        product: {
          findUnique: jest.fn().mockResolvedValue(product),
          update: jest.fn(),
        },
        order: { create: jest.fn().mockResolvedValue(createdOrder) },
        orderItem: { create: jest.fn() },
        payment: { create: jest.fn() },
        cartItem: { deleteMany: jest.fn() },
        audit: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
        cb(tx),
      );
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        reference: 'ORD-TEST',
      });

      await service.checkout('user-1', {
        addressId: 'addr-1',
        paymentMethod: 'STRIPE',
        promoCode: 'PROMO10',
      });

      expect(promoCodesService.validate).toHaveBeenCalledWith(
        'PROMO10',
        'user-1',
        200,
        tx,
      );

      const orderCreateCall = tx.order.create as jest.Mock<
        unknown,
        [
          {
            data: {
              discount: number;
              promoCodeId: string;
              totalAmount: number;
            };
          },
        ]
      >;
      expect(orderCreateCall.mock.calls[0][0].data.discount).toBe(20);
      expect(orderCreateCall.mock.calls[0][0].data.promoCodeId).toBe('promo-1');
      expect(orderCreateCall.mock.calls[0][0].data.totalAmount).toBe(180);

      const paymentCreateCall = tx.payment.create as jest.Mock<
        unknown,
        [{ data: { amount: number } }]
      >;
      expect(paymentCreateCall.mock.calls[0][0].data.amount).toBe(180);
    });

    it('rejette si le stock est devenu insuffisant au moment du checkout', async () => {
      prisma.cart.findUnique.mockResolvedValue({
        ...emptyCart,
        items: [
          {
            id: 'item-1',
            productId: product.id,
            quantity: 10,
            product: { ...product, images: [] },
            businessService: null,
          },
        ],
      });
      prisma.address.findFirst.mockResolvedValue({
        id: 'addr-1',
        userId: 'user-1',
      });

      const tx = {
        product: {
          findUnique: jest.fn().mockResolvedValue({ ...product, stock: 1 }),
        },
      };
      prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
        cb(tx),
      );

      await expect(
        service.checkout('user-1', {
          addressId: 'addr-1',
          paymentMethod: 'STRIPE',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
