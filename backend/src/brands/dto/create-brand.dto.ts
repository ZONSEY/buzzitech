import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({
    example: 'HP',
    description: 'Nom de la marque',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'hp',
    description: 'Slug unique en minuscules',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.',
  })
  slug: string;

  @ApiPropertyOptional({
    example: 'https://cdn.buzzitech.com/brands/hp.png',
  })
  @IsOptional()
  @IsUrl()
  logo?: string;
}
