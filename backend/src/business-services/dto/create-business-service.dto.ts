import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import { BusinessServiceStatus } from 'generated/prisma';

export class CreateBusinessServiceDto {
  @ApiProperty({
    example: 'Développement Web',
    description: 'Nom du service',
  })
  @IsString()
  @MaxLength(150)
  name!: string;

  @ApiProperty({
    example: 'developpement-web',
  })
  @IsString()
  slug!: string;

  @ApiProperty({
    example: 'Création de sites web professionnels',
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    example: 'Création de site vitrine',
  })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({
    example: 250000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiPropertyOptional({
    example: 40,
    description: 'Durée estimée en heures',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estimatedDuration?: number;

  @ApiPropertyOptional({
    enum: BusinessServiceStatus,
    default: BusinessServiceStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(BusinessServiceStatus)
  status?: BusinessServiceStatus;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  featured?: boolean;

  @ApiPropertyOptional({
    example: 'https://cdn.buzzitech.com/services/web.jpg',
  })
  @IsOptional()
  @IsUrl()
  image?: string;

  @ApiProperty({
    description: 'Identifiant de la catégorie',
  })
  @IsUUID()
  categoryId!: string;
}
