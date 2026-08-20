import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ApplyPromoCodeDto {
  @ApiProperty()
  @IsString()
  code: string;
}
