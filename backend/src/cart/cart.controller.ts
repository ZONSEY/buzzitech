import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// "import type" requis ici : avec isolatedModules + emitDecoratorMetadata,
// TS a besoin de savoir que cette interface n'existe qu'au niveau des
// types (pas une valeur runtime) quand elle apparaît dans la signature
// d'une méthode décorée.
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { ApplyPromoCodeDto } from 'src/promo-codes/dto/apply-promo-code.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('cart')
export class CartController {
  // cartService était utilisé plus bas sans jamais être injecté.
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mon panier',
  })
  getCart(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  addItem(@CurrentUser() user: CurrentUserData, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  updateQuantity(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateQuantity(user.id, id, dto);
  }

  @Delete('items/:cartItemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Supprimer un article du panier',
  })
  removeItem(
    @CurrentUser('id') userId: string,

    @Param('cartItemId', ParseUUIDPipe)
    cartItemId: string,
  ) {
    return this.cartService.removeItem(userId, cartItemId);
  }

  @Delete('clear')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vider le panier',
  })
  clear(
    @CurrentUser('id')
    userId: string,
  ) {
    return this.cartService.clear(userId);
  }

  // Ajouté : CartService.checkout() existait mais n'avait aucune route
  // pour l'appeler.
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Passer commande à partir du panier',
  })
  checkout(
    @CurrentUser('id')
    userId: string,

    @Body()
    dto: CheckoutDto,
  ) {
    return this.cartService.checkout(userId, dto);
  }

  @Post('promo-code/preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Prévisualiser la remise d'un code promo sur le panier actuel",
  })
  previewPromoCode(
    @CurrentUser('id') userId: string,
    @Body() dto: ApplyPromoCodeDto,
  ) {
    return this.cartService.previewPromoCode(userId, dto.code);
  }
}
