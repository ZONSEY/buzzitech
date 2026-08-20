export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  link: string | null;
  icon: string | null;
  createdAt: string;
}

export interface PaginatedNotifications {
  data: AppNotification[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
