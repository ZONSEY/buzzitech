import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService], // <-- ajoute cette ligne
})
export class AuditModule {}
