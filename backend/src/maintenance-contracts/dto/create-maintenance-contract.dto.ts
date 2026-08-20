import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ContractFrequency } from 'generated/prisma';

export class CreateMaintenanceContractDto {
  @ApiProperty({ example: 'Maintenance trimestrielle — système CCTV' })
  @IsString()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ContractFrequency })
  @IsEnum(ContractFrequency)
  frequency: ContractFrequency;

  @ApiPropertyOptional({
    description: "Date de la première intervention (défaut : aujourd'hui)",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fin du contrat (optionnel)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsUUID()
  clientId: string;

  @ApiPropertyOptional({
    description: 'Technicien assigné par défaut aux interventions générées',
  })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  addressId?: string;
}
