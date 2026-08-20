import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { PaginatedResponse } from 'src/common/pagination/paginated-response';
import { generateOrderReference } from 'src/common/utils/reference.util';
import { drawPdfHeader } from 'src/common/utils/pdf-header.util';
import { drawPdfTable } from 'src/common/utils/pdf-table.util';
import { drawPdfFooters, drawPdfStamp } from 'src/common/utils/pdf-footer.util';
import {
  Order,
  OrderStatus,
  NotificationType,
  Prisma,
  UserRole,
} from 'generated/prisma';

type OrderWithInvoiceRelations = Prisma.OrderGetPayload<{
  include: {
    items: { include: { product: true; businessService: true } };
    payments: true;
    address: true;
    user: true;
  };
}>;
import { ORDER_STATUS_TRANSITIONS } from './constants/order-status-transition';
import { AuditActions } from 'src/audit/constants/audit-actions';
import { AuditService } from 'src/audit/audit.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { EmailService } from 'src/email/email.service';
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    // Ajouté : this.emailService était utilisé sans jamais être injecté.
    private readonly emailService: EmailService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Vérifier l'adresse
      const address = await tx.address.findFirst({
        where: {
          id: dto.addressId,
          userId,
        },
      });

      if (!address) {
        throw new NotFoundException('Adresse introuvable.');
      }
      // 2. Charger le panier
      const cart = await tx.cart.findUnique({
        where: {
          userId,
        },
        include: {
          items: {
            include: {
              product: true,
              businessService: true,
            },
          },
        },
      });
      // 3. Vérifier que le panier n'est pas vide
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Votre panier est vide.');
      }
      // 4. Vérifier le stock
      for (const item of cart.items) {
        if (item.product && item.product.stock < item.quantity) {
          throw new BadRequestException(
            `${item.product.name} : stock insuffisant.`,
          );
        }

        if (item.product && !item.product.isActive) {
          throw new BadRequestException(
            `${item.product.name} est indisponible.`,
          );
        }

        if (
          item.businessService &&
          item.businessService.status !== 'AVAILABLE'
        ) {
          throw new BadRequestException(
            `${item.businessService.name} est indisponible.`,
          );
        }
      }
      // 5. Calculer subtotal
      let subtotal = 0;

      for (const item of cart.items) {
        subtotal += Number(item.unitPrice) * item.quantity;
      }
      // 6. Créer la Commande
      const order = await tx.order.create({
        data: {
          reference: generateOrderReference(),

          userId,

          addressId: dto.addressId,

          subtotal,

          shippingCost: 0,

          discount: 0,

          totalAmount: subtotal,

          notes: dto.notes,

          status: 'PENDING',
        },
        // Ajouté : sendOrderConfirmation() a besoin de order.user
        // (email, nom, prenom) — voir email.service.ts.
        include: {
          user: true,
        },
      });

      await this.auditService.log({
        userId,
        action: AuditActions.CREATE_ORDER,
        entity: 'Order',
        entityId: order.id,
        details: {
          reference: order.reference,
          totalAmount: order.totalAmount,
        },
      });

      await this.notificationsService.create({
        userId: order.userId,
        title: 'Commande créée',
        message: `Votre commande ${order.reference} a été enregistrée.`,
        type: NotificationType.INFO,
        icon: 'shopping-cart',
        link: `/orders/${order.id}`,
      });

      await this.emailService.sendOrderConfirmation(order);

      // 7. Créer les OrderItems
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,

            quantity: item.quantity,

            unitPrice: item.unitPrice,

            productId: item.productId,

            businessServiceId: item.businessServiceId,
          },
        });
      }
      // 8. Décrémenter le stock
      for (const item of cart.items) {
        if (item.productId) {
          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }
      // 9. Vider le panier
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });
      // 10. Retourner la commande
      return {
        message: 'Commande créée avec succès.',
        order,
      };
    });
  }

  async getMyOrders(userId: string, filter: OrderFilterDto) {
    const where: Prisma.OrderWhereInput = {
      userId,
    };

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search) {
      where.OR = [
        {
          reference: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (filter.from || filter.to) {
      where.createdAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined,
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: {
                      isPrimary: true,
                    },
                  },
                },
              },
              businessService: true,
            },
          },
          payments: true,
          address: true,
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: {
          [filter.sortBy]: filter.order,
        },
      }),
      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      data: orders,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    } as PaginatedResponse<Order>;
  }

  async getOrders(filter: OrderFilterDto) {
    const where: Prisma.OrderWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.search) {
      where.OR = [
        {
          reference: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            email: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (filter.from || filter.to) {
      where.createdAt = {
        gte: filter.from ? new Date(filter.from) : undefined,
        lte: filter.to ? new Date(filter.to) : undefined,
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: true,
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: {
                      isPrimary: true,
                    },
                  },
                },
              },
              businessService: true,
            },
          },
          payments: true,
          address: true,
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: {
          [filter.sortBy]: filter.order,
        },
      }),
      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      data: orders,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    } as PaginatedResponse<Order>;
  }

  async getSummary(): Promise<OrderSummaryDto> {
    const totalOrders = await this.prisma.order.count();
    const totalRevenueResult = await this.prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
    });

    const [pending, confirmed, processing, completed, cancelled] =
      await Promise.all([
        this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
        this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
        this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
        this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      ]);

    return {
      totalOrders,
      totalRevenue: Number(totalRevenueResult._sum.totalAmount ?? 0),
      pending,
      confirmed,
      processing,
      completed,
      cancelled,
    };
  }

  async getOrderById(user: { id: string; role: UserRole }, orderId: string) {
    const where: Prisma.OrderWhereInput = {
      id: orderId,
    };

    if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    }

    const order = await this.prisma.order.findFirst({
      where,
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
        payments: true,
        address: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    return order;
  }

  // Annulation en libre-service par le client (contrairement à
  // updateStatus(), réservé aux admins) : autorisée uniquement tant que
  // la commande n'est pas encore passée en préparation, pour éviter
  // d'annuler une commande déjà en cours de traitement logistique.
  async cancelByCustomer(
    user: { id: string; role: UserRole },
    orderId: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || (user.role !== UserRole.ADMIN && order.userId !== user.id)) {
      throw new NotFoundException('Commande introuvable.');
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Cette commande ne peut plus être annulée en ligne. Contactez-nous pour en faire la demande.',
      );
    }

    return this.updateStatus(orderId, OrderStatus.CANCELLED);
  }

  async getInvoice(user: { id: string; role: UserRole }, orderId: string) {
    const where: Prisma.OrderWhereInput = {
      id: orderId,
    };

    if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
            businessService: true,
          },
        },
        payments: true,
        address: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    return this.buildInvoiceHtml(order);
  }

  async getInvoicePdf(
    user: { id: string; role: UserRole },
    orderId: string,
  ): Promise<Buffer> {
    const where: Prisma.OrderWhereInput = {
      id: orderId,
    };

    if (user.role !== UserRole.ADMIN) {
      where.userId = user.id;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
            businessService: true,
          },
        },
        payments: true,
        address: true,
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    return this.generateInvoicePdf(order);
  }

  private async generateInvoicePdf(
    order: OrderWithInvoiceRelations,
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, left: 40, right: 40, bottom: 85 },
      bufferPages: true,
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));

    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    drawPdfHeader(doc, 'Facture Buzzitech');

    const infoRows: Record<string, string>[] = [
      { field: 'Référence', value: order.reference },
      { field: 'Date', value: order.createdAt.toISOString().split('T')[0] },
      { field: 'Statut', value: order.status },
      { field: 'Client', value: `${order.user.prenom} ${order.user.nom}` },
      { field: 'Email', value: order.user.email },
    ];
    if (order.address) {
      infoRows.push({
        field: 'Adresse de livraison',
        value: [
          order.address.recipient,
          order.address.address,
          order.address.city,
          order.address.postalCode,
          order.address.country,
        ]
          .filter(Boolean)
          .join(', '),
      });
    }

    drawPdfTable(
      doc,
      [
        { header: 'Champ', key: 'field', width: 180 },
        { header: 'Détail', key: 'value', width: 335 },
      ],
      infoRows,
    );

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fontSize(12).text('Détails de la commande');
    doc.font('Helvetica').fontSize(11).moveDown(0.5);

    const itemRows = order.items.map((item) => {
      const description =
        item.product?.name ?? item.businessService?.name ?? 'Article';
      const qty = item.quantity;
      return {
        description,
        qty: qty.toString(),
        price: this.formatCurrency(item.unitPrice),
        total: this.formatCurrency(Number(item.unitPrice) * qty),
      };
    });

    drawPdfTable(
      doc,
      [
        { header: 'Description', key: 'description', width: 245 },
        { header: 'Qté', key: 'qty', width: 60, align: 'right' },
        { header: 'Prix', key: 'price', width: 100, align: 'right' },
        { header: 'Total', key: 'total', width: 110, align: 'right' },
      ],
      itemRows,
    );

    doc.moveDown(0.5);
    drawPdfTable(
      doc,
      [
        { header: 'Récapitulatif', key: 'field', width: 355 },
        { header: 'Montant', key: 'value', width: 160, align: 'right' },
      ],
      [
        { field: 'Sous-total', value: this.formatCurrency(order.subtotal) },
        {
          field: 'Livraison',
          value: this.formatCurrency(order.shippingCost),
        },
        {
          field: 'Remise',
          value: `-${this.formatCurrency(order.discount)}`,
        },
        { field: 'Total', value: this.formatCurrency(order.totalAmount) },
        {
          field: 'Méthode de paiement',
          value: order.payments?.[0]?.method ?? 'N/A',
        },
        {
          field: 'Statut du paiement',
          value: order.payments?.[0]?.status ?? 'N/A',
        },
      ],
    );

    doc.moveDown(2);
    drawPdfStamp(doc);

    drawPdfFooters(doc);
    doc.end();

    return endPromise;
  }

  private formatCurrency(value: string | number | Prisma.Decimal): string {
    const amount = Number(value);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private buildInvoiceHtml(order: OrderWithInvoiceRelations) {
    const addressLines: string[] = [];
    if (order.address) {
      addressLines.push(order.address.recipient);
      addressLines.push(order.address.address);
      addressLines.push(order.address.city);
      if (order.address.postalCode) addressLines.push(order.address.postalCode);
      addressLines.push(order.address.country);
    }

    const paymentStatus = order.payments?.[0]?.status ?? 'PENDING';
    const paymentMethod = order.payments?.[0]?.method ?? 'UNKNOWN';

    const rows = order.items
      .map((item) => {
        const description =
          item.product?.name ?? item.businessService?.name ?? 'Article';
        const unitPrice = this.formatCurrency(item.unitPrice);
        const totalPrice = this.formatCurrency(
          Number(item.unitPrice) * item.quantity,
        );

        return `<tr>
        <td style="padding: 8px; border: 1px solid #ccc;">${description}</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align:center;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align:right;">${unitPrice}</td>
        <td style="padding: 8px; border: 1px solid #ccc; text-align:right;">${totalPrice}</td>
      </tr>`;
      })
      .join('');

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Facture ${order.reference}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 0; padding: 24px; }
    .container { max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .header h1 { margin: 0; font-size: 1.8rem; }
    .meta { text-align: right; }
    .section { margin-bottom: 24px; }
    .section h2 { margin-bottom: 12px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }
    table { border-collapse: collapse; width: 100%; }
    th, td { padding: 12px; border: 1px solid #ccc; }
    th { background: #f5f5f5; text-align: left; }
    .totals td { border: none; }
    .totals .label { text-align: right; padding-right: 16px; }
    .totals .value { text-align: right; width: 160px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Facture</h1>
        <p>Référence : <strong>${order.reference}</strong></p>
        <p>Date : <strong>${order.createdAt.toISOString().split('T')[0]}</strong></p>
      </div>
      <div class="meta">
        <p><strong>Buzzitech</strong></p>
        <p>support@buzzitech.com</p>
      </div>
    </div>

    <div class="section">
      <h2>Client</h2>
      <p>${order.user.prenom} ${order.user.nom}</p>
      <p>${order.user.email}</p>
      ${addressLines.length ? `<p>${addressLines.join('<br>')}</p>` : ''}
    </div>

    <div class="section">
      <h2>Détails de la commande</h2>
      <p>Statut : <strong>${order.status}</strong></p>
      <p>Paiement : <strong>${paymentStatus}</strong> (${paymentMethod})</p>
    </div>

    <div class="section">
      <h2>Articles</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>

    <table class="totals" style="margin-top: 24px; width: 100%;">
      <tr>
        <td class="label">Sous-total :</td>
        <td class="value">${this.formatCurrency(order.subtotal)}</td>
      </tr>
      <tr>
        <td class="label">Livraison :</td>
        <td class="value">${this.formatCurrency(order.shippingCost)}</td>
      </tr>
      <tr>
        <td class="label">Remise :</td>
        <td class="value">-${this.formatCurrency(order.discount)}</td>
      </tr>
      <tr>
        <td class="label"><strong>Total</strong></td>
        <td class="value"><strong>${this.formatCurrency(order.totalAmount)}</strong></td>
      </tr>
    </table>

    <div class="section" style="margin-top: 48px;">
      <p>Merci pour votre achat.</p>
      <p>Buzzitech</p>
    </div>
  </div>
</body>
</html>`;
  }

  async updateStatus(orderId: string, newStatus: OrderStatus) {
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException('Commande introuvable.');
      }

      const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status];

      if (!allowedTransitions.includes(newStatus)) {
        throw new BadRequestException(
          `Impossible de passer de ${order.status} à ${newStatus}.`,
        );
      }

      if (newStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
        },
      });
    });

    if (newStatus === OrderStatus.CONFIRMED) {
      const confirmedOrder = await this.prisma.order.findUnique({
        where: { id: updatedOrder.id },
        include: {
          items: {
            include: {
              product: true,
              businessService: true,
            },
          },
          payments: true,
          address: true,
          user: true,
        },
      });

      if (confirmedOrder) {
        await this.notificationsService.create({
          userId: confirmedOrder.userId,
          title: 'Commande confirmée',
          message: 'Votre commande est maintenant en préparation.',
          type: NotificationType.SUCCESS,
          icon: 'package-check',
          link: `/orders/${confirmedOrder.id}`,
        });

        const invoiceBuffer = await this.generateInvoicePdf(confirmedOrder);
        await this.emailService.sendInvoiceEmail(confirmedOrder, {
          filename: `invoice-${confirmedOrder.reference}.pdf`,
          content: invoiceBuffer,
          contentType: 'application/pdf',
        });
      }
    }

    return updatedOrder;
  }
}
