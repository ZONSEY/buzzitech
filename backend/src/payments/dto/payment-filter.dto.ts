import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaymentGateway, PaymentMethod, PaymentStatus } from 'generated/prisma';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export type PaymentSortBy =
  'createdAt' | 'updatedAt' | 'amount' | 'status' | 'gateway' | 'method';

export class PaymentFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'pi_123',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    enum: PaymentGateway,
  })
  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @ApiPropertyOptional({
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'amount', 'status', 'gateway', 'method'])
  sortBy: PaymentSortBy = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
