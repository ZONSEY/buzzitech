import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { RealisationImagesService } from './realisation-images.service';

@Controller('realisation-images')
export class RealisationImagesController {
  constructor(
    private readonly realisationImagesService: RealisationImagesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post(':realisationId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Param('realisationId') realisationId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const upload = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: `realisations/${realisationId}`,
      publicId: randomUUID(),
      width: 1600,
    });

    const url = upload.secure_url ?? upload.url;

    return this.realisationImagesService.create(realisationId, url);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.realisationImagesService.delete(id);
  }
}
