import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Kaboré',
    description: "Nom de l'utilisateur",
  })
  @IsString()
  @Length(2, 50)
  nom: string;

  @ApiProperty({
    example: 'Issa',
    description: "Prénom de l'utilisateur",
  })
  @IsString()
  @Length(2, 50)
  prenom: string;

  @ApiProperty({
    example: 'issa@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '70123456',
    required: false,
  })
  @IsOptional()
  @Matches(/^[0-9]{8,15}$/)
  telephone?: string;

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
