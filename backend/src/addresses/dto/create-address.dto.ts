import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsString()
  recipient: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}
