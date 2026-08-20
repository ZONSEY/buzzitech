import { ApiProperty } from '@nestjs/swagger';

export class OrderSummaryDto {
  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty({
    example: 0,
  })
  pending: number;

  @ApiProperty({
    example: 0,
  })
  confirmed: number;

  @ApiProperty({
    example: 0,
  })
  processing: number;

  @ApiProperty({
    example: 0,
  })
  completed: number;

  @ApiProperty({
    example: 0,
  })
  cancelled: number;
}
