import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ProductReviewsService } from './product-reviews.service';

@ApiTags('Avis produits')
@Controller('product-reviews')
export class ProductReviewsController {
  constructor(private readonly reviewsService: ProductReviewsService) {}

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Post('product/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, productId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.reviewsService.remove(user, id);
  }
}
