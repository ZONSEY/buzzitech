import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { BusinessServiceCategoriesController } from './business-service-categories.controller';
import { BusinessServiceCategoriesService } from './business-service-categories.service';

@Module({
  imports: [PrismaModule],

  controllers: [BusinessServiceCategoriesController],

  providers: [BusinessServiceCategoriesService],

  exports: [BusinessServiceCategoriesService],
})
export class BusinessServiceCategoriesModule {}
