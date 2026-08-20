import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { ContactMessagesService } from './contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ReplyContactMessageDto } from './dto/reply-contact-message.dto';

@Controller('contact-messages')
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
  ) {}

  @Post()
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactMessagesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  findAll() {
    return this.contactMessagesService.findAll();
  }

  @Post(':id/reply')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  reply(@Param('id') id: string, @Body() dto: ReplyContactMessageDto) {
    return this.contactMessagesService.reply(id, dto);
  }
}
