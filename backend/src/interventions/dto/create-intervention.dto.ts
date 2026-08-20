import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateInterventionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Date/heure planifiée (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ description: 'Client pour lequel la prestation est réalisée' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Technicien assigné (peut être fait plus tard)',
  })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({
    description:
      "Adresse en texte libre si le client n'a pas d'adresse enregistrée",
  })
  @IsOptional()
  @IsString()
  addressText?: string;

  @ApiPropertyOptional({
    description: "Article de commande à l'origine de la mission",
  })
  @IsOptional()
  @IsUUID()
  orderItemId?: string;

  @ApiPropertyOptional({
    description: 'Demande de projet à l’origine de la mission',
  })
  @IsOptional()
  @IsUUID()
  projectRequestId?: string;

  @ApiPropertyOptional({
    description:
      "Latitude du lieu d'intervention (si absente et projectRequestId fourni, copiée depuis la demande de projet)",
  })
  @IsOptional()
  @IsLatitude()
  locationLat?: number;

  @ApiPropertyOptional({
    description:
      "Longitude du lieu d'intervention (si absente et projectRequestId fourni, copiée depuis la demande de projet)",
  })
  @IsOptional()
  @IsLongitude()
  locationLng?: number;

  @ApiPropertyOptional({
    description: 'Adresse lisible associée aux coordonnées',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  locationAddress?: string;
}
