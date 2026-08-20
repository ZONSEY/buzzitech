import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RealisationsController } from './realisations.controller';
import { RealisationsService } from './realisations.service';

@Module({
  imports: [PrismaModule],
  controllers: [RealisationsController],
  providers: [RealisationsService],
  exports: [RealisationsService],
})
export class RealisationsModule {}
