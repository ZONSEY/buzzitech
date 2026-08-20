import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Identifiant du paiement à rembourser',
  })
  @IsUUID()
  paymentId: string;
}
