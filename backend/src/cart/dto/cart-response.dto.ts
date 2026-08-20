import { ApiProperty } from '@nestjs/swagger';

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  type: 'PRODUCT' | 'SERVICE';

  @ApiProperty()
  itemId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  image?: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    type: [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  productsTotal: number;

  @ApiProperty()
  servicesTotal: number;

  @ApiProperty()
  grandTotal: number;
}
