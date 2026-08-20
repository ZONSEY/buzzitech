import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaymentGateway } from 'generated/prisma';

export class CheckoutDto {
  @ApiPropertyOptional({
    enum: PaymentGateway,
    default: PaymentGateway.STRIPE,
  })
  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;
}
