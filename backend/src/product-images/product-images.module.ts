import { Module } from '@nestjs/common';
import { ProductImagesController } from './product-images.controller';
import { ProductImagesService } from './product-images.service';
import { ProductsModule } from 'src/products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [ProductImagesController],
  providers: [ProductImagesService],
})
export class ProductImagesModule {}
