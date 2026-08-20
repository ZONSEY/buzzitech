import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Ordinateurs',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'ordinateurs',
  })
  @IsString()
  @MaxLength(120)
  slug: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
