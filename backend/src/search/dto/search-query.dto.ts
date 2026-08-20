import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Terme recherché' })
  @IsString()
  @MinLength(2)
  q: string;
}
