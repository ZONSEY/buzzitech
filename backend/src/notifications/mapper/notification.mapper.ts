import { Notification } from 'generated/prisma';
import { NotificationResponseDto } from '../dto/notification-response.dto';

export class NotificationMapper {
  static toResponse(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      link: notification.link ?? undefined,
      icon: notification.icon ?? undefined,
      createdAt: notification.createdAt,
    };
  }
}
