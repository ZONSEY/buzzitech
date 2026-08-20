import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartMapper } from './mapper/cart.mapper';
import {
  BusinessServiceStatus,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  NotificationType,
  Order,
  Prisma,
} from 'generated/prisma';
import { CheckoutDto } from './dto/checkout.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import { PromoCodesService } from 'src/promo-codes/promo-codes.service';
import { SmsService } from 'src/sms/sms.service';

// Ajouté : ce type était utilisé par calculateTotals() sans jamais
// être importé ni défini. Il correspond exactement à la forme
// renvoyée par getOrCreateCart() (mêmes `include`).
type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: { include: { images: true } };
        businessService: true;
      };
    };
  };
}>;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    // Ajoutés : nécessaires pour notifier/e-mailer le client après un
    // checkout (voir checkout() plus bas).
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly promoCodesService: PromoCodesService,
    private readonly smsService: SmsService,
  ) {}

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: {
        userId,
      },

      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },

            businessService: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },

        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },

              businessService: true,
            },
          },
        },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    return CartMapper.toResponse(cart);
  }

  // Ajouté : le contrôleur appelle addItem(), mais seules addProduct()
  // et addBusinessService() existaient. addItem() dispatche vers la
  // bonne méthode selon le contenu du DTO (déjà mutuellement exclusif
  // d'après les validations existantes dans chacune).
  async addItem(userId: string, dto: AddCartItemDto) {
    if (dto.productId) {
      return this.addProduct(userId, dto);
    }

    if (dto.businessServiceId) {
      return this.addBusinessService(userId, dto);
    }

    throw new BadRequestException(
      'Vous devez fournir un produit ou un service.',
    );
  }

  async addProduct(userId: string, dto: AddCartItemDto) {
    if (!dto.productId) {
      throw new BadRequestException('Aucun produit fourni.');
    }

    if (dto.businessServiceId) {
      throw new BadRequestException(
        'Utilisez addBusinessService() pour les services.',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    if (!product.isActive) {
      throw new BadRequestException('Produit indisponible.');
    }

    if (product.stock <= 0) {
      throw new BadRequestException('Produit en rupture de stock.');
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = cart.items.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;

      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Stock insuffisant. Disponible : ${product.stock}.`,
        );
      }

      await this.prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
      });
    } else {
      if (dto.quantity > product.stock) {
        throw new BadRequestException(
          `Stock insuffisant. Disponible : ${product.stock}.`,
        );
      }

      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: dto.quantity,
          unitPrice: product.price,
        },
      });
    }

    return CartMapper.toResponse(await this.getOrCreateCart(userId));
  }

  async addBusinessService(userId: string, dto: AddCartItemDto) {
    if (!dto.businessServiceId) {
      throw new BadRequestException('Aucun service fourni.');
    }

    if (dto.productId) {
      throw new BadRequestException('Utilisez addProduct() pour les produits.');
    }

    const service = await this.prisma.businessService.findUnique({
      where: {
        id: dto.businessServiceId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service introuvable.');
    }

    if (service.status !== BusinessServiceStatus.AVAILABLE) {
      throw new BadRequestException(
        'Ce service est actuellement indisponible.',
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = cart.items.find(
      (item) => item.businessServiceId === service.id,
    );

    if (existingItem) {
      return CartMapper.toResponse(cart);
    }

    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,

        businessServiceId: service.id,

        quantity: 1,

        unitPrice: service.price,
      },
    });

    return CartMapper.toResponse(await this.getOrCreateCart(userId));
  }

  async updateQuantity(
    userId: string,
    cartItemId: string,
    dto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((item) => item.id === cartItemId);

    if (!item) {
      throw new NotFoundException('Article introuvable.');
    }

    if (item.businessServiceId) {
      throw new BadRequestException(
        'Impossible de modifier la quantité d’un service.',
      );
    }

    const product = item.product;

    if (!product) {
      throw new NotFoundException('Produit introuvable.');
    }

    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        `Stock insuffisant. Disponible : ${product.stock}.`,
      );
    }

    await this.prisma.cartItem.update({
      where: {
        id: cartItemId,
      },

      data: {
        quantity: dto.quantity,
      },
    });

    return CartMapper.toResponse(await this.getOrCreateCart(userId));
  }
  async removeItem(userId: string, cartItemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = cart.items.find((item) => item.id === cartItemId);

    if (!item) {
      throw new NotFoundException('Article introuvable dans votre panier.');
    }

    await this.prisma.cartItem.delete({
      where: {
        id: cartItemId,
      },
    });

    return CartMapper.toResponse(await this.getOrCreateCart(userId));
  }

  async clear(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return CartMapper.toResponse(await this.getOrCreateCart(userId));
  }

  private calculateTotals(cart: CartWithItems) {
    let productsTotal = 0;

    let servicesTotal = 0;

    let totalItems = 0;

    for (const item of cart.items) {
      const source = item.product ?? item.businessService;

      if (!source) {
        continue;
      }

      const total = Number(source.price) * item.quantity;

      totalItems += item.quantity;

      if (item.product) {
        productsTotal += total;
      } else {
        servicesTotal += total;
      }
    }

    return {
      totalItems,

      productsTotal,

      servicesTotal,

      grandTotal: productsTotal + servicesTotal,
    };
  }

  // Ajouté : méthode extraite depuis l'intérieur de checkout() où elle
  // était incorrectement déclarée (on ne peut pas déclarer une méthode
  // de classe à l'intérieur d'une autre méthode).
  private generateReference(): string {
    const date = new Date();

    return `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}${String(date.getDate()).padStart(2, '0')}-${Date.now()}`;
  }

  async previewPromoCode(userId: string, code: string) {
    const cart = await this.getOrCreateCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Votre panier est vide.');
    }

    const totals = this.calculateTotals(cart);
    const { discountAmount } = await this.promoCodesService.validate(
      code,
      userId,
      totals.grandTotal,
    );

    return {
      subtotal: totals.grandTotal,
      discountAmount,
      total: totals.grandTotal - discountAmount,
    };
  }

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = await this.getOrCreateCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Votre panier est vide.');
    }

    const address = await this.prisma.address.findFirst({
      where: {
        id: dto.addressId,

        userId,
      },
    });

    if (!address) {
      throw new NotFoundException('Adresse introuvable.');
    }

    const totals = this.calculateTotals(cart);

    // NOTE: toute cette logique (vérif stock, création commande/items,
    // décrément stock, paiement, vidage panier, audit) était placée
    // APRÈS un `return this.prisma.$transaction(async (tx) => {});`
    // qui se refermait vide — donc jamais exécutée, et `tx` n'existait
    // plus hors de cette fonction fermée. Tout est maintenant bien
    // à l'intérieur du callback de la transaction.
    const order = await this.prisma.$transaction(
      async (
        tx,
      ): Promise<
        Order & {
          user: {
            email: string;
            nom: string;
            prenom: string;
            telephone: string | null;
          };
        }
      > => {
        let discountAmount = 0;
        let promoCodeId: string | undefined;

        if (dto.promoCode) {
          const validated = await this.promoCodesService.validate(
            dto.promoCode,
            userId,
            totals.grandTotal,
            tx,
          );
          discountAmount = validated.discountAmount;
          promoCodeId = validated.promoCode.id;
        }

        for (const item of cart.items) {
          if (!item.product) {
            continue;
          }

          const product = await tx.product.findUnique({
            where: {
              id: item.product.id,
            },
          });

          if (!product) {
            throw new NotFoundException(`${item.product.name} introuvable.`);
          }

          if (!product.isActive) {
            throw new BadRequestException(`${product.name} est indisponible.`);
          }

          if (product.stock < item.quantity) {
            throw new BadRequestException(
              `Stock insuffisant pour ${product.name}.`,
            );
          }
        }

        // include: { user: true } ajouté : nécessaire pour
        // emailService.sendOrderConfirmation() plus bas, qui a besoin de
        // order.user.email/nom/prenom.
        const createdOrder = await tx.order.create({
          data: {
            reference: this.generateReference(),

            userId,

            addressId: dto.addressId,

            subtotal: totals.grandTotal,

            shippingCost: 0,

            discount: discountAmount,

            promoCodeId,

            totalAmount: totals.grandTotal - discountAmount,

            status: OrderStatus.PENDING,
          },

          include: {
            user: true,
          },
        });

        for (const item of cart.items) {
          const source = item.product ?? item.businessService!;

          await tx.orderItem.create({
            data: {
              orderId: createdOrder.id,

              quantity: item.quantity,

              unitPrice: source.price,

              productId: item.productId,

              businessServiceId: item.businessServiceId,
            },
          });
        }

        for (const item of cart.items) {
          if (!item.product) {
            continue;
          }

          await tx.product.update({
            where: {
              id: item.product.id,
            },

            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        await tx.payment.create({
          data: {
            orderId: createdOrder.id,

            amount: totals.grandTotal - discountAmount,

            gateway: PaymentGateway.STRIPE,

            method: dto.paymentMethod,

            status: PaymentStatus.PENDING,
          },
        });

        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        await tx.audit.create({
          data: {
            userId,

            action: 'CHECKOUT',

            entity: 'Order',

            entityId: createdOrder.id,

            details: {
              total: totals.grandTotal - discountAmount,
              discount: discountAmount,
              items: cart.items.length,
            },
          },
        });

        return createdOrder;
      },
    );

    // NOTE: ces deux appels étaient du code mort après un `return`
    // (donc jamais exécutés), utilisaient des services jamais injectés
    // (notificationService avec un nom légèrement différent de la
    // convention du projet, emailService), et notifyOrderCreated()
    // n'existe pas sur NotificationsService. Remplacé par le même
    // pattern que OrdersService.createOrder().
    await this.notificationsService.create({
      userId,
      title: 'Commande créée',
      message: `Votre commande ${order.reference} a été enregistrée.`,
      type: NotificationType.INFO,
      icon: 'shopping-cart',
      link: `/orders/${order.id}`,
    });

    await this.emailService.sendOrderConfirmation(order);
    await this.smsService.sendOrderConfirmation(order);

    return this.prisma.order.findUnique({
      where: {
        id: order.id,
      },

      include: {
        items: true,

        payments: true,

        address: true,
      },
    });
  }
}
