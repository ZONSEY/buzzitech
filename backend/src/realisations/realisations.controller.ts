import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RealisationsService } from './realisations.service';
import { CreateRealisationDto } from './dto/create-realisation.dto';
import { UpdateRealisationDto } from './dto/update-realisation.dto';
import { RealisationQueryDto } from './dto/realisation-query.dto';

@Controller('realisations')
export class RealisationsController {
  constructor(private readonly realisationsService: RealisationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateRealisationDto) {
    return this.realisationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: RealisationQueryDto) {
    return this.realisationsService.findAll(query, true);
  }

  @Get('admin')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  findAllAdmin(@Query() query: RealisationQueryDto) {
    return this.realisationsService.findAll(query, false);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.realisationsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.realisationsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateRealisationDto) {
    return this.realisationsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.realisationsService.remove(id);
  }
}
