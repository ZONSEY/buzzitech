import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ReplyContactMessageDto {
  @ApiProperty({
    example: 'Merci pour votre message, nous revenons vers vous...',
  })
  @IsString()
  @MaxLength(5000)
  message: string;
}
