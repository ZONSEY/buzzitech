import { Module } from '@nestjs/common';
import { ProjectRequestsService } from './project-requests.service';
import { ProjectRequestsController } from './project-requests.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [NotificationsModule, EmailModule],
  providers: [ProjectRequestsService],
  controllers: [ProjectRequestsController],
})
export class ProjectRequestsModule {}
