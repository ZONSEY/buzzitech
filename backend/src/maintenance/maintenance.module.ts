import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MaintenanceController } from './maintenance.controller';

// Temporaire — voir maintenance.controller.ts. Retirer cet import de
// AppModule (et supprimer ce dossier) une fois l'opération faite.
@Module({
  imports: [PrismaModule],
  controllers: [MaintenanceController],
})
export class MaintenanceModule {}
