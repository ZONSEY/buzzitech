import { InventoryDto } from './inventory.dto';
import { OrdersAnalyticsDto } from './orders.dto';
import { OverviewDto } from './overview.dto';
import { ProjectsAnalyticsDto } from './projects.dto';
import { SalesDto } from './sales.dto';
import { UsersAnalyticsDto } from './users.dto';

export class DashboardResponseDto {
  overview: OverviewDto;

  orders: OrdersAnalyticsDto;

  inventory: InventoryDto;

  users: UsersAnalyticsDto;

  projects: ProjectsAnalyticsDto;

  sales: SalesDto[];

  latestOrders: any[];

  recentActivities: any[];

  topProducts: any[];

  topServices: any[];
}
