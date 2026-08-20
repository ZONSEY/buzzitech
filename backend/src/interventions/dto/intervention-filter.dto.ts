import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { InterventionStatus } from 'generated/prisma';
import { PaginationDto } from 'src/common/pagination/pagination.dto';

export class InterventionFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: InterventionStatus })
  @IsOptional()
  @IsEnum(InterventionStatus)
  status?: InterventionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({
    description: 'Recherche par référence, titre ou nom du client',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Date de début (scheduledAt >=)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Date de fin (scheduledAt <=)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
