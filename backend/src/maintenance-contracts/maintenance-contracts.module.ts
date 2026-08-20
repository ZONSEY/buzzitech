import { Module } from '@nestjs/common';
import { MaintenanceContractsService } from './maintenance-contracts.service';
import { MaintenanceContractsController } from './maintenance-contracts.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MaintenanceContractsController],
  providers: [MaintenanceContractsService],
})
export class MaintenanceContractsModule {}
