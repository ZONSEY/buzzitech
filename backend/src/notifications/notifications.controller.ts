import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { NotificationsService } from './notifications.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from 'generated/prisma';

import { UseGuards } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationFilterDto } from './dto/notification-filter.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Créer une notification',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Lister toutes les notifications',
  })
  findAll(@Query() filter: NotificationFilterDto) {
    return this.notificationsService.findAll(filter);
  }
  @Get('me')
  @ApiOperation({
    summary: 'Mes notifications',
  })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query() filter: NotificationFilterDto,
  ) {
    return this.notificationsService.findMine(user.sub, filter);
  }
  @Get('unread-count')
  @ApiOperation({
    summary: 'Nombre de notifications non lues',
  })
  countUnread(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.countUnread(user.sub);
  }
  @Get('summary')
  @ApiOperation({
    summary: 'Résumé des notifications',
  })
  summary(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getSummary(user.sub);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Marquer comme lu',
  })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Tout marquer comme lu',
  })
  markAll(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }

  @Delete('read')
  @ApiOperation({
    summary: 'Supprimer les notifications lues',
  })
  deleteAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.deleteAllRead(user.sub);
  }
}
