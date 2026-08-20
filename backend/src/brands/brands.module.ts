import { Module } from '@nestjs/common';

import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from 'src/audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],

  controllers: [BrandsController],

  providers: [BrandsService],

  exports: [BrandsService],
})
export class BrandsModule {}
