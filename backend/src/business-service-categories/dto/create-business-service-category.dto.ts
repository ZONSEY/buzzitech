import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessServiceCategoryDto {
  @ApiProperty({
    example: 'Développement Web',
  })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'developpement-web',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug!: string;

  @ApiPropertyOptional({
    example: 'Tous les services de développement web',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
