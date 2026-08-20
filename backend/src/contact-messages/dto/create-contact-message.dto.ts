import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Aminata Ouédraogo' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'aminata.ouedraogo@example.com' })
  @IsEmail()
  @MaxLength(150)
  email: string;

  @ApiPropertyOptional({ example: '+226 70 00 00 00' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: "Demande d'audit sécurité" })
  @IsString()
  @MaxLength(150)
  subject: string;

  @ApiProperty({ example: 'Bonjour, je souhaite un audit pour mon site...' })
  @IsString()
  @MaxLength(5000)
  message: string;
}
