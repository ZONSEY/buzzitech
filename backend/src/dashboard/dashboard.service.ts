import { Injectable } from '@nestjs/common';
import {
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ProjectStatus,
  UserRole,
} from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      overview,
      sales,
      orders,
      projects,
      inventory,
      users,
      kpis,
      trends,
      alerts,
      latestOrders,
      recentActivities,
      topProducts,
      topServices,
    ] = await Promise.all([
      this.getOverview(),
      this.getSalesAnalytics(),
      this.getOrderAnalytics(),
      this.getProjectAnalytics(),
      this.getInventoryAnalytics(),
      this.getUserAnalytics(),
      this.getKpis(),
      this.getTrends(),
      this.getAlerts(),
      this.getLatestOrders(),
      this.getRecentActivities(),
      this.getTopProducts(),
      this.getTopServices(),
    ]);

    return {
      overview,
      sales,
      orders,
      projects,
      inventory,
      users,
      kpis,
      trends,
      alerts,
      latestOrders,
      recentActivities,
      topProducts,
      topServices,
    };
  }

  private async getOverview() {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalServices,
      totalProjects,
      unreadMessages,
      pendingOrders,
      revenue,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.order.count(),

      this.prisma.product.count(),

      this.prisma.businessService.count(),

      this.prisma.projectRequest.count(),

      this.prisma.contactMessage.count({
        where: {
          isRead: false,
        },
      }),

      this.prisma.order.count({
        where: {
          status: OrderStatus.PENDING,
        },
      }),

      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
        },

        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalUsers,

      totalOrders,

      totalProducts,

      totalServices,

      totalProjects,

      unreadMessages,

      pendingOrders,

      revenue: revenue._sum.amount ?? 0,
    };
  }

  private async getSalesAnalytics() {
    const DAYS = 30;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (DAYS - 1));

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    // Initialisation des 30 derniers jours à 0
    const salesMap = new Map<string, number>();

    for (let i = 0; i < DAYS; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const key = date.toISOString().split('T')[0];

      salesMap.set(key, 0);
    }

    // Ajout des montants des paiements
    for (const payment of payments) {
      if (!payment.paidAt) continue;

      const key = payment.paidAt.toISOString().split('T')[0];

      const amount = salesMap.get(key) ?? 0;

      salesMap.set(key, amount + Number(payment.amount));
    }

    return Array.from(salesMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  }

  private async getOrderAnalytics() {
    const statuses = await this.prisma.order.groupBy({
      by: ['status'],

      _count: true,
    });

    return statuses.reduce(
      (acc, item) => {
        acc[item.status] = item._count;

        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private async getProjectAnalytics() {
    const result = await this.prisma.projectRequest.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const analytics = {
      new: 0,
      analysis: 0,
      approved: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const item of result) {
      switch (item.status) {
        case ProjectStatus.NEW:
          analytics.new = item._count.status;
          break;

        case ProjectStatus.ANALYSIS:
          analytics.analysis = item._count.status;
          break;

        case ProjectStatus.APPROVED:
          analytics.approved = item._count.status;
          break;

        case ProjectStatus.IN_PROGRESS:
          analytics.inProgress = item._count.status;
          break;

        case ProjectStatus.COMPLETED:
          analytics.completed = item._count.status;
          break;

        case ProjectStatus.CANCELLED:
          analytics.cancelled = item._count.status;
          break;
      }
    }

    return analytics;
  }

  private async getInventoryAnalytics() {
    const [lowStock, outOfStock, products] = await Promise.all([
      this.prisma.product.count({
        where: {
          stock: {
            gt: 0,
            lte: 5,
          },
        },
      }),

      this.prisma.product.count({
        where: {
          stock: 0,
        },
      }),

      this.prisma.product.findMany({
        select: {
          stock: true,
          price: true,
        },
      }),
    ]);

    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.price) * product.stock,
      0,
    );

    return {
      lowStock,
      outOfStock,
      inventoryValue,
    };
  }

  private async getUserAnalytics() {
    const [total, groupedRoles] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.groupBy({
        by: ['role'],
        _count: {
          role: true,
        },
      }),
    ]);

    const analytics = {
      total,
      admins: 0,
      techniciens: 0,
      clients: 0,
    };

    for (const item of groupedRoles) {
      switch (item.role) {
        case UserRole.ADMIN:
          analytics.admins = item._count.role;
          break;

        case UserRole.TECHNICIEN:
          analytics.techniciens = item._count.role;
          break;

        case UserRole.CLIENT:
          analytics.clients = item._count.role;
          break;
      }
    }

    return analytics;
  }

  // NOTE: les dernières commandes, produits et services les plus
  // vendus n'existaient pas encore — implémentation ajoutée pour
  // que getDashboard() compile. À ajuster selon tes besoins exacts
  // (nombre d'éléments, champs inclus, période de calcul...).

  private async getLatestOrders() {
    return this.prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  private async getTopProducts() {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        productId: { not: null },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const productIds = grouped
      .map((item) => item.productId)
      .filter((id): id is string => id !== null);

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    return grouped.map((item) => ({
      product: products.find((p) => p.id === item.productId) ?? null,
      totalSold: item._sum.quantity ?? 0,
    }));
  }

  private async getTopServices() {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ['businessServiceId'],
      where: {
        businessServiceId: { not: null },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const serviceIds = grouped
      .map((item) => item.businessServiceId)
      .filter((id): id is string => id !== null);

    const services = await this.prisma.businessService.findMany({
      where: {
        id: { in: serviceIds },
      },
    });

    return grouped.map((item) => ({
      service: services.find((s) => s.id === item.businessServiceId) ?? null,
      totalSold: item._sum.quantity ?? 0,
    }));
  }

  private async getRecentActivities() {
    return this.prisma.audit.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            nom: true,
            prenom: true,
          },
        },
      },
    });
  }

  private async getKpis() {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const [averageOrder, ordersToday, usersToday, averageBudget] =
      await Promise.all([
        this.prisma.order.aggregate({
          _avg: {
            totalAmount: true,
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),

        this.prisma.user.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),

        this.prisma.projectRequest.aggregate({
          _avg: {
            estimatedCost: true,
          },
        }),
      ]);

    return {
      averageOrderValue: Number(averageOrder._avg.totalAmount ?? 0),

      ordersToday,

      newUsersToday: usersToday,

      averageProjectsBudget: Number(averageBudget._avg.estimatedCost ?? 0),
    };
  }
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Number((((current - previous) / previous) * 100).toFixed(2));
  }
  private async getTrends() {
    const currentStart = new Date();
    currentStart.setDate(currentStart.getDate() - 30);

    const previousStart = new Date();
    previousStart.setDate(previousStart.getDate() - 60);

    const previousEnd = new Date();
    previousEnd.setDate(previousEnd.getDate() - 30);

    const [currentRevenue, previousRevenue, currentOrders, previousOrders] =
      await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: 'PAID',
            paidAt: {
              gte: currentStart,
            },
          },

          _sum: {
            amount: true,
          },
        }),

        this.prisma.payment.aggregate({
          where: {
            status: 'PAID',
            paidAt: {
              gte: previousStart,
              lt: previousEnd,
            },
          },

          _sum: {
            amount: true,
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: {
              gte: currentStart,
            },
          },
        }),

        this.prisma.order.count({
          where: {
            createdAt: {
              gte: previousStart,
              lt: previousEnd,
            },
          },
        }),
      ]);

    const currentRevenueValue = Number(currentRevenue._sum.amount ?? 0);

    const previousRevenueValue = Number(previousRevenue._sum.amount ?? 0);

    return {
      revenue: {
        current: currentRevenueValue,

        previous: previousRevenueValue,

        growth: this.calculateGrowth(
          currentRevenueValue,

          previousRevenueValue,
        ),
      },

      orders: {
        current: currentOrders,

        previous: previousOrders,

        growth: this.calculateGrowth(
          currentOrders,

          previousOrders,
        ),
      },
    };
  }

  private async getAlerts() {
    const [
      outOfStock,
      lowStock,
      unreadMessages,
      pendingOrders,
      newProjects,
      failedPayments,
    ] = await Promise.all([
      this.prisma.product.count({
        where: {
          stock: 0,
        },
      }),

      this.prisma.product.count({
        where: {
          stock: {
            gt: 0,
            lte: 5,
          },
        },
      }),

      this.prisma.contactMessage.count({
        where: {
          isRead: false,
        },
      }),

      this.prisma.order.count({
        where: {
          status: OrderStatus.PENDING,
        },
      }),

      this.prisma.projectRequest.count({
        where: {
          status: ProjectStatus.NEW,
        },
      }),

      this.prisma.payment.count({
        where: {
          status: PaymentStatus.FAILED,
        },
      }),
    ]);

    return {
      outOfStock,
      lowStock,
      unreadMessages,
      pendingOrders,
      newProjects,
      failedPayments,
    };
  }
  private async getNotificationsAnalytics() {
    const [total, unread, success, warning, error] = await Promise.all([
      this.prisma.notification.count(),

      this.prisma.notification.count({
        where: {
          isRead: false,
        },
      }),

      this.prisma.notification.count({
        where: {
          type: NotificationType.SUCCESS,
        },
      }),

      this.prisma.notification.count({
        where: {
          type: NotificationType.WARNING,
        },
      }),

      this.prisma.notification.count({
        where: {
          type: NotificationType.ERROR,
        },
      }),
    ]);

    return {
      total,
      unread,
      success,
      warning,
      error,
    };
  }

  private async getBrandAnalytics() {
    const [total, active, inactive, withProducts, withoutProducts] =
      await Promise.all([
        this.prisma.brand.count(),

        this.prisma.brand.count({
          where: {
            isActive: true,
          },
        }),

        this.prisma.brand.count({
          where: {
            isActive: false,
          },
        }),

        this.prisma.brand.count({
          where: {
            products: {
              some: {},
            },
          },
        }),

        this.prisma.brand.count({
          where: {
            products: {
              none: {},
            },
          },
        }),
      ]);

    return {
      total,

      active,

      inactive,

      withProducts,

      withoutProducts,
    };
  }
}
