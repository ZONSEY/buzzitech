import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompleteInterventionDto {
  @ApiProperty({ description: 'Compte rendu de fin de mission' })
  @IsString()
  report: string;

  @ApiPropertyOptional({
    description:
      'Durée réelle en minutes. Si omis, calculée automatiquement à partir de startedAt.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  actualDuration?: number;

  @ApiPropertyOptional({
    description: 'Signature du client (image PNG encodée en data URL base64)',
  })
  @IsOptional()
  @IsString()
  clientSignature?: string;
}
