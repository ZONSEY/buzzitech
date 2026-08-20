import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    example: 'Dell Latitude 5450',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    example: 'dell-latitude-5450',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'Ordinateur portable professionnel Dell Latitude 5450.',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    example: 'DL5450-001',
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    example: 850000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 15,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  featured?: boolean = false;

  @ApiProperty({
    description: 'UUID de la catégorie',
  })
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'UUID de la marque',
  })
  @IsUUID()
  brandId: string;

  @ApiPropertyOptional({
    example: 24,
    description: 'Garantie en mois',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  warranty?: number;

  @ApiPropertyOptional({
    example: 2.35,
    description: 'Poids en kg',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;
}
