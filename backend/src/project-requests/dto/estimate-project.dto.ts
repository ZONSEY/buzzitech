import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class EstimateProjectDto {
  @ApiPropertyOptional({
    description: 'Durée estimée en jours',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDuration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminComment?: string;
}
