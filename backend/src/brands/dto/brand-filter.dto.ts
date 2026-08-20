import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BrandFilterDto {
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
    example: 'hp',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
  })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy = 'createdAt';

  @ApiPropertyOptional({
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: 'asc' | 'desc' = 'desc';
}
