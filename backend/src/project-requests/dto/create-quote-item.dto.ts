import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';

export class CreateQuoteItemDto {
  @ApiProperty({ example: 'Kit alarme incendie sans fil : détecteur de fumée' })
  @IsString()
  @Length(2, 200)
  designation: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  quantity?: number;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;
}
