import { Module } from '@nestjs/common';
import { RealisationImagesController } from './realisation-images.controller';
import { RealisationImagesService } from './realisation-images.service';

@Module({
  controllers: [RealisationImagesController],
  providers: [RealisationImagesService],
})
export class RealisationImagesModule {}
