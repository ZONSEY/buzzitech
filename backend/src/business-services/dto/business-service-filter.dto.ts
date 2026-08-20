import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { BusinessServiceStatus } from 'generated/prisma';

export class BusinessServiceFilterDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional({
    example: 'développement',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({
    example: 500000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({
    enum: BusinessServiceStatus,
  })
  @IsOptional()
  @IsEnum(BusinessServiceStatus)
  status?: BusinessServiceStatus;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  featured?: boolean;

  @ApiPropertyOptional({
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'price', 'createdAt', 'estimatedDuration'])
  sortBy = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
