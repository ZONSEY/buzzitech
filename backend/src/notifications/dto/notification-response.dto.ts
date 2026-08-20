export class NotificationResponseDto {
  id: string;

  title: string;

  message: string;

  type: string;

  isRead: boolean;

  link?: string;

  icon?: string;

  createdAt: Date;
}
