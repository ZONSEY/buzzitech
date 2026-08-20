import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { UserRole } from 'generated/prisma';

import { BusinessServicesService } from './business-services.service';

import { CreateBusinessServiceDto } from './dto/create-business-service.dto';
import { UpdateBusinessServiceDto } from './dto/update-business-service.dto';
import { BusinessServiceFilterDto } from './dto/business-service-filter.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Business Services')
@ApiBearerAuth()
@Controller('business-services')
export class BusinessServicesController {
  constructor(
    private readonly businessServicesService: BusinessServicesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Créer un service',
  })
  @ApiCreatedResponse({
    description: 'Service créé avec succès',
  })
  create(@Body() dto: CreateBusinessServiceDto) {
    return this.businessServicesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Liste des services',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'featured', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  findAll(@Query() filter: BusinessServiceFilterDto) {
    return this.businessServicesService.findAll(filter);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Statistiques des services',
  })
  statistics() {
    return this.businessServicesService.statistics();
  }

  @Get('available')
  @ApiOperation({
    summary: 'Services disponibles',
  })
  findAvailable() {
    return this.businessServicesService.findAvailable();
  }

  @Get('featured')
  @ApiOperation({
    summary: 'Services mis en avant',
  })
  findFeatured() {
    return this.businessServicesService.findFeatured();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir un service',
  })
  @ApiParam({
    name: 'id',
  })
  @ApiNotFoundResponse({
    description: 'Service introuvable',
  })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Modifier un service',
  })
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateBusinessServiceDto,
  ) {
    return this.businessServicesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un service',
  })
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServicesService.remove(id);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Changer la disponibilité',
  })
  toggleStatus(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServicesService.toggleStatus(id);
  }

  @Patch(':id/toggle-featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mettre en avant un service',
  })
  toggleFeatured(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServicesService.toggleFeatured(id);
  }

  @Get(':id/related')
  @ApiOperation({
    summary: 'Services similaires',
  })
  findRelated(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServicesService.findRelatedServices(id);
  }
}
