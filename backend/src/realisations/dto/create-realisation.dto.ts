import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateRealisationDto {
  @ApiProperty({ example: 'Sécurisation du siège BUZZITECH' })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'Société X' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientName?: string;

  @ApiPropertyOptional({ example: 'Ouagadougou' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Catégorie de service associée' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
