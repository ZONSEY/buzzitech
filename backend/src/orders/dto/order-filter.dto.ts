import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from 'generated/prisma';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export type OrderSortBy =
  'createdAt' | 'updatedAt' | 'totalAmount' | 'status' | 'reference';

export class OrderFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'REF-123',
    description: 'Recherche par référence ou email utilisateur',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: '2026-01-01',
  })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
  })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'totalAmount', 'status', 'reference'])
  sortBy: OrderSortBy = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
