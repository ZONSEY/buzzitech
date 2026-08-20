import {
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { ProductImagesService } from './product-images.service';
import { ProductsService } from 'src/products/products.service';

@Controller('product-images')
export class ProductImagesController {
  // Le service était utilisé plus bas (this.productImagesService)
  // sans jamais être injecté : d'où l'erreur TS2339.
  constructor(
    private readonly productImagesService: ProductImagesService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly productsService: ProductsService,
  ) {}

  @Post(':productId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  // NOTE: il y avait deux @UseInterceptors(FileInterceptor('image', ...))
  // empilés sur la même route. Le premier (incomplet, sans fileFilter
  // ni limits) a été supprimé — seul celui avec la validation du
  // format et la limite de taille est conservé.
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),

      fileFilter(req, file, callback) {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;

        if (!allowed.test(file.originalname)) {
          return callback(
            new BadRequestException('Format de fichier non autorisé.'),
            false,
          );
        }

        callback(null, true);
      },

      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async upload(
    @Param('productId') productId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Vérifie que le produit existe avant d'uploader vers Cloudinary
    // (sinon : upload gaspillé puis échec 500 non géré sur la contrainte
    // de clé étrangère de ProductImage.productId).
    await this.productsService.findOne(productId);

    // Upload to Cloudinary and persist URL
    // NOTE: publicId ne doit PAS répéter le préfixe déjà fourni par `folder`
    // (Cloudinary les concatène) sous peine d'un chemin doublé du type
    // products/{id}/products/{id}/{uuid}.
    const upload = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: `products/${productId}`,
      publicId: randomUUID(),
      width: 1200,
    });

    const url = upload.secure_url ?? upload.url;

    return this.productImagesService.create(productId, url);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.productImagesService.delete(id);
  }
}
