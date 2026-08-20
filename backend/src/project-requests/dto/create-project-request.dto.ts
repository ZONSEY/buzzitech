import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProjectRequestDto {
  @ApiProperty({
    example: 'Développement d’une application de gestion scolaire',
  })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiProperty({
    example: 'Je souhaite une application web permettant...',
  })
  @IsString()
  @MaxLength(5000)
  description: string;

  @ApiPropertyOptional({
    example: 2500000,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  budget?: number;

  @ApiPropertyOptional({
    example: '2026-12-15',
  })
  @IsOptional()
  @IsDateString()
  deadline?: Date;

  @ApiPropertyOptional({
    example: 12.3686,
    description: "Latitude du lieu d'intervention choisi sur la carte",
  })
  @IsOptional()
  @IsLatitude()
  locationLat?: number;

  @ApiPropertyOptional({
    example: -1.5275,
    description: "Longitude du lieu d'intervention choisi sur la carte",
  })
  @IsOptional()
  @IsLongitude()
  locationLng?: number;

  @ApiPropertyOptional({
    example: 'Secteur 15, Ouagadougou, Burkina Faso',
    description: 'Adresse lisible associée aux coordonnées (géocodage inverse ou saisie libre)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationAddress?: string;
}
