import { NotificationType } from 'generated/prisma';

export class CreateNotificationDto {
  title: string;

  message: string;

  type: NotificationType;

  link?: string;

  icon?: string;

  metadata?: Record<string, any>;

  userId: string;
}
