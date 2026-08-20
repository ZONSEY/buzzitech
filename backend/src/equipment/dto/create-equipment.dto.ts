import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Caméra dôme 4MP' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Vidéosurveillance' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({
    description: "Date d'installation (défaut : aujourd'hui)",
  })
  @IsOptional()
  @IsDateString()
  installedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  warrantyUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Client propriétaire de cet équipement' })
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({
    description: "Intervention à l'origine de l'installation",
  })
  @IsOptional()
  @IsUUID()
  interventionId?: string;
}
