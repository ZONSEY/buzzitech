import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from 'generated/prisma';

export class CheckoutDto {
  @ApiProperty()
  @IsUUID()
  addressId!: string;

  @ApiProperty({
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ description: 'Code promo à appliquer' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
