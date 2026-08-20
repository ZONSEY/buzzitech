import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsStrongPassword, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token reçu par email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'Azerty@123',
  })
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
