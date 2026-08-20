import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandFilterDto } from './dto/brand-filter.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';

@ApiTags('Brands')
@ApiBearerAuth()
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Créer une marque',
  })
  @ApiCreatedResponse({
    description: 'Marque créée avec succès',
  })
  @ApiConflictResponse({
    description: 'Nom ou slug déjà utilisé',
  })
  create(
    @Body() dto: CreateBrandDto,
    // Ajouté : BrandsService.create() a besoin de userId pour le log
    // d'audit.
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.brandsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Lister les marques',
  })
  @ApiOkResponse({
    description: 'Liste des marques',
  })
  findAll(@Query() filter: BrandFilterDto) {
    return this.brandsService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtenir une marque',
  })
  @ApiParam({
    name: 'id',
  })
  @ApiNotFoundResponse({
    description: 'Marque introuvable',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Modifier une marque',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdateBrandDto,

    // Ajouté : BrandsService.update() a besoin de userId pour le log
    // d'audit.
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.brandsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer une marque',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    // Ajouté : BrandsService.remove() a besoin de userId pour le log
    // d'audit.
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.brandsService.remove(id, user.id);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activer ou désactiver une marque',
  })
  toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.toggleStatus(id);
  }

  @Get(':id/products-count')
  @ApiOperation({
    summary: 'Nombre de produits par marque',
  })
  countProducts(@Param('id', ParseUUIDPipe) id: string) {
    return this.brandsService.countProducts(id);
  }
}
