import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ReplyContactMessageDto } from './dto/reply-contact-message.dto';

@Injectable()
export class ContactMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateContactMessageDto) {
    return this.prisma.contactMessage.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async reply(id: string, dto: ReplyContactMessageDto) {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!message) {
      throw new NotFoundException('Message introuvable.');
    }

    await this.emailService.sendContactReply(message, dto.message);

    return this.prisma.contactMessage.update({
      where: { id },
      data: { answered: true, isRead: true },
    });
  }
}
