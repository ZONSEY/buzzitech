import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { BusinessServicesController } from './business-services.controller';
import { BusinessServicesService } from './business-services.service';

@Module({
  imports: [PrismaModule],

  controllers: [BusinessServicesController],

  providers: [BusinessServicesService],

  exports: [BusinessServicesService],
})
export class BusinessServicesModule {}
