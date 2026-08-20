import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { DiscountType } from 'generated/prisma';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'BIENVENUE10' })
  @IsString()
  @MaxLength(30)
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({
    description: 'Pourcentage (0-100) ou montant fixe en FCFA selon le type',
  })
  @IsNumber()
  @IsPositive()
  discountValue: number;

  @ApiPropertyOptional({ description: 'Montant minimum du panier' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: "Nombre d'utilisations total maximum" })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({
    default: 1,
    description: 'Nombre max d’utilisations par client',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsesPerUser?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
