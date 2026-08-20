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

import { BusinessServiceCategoriesService } from './business-service-categories.service';

import { CreateBusinessServiceCategoryDto } from './dto/create-business-service-category.dto';
import { UpdateBusinessServiceCategoryDto } from './dto/update-business-service-category.dto';
import { BusinessServiceCategoryFilterDto } from './dto/business-service-category-filter.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Business Service Categories')
@ApiBearerAuth()
@Controller('business-service-categories')
export class BusinessServiceCategoriesController {
  constructor(
    private readonly businessServiceCategoriesService: BusinessServiceCategoriesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Créer une catégorie de service',
  })
  @ApiCreatedResponse({
    description: 'Catégorie créée avec succès',
  })
  create(@Body() dto: CreateBusinessServiceCategoryDto) {
    return this.businessServiceCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Liste des catégories',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'order', required: false })
  findAll(@Query() filter: BusinessServiceCategoryFilterDto) {
    return this.businessServiceCategoriesService.findAll(filter);
  }

  @Get('active')
  @ApiOperation({
    summary: 'Catégories actives',
  })
  findActive() {
    return this.businessServiceCategoriesService.findActive();
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Statistiques',
  })
  statistics() {
    return this.businessServiceCategoriesService.statistics();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir une catégorie',
  })
  @ApiParam({
    name: 'id',
  })
  @ApiNotFoundResponse({
    description: 'Catégorie introuvable',
  })
  findOne(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServiceCategoriesService.findOne(id);
  }

  @Get(':id/services-count')
  @ApiOperation({
    summary: 'Nombre de services',
  })
  countServices(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServiceCategoriesService.countServices(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Modifier une catégorie',
  })
  update(
    @Param('id', ParseUUIDPipe)
    id: string,

    @Body()
    dto: UpdateBusinessServiceCategoryDto,
  ) {
    return this.businessServiceCategoriesService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activer/Désactiver une catégorie',
  })
  toggleStatus(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServiceCategoriesService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une catégorie',
  })
  remove(
    @Param('id', ParseUUIDPipe)
    id: string,
  ) {
    return this.businessServiceCategoriesService.remove(id);
  }
}
