import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationMapper } from './mapper/notification.mapper';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { NotificationType, UserRole, Notification } from 'generated/prisma';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private emitNotification(userId: string, notification: Notification) {
    if (!this.notificationsGateway) {
      return;
    }

    this.notificationsGateway.sendNotification(userId, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      icon: notification.icon,
      metadata: notification.metadata,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });
  }

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: dto,
    });

    const response = NotificationMapper.toResponse(notification);
    this.emitNotification(notification.userId, notification);

    return response;
  }

  async findAll(filter: NotificationFilterDto) {
    const skip = (filter.page - 1) * filter.limit;

    const where = {
      type: filter.type,
      isRead: filter.isRead,
      createdAt:
        filter.from || filter.to
          ? {
              gte: filter.from ? new Date(filter.from) : undefined,
              lte: filter.to ? new Date(filter.to) : undefined,
            }
          : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: filter.limit,
        orderBy: {
          [filter.sortBy]: filter.order,
        },
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: items.map((n) => NotificationMapper.toResponse(n)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findMine(userId: string, filter: NotificationFilterDto) {
    const skip = (filter.page - 1) * filter.limit;

    const where = {
      userId,

      type: filter.type,

      isRead: filter.isRead,

      createdAt:
        filter.from || filter.to
          ? {
              gte: filter.from ? new Date(filter.from) : undefined,

              lte: filter.to ? new Date(filter.to) : undefined,
            }
          : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,

        skip,

        take: filter.limit,

        orderBy: {
          [filter.sortBy]: filter.order,
        },
      }),

      this.prisma.notification.count({
        where,
      }),
    ]);

    return {
      data: items.map((n) => NotificationMapper.toResponse(n)),

      meta: {
        page: filter.page,

        limit: filter.limit,

        total,

        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification introuvable');
    }

    return NotificationMapper.toResponse(notification);
  }

  async markAsRead(id: string) {
    const notification = await this.prisma.notification.update({
      where: { id },

      data: {
        isRead: true,

        readAt: new Date(),
      },
    });

    return NotificationMapper.toResponse(notification);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,

        isRead: false,
      },

      data: {
        isRead: true,

        readAt: new Date(),
      },
    });
  }

  async delete(id: string) {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async deleteAllRead(userId: string) {
    await this.prisma.notification.deleteMany({
      where: {
        userId,

        isRead: true,
      },
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,

        isRead: false,
      },
    });
  }

  async getSummary(userId: string) {
    const [total, unread, success, warnings, errors] = await Promise.all([
      this.prisma.notification.count({
        where: { userId },
      }),

      this.countUnread(userId),

      this.prisma.notification.count({
        where: {
          userId,

          type: NotificationType.SUCCESS,
        },
      }),

      this.prisma.notification.count({
        where: {
          userId,

          type: NotificationType.WARNING,
        },
      }),

      this.prisma.notification.count({
        where: {
          userId,

          type: NotificationType.ERROR,
        },
      }),
    ]);

    return {
      total,

      unread,

      success,

      warnings,

      errors,
    };
  }
  async notifyAdmins(dto: Omit<CreateNotificationDto, 'userId'>) {
    const admins = await this.prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
      },
    });

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        ...dto,
        userId: admin.id,
      })),
    });
  }
}
