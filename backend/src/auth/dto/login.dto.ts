import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'issa@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Azerty@123',
  })
  @IsNotEmpty()
  password: string;
}
