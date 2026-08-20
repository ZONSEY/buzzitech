import { NotificationType } from 'generated/prisma';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class NotificationFilterDto extends PaginationDto {
  type?: NotificationType;

  isRead?: boolean;

  from?: string;

  to?: string;

  sortBy = 'createdAt';

  order: 'asc' | 'desc' = 'desc';
}
