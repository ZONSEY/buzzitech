import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentFactory } from './payement.factory';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  UserRole,
} from 'generated/prisma';
import { PaymentFilterDto } from './dto/payment-filter.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly factory: PaymentFactory,
    private readonly prisma: PrismaService,
  ) {}

  async checkout(
    orderId: string,
    user: { id: string; role: UserRole },
    gateway: PaymentGateway = PaymentGateway.STRIPE,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable.');
    }

    if (order.userId !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Vous ne pouvez pas payer cette commande.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Commande invalide');
    }

    const provider = this.factory.getProvider(gateway);

    const response = await provider.createCheckout(order.id);

    const method =
      gateway === PaymentGateway.STRIPE
        ? PaymentMethod.STRIPE
        : PaymentMethod.MOBILE_MONEY;

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        gateway,
        amount: order.totalAmount,
        method,
        // transactionId sert de référence générique pour tous les
        // gateways ; stripeSessionId/stripePaymentIntentId restent en
        // plus pour Stripe, dont le webhook les recherche directement.
        transactionId: response.providerPaymentId,
        stripeSessionId:
          gateway === PaymentGateway.STRIPE
            ? response.providerPaymentId
            : undefined,
        stripePaymentIntentId:
          gateway === PaymentGateway.STRIPE
            ? response.providerPaymentIntentId
            : undefined,
      },
    });

    return response;
  }

  async getPaymentById(id: string, user: { id: string; role: UserRole }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Paiement introuvable.');
    }

    if (user.role !== UserRole.ADMIN && payment.order.userId !== user.id) {
      throw new ForbiddenException('Accès refusé à ce paiement.');
    }

    return payment;
  }

  private buildPaymentWhere(
    filter: PaymentFilterDto,
    userId?: string,
  ): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    if (userId) {
      where.order = { userId };
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.gateway) {
      where.gateway = filter.gateway;
    }

    if (filter.method) {
      where.method = filter.method;
    }

    if (filter.search) {
      where.OR = [
        {
          id: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
        {
          stripeSessionId: {
            contains: filter.search,
            mode: 'insensitive',
          },
        },
        {
          order: {
            reference: {
              contains: filter.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    return where;
  }

  async getPayments(filter: PaymentFilterDto) {
    const where = this.buildPaymentWhere(filter);

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: true,
            },
          },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: {
          [filter.sortBy]: filter.order,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filter.limit)),
      },
    };
  }

  async getMyPayments(userId: string, filter: PaymentFilterDto) {
    const where = this.buildPaymentWhere(filter, userId);

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: true,
            },
          },
        },
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: {
          [filter.sortBy]: filter.order,
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filter.limit)),
      },
    };
  }

  async refund(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Paiement introuvable.');
    }

    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(
        'Seuls les paiements effectués peuvent être remboursés.',
      );
    }

    const provider = this.factory.getProvider(payment.gateway);
    const refundResponse = await provider.refund(payment.id);

    if (!refundResponse.success) {
      throw new BadRequestException('Le remboursement a échoué.');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.REFUNDED },
    });

    if (payment.order && payment.order.status !== OrderStatus.CANCELLED) {
      await this.prisma.order.update({
        where: { id: payment.order.id },
        data: { status: OrderStatus.CANCELLED },
      });
    }

    return refundResponse;
  }

  async handleWebhook(
    payload: Buffer,
    signature: string,
    gateway: PaymentGateway = PaymentGateway.STRIPE,
  ) {
    const provider = this.factory.getProvider(gateway);

    return provider.handleWebhook(payload, signature);
  }
}
