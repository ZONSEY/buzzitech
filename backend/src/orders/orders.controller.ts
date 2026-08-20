import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from 'generated/prisma';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
// "import type" requis avec isolatedModules + emitDecoratorMetadata,
// puisque ce type apparaît dans la signature d'une méthode décorée.
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { OrderFilterDto } from './dto/order-filter.dto';
import { OrderSummaryDto } from './dto/order-summary.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  // ordersService était utilisé plus bas sans jamais être injecté.
  constructor(private readonly ordersService: OrdersService) {}

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getSummary(): Promise<OrderSummaryDto> {
    return this.ordersService.getSummary();
  }

  @Get('my-commande')
  @UseGuards(JwtAuthGuard)
  getMyOrders(
    @CurrentUser() user: CurrentUserData,
    @Query() filter: OrderFilterDto,
  ) {
    return this.ordersService.getMyOrders(user.id, filter);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOrder(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.ordersService.getOrderById(user, id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelOrder(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.ordersService.cancelByCustomer(user, id);
  }

  @Get(':id/invoice')
  @UseGuards(JwtAuthGuard)
  getInvoice(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.ordersService.getInvoice(user, id);
  }

  @Get(':id/invoice/pdf')
  @UseGuards(JwtAuthGuard)
  async getInvoicePdf(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const buffer = await this.ordersService.getInvoicePdf(user, id);
    return {
      filename: `invoice-${id}.pdf`,
      content: buffer.toString('base64'),
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAllOrders(@Query() filter: OrderFilterDto) {
    return this.ordersService.getOrders(filter);
  }
}
