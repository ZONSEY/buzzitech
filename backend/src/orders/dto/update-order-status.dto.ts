import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'generated/prisma';
import { IsEnum } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
