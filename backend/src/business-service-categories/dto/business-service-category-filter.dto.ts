import { ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BusinessServiceCategoryFilterDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['name', 'createdAt'])
  sortBy = 'createdAt';

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
