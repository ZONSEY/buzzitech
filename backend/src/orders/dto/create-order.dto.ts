import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Adresse de livraison',
  })
  @IsUUID()
  addressId: string;

  @ApiPropertyOptional({
    description: 'Instructions de livraison',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
