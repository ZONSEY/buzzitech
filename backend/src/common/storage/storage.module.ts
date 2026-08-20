import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  providers: [StorageService, CloudinaryService],
  exports: [StorageService, CloudinaryService],
})
export class StorageModule {}
