import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { WishlistService } from './wishlist.service';

@ApiTags('Liste de souhaits')
@ApiBearerAuth()
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  findMine(@CurrentUser('id') userId: string) {
    return this.wishlistService.findMine(userId);
  }

  @Post(':productId')
  add(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.add(userId, productId);
  }

  @Delete(':productId')
  remove(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistService.remove(userId, productId);
  }
}
