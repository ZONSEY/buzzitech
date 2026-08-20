import { Module } from '@nestjs/common';
import { MaterialItemsService } from './material-items.service';
import { MaterialItemsController } from './material-items.controller';

@Module({
  controllers: [MaterialItemsController],
  providers: [MaterialItemsService],
  exports: [MaterialItemsService],
})
export class MaterialItemsModule {}
