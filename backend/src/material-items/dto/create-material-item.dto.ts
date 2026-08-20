import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateMaterialItemDto {
  @ApiProperty({ example: 'Caméra dôme 4MP' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'unité' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ description: 'Seuil pour alerte de stock bas' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minStockAlert?: number;
}
