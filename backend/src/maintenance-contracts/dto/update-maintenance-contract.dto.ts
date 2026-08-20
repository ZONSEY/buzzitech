import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMaintenanceContractDto } from './create-maintenance-contract.dto';

export class UpdateMaintenanceContractDto extends PartialType(
  CreateMaintenanceContractDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
