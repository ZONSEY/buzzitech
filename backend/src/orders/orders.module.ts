import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuditModule } from 'src/audit/audit.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, EmailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
