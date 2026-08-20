import { Prisma } from 'generated/prisma';
import { CartItemResponseDto, CartResponseDto } from '../dto/cart-response.dto';

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        product: { include: { images: true } };
        businessService: true;
      };
    };
  };
}>;

export class CartMapper {
  static toResponse(cart: CartWithItems): CartResponseDto {
    const items: CartItemResponseDto[] = cart.items.map((item) => {
      const isProduct = !!item.product;

      const source = isProduct ? item.product! : item.businessService!;

      const unitPrice = Number(source.price);

      const quantity = item.quantity;

      return {
        id: item.id,

        type: isProduct ? 'PRODUCT' : 'SERVICE',

        itemId: source.id,

        name: source.name,

        image: isProduct
          ? item.product!.images.find((i) => i.isPrimary)?.url
          : (item.businessService!.image ?? undefined),

        quantity,

        unitPrice,

        totalPrice: unitPrice * quantity,
      };
    });

    const productsTotal = items
      .filter((i) => i.type === 'PRODUCT')
      .reduce((sum, i) => sum + i.totalPrice, 0);

    const servicesTotal = items
      .filter((i) => i.type === 'SERVICE')
      .reduce((sum, i) => sum + i.totalPrice, 0);

    return {
      id: cart.id,

      items,

      totalItems: items.reduce(
        (sum, item) => sum + item.quantity,

        0,
      ),

      productsTotal,

      servicesTotal,

      grandTotal: productsTotal + servicesTotal,
    };
  }
}
