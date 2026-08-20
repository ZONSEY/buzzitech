import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ObservationsDto {
  @ApiProperty()
  @IsString()
  observations: string;
}
