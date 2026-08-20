import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { InterventionStatus } from 'generated/prisma';
import { CreateInterventionDto } from './create-intervention.dto';

export class UpdateInterventionDto extends PartialType(CreateInterventionDto) {
  @ApiPropertyOptional({ enum: InterventionStatus })
  @IsOptional()
  @IsEnum(InterventionStatus)
  status?: InterventionStatus;
}
