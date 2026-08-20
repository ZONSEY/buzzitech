import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';
import { MaterialItemsService } from './material-items.service';
import { CreateMaterialItemDto } from './dto/create-material-item.dto';
import { UpdateMaterialItemDto } from './dto/update-material-item.dto';
import { MaterialItemFilterDto } from './dto/material-item-filter.dto';

@ApiTags('Catalogue matériel')
@Controller('material-items')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaterialItemsController {
  constructor(
    private readonly materialItemsService: MaterialItemsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIEN)
  findAll(@Query() filter: MaterialItemFilterDto) {
    return this.materialItemsService.findAll(filter);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateMaterialItemDto) {
    return this.materialItemsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateMaterialItemDto) {
    return this.materialItemsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.materialItemsService.remove(id);
  }

  @Post(':id/image')
  @Roles(UserRole.ADMIN)
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
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const upload = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: `material-items/${id}`,
      publicId: randomUUID(),
      width: 800,
    });

    const url = upload.secure_url ?? upload.url;
    return this.materialItemsService.uploadImage(id, url);
  }

  @Delete(':id/image')
  @Roles(UserRole.ADMIN)
  removeImage(@Param('id') id: string) {
    return this.materialItemsService.removeImage(id);
  }
}
