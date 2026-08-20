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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentFilterDto } from './dto/equipment-filter.dto';

@ApiTags('Équipements')
@Controller('equipment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIEN)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() filter: EquipmentFilterDto) {
    return this.equipmentService.findAll(filter);
  }

  @Get('mine')
  findMine(@CurrentUser('id') clientId: string) {
    return this.equipmentService.findMine(clientId);
  }

  @Get('client/:clientId')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIEN)
  @UseGuards(RolesGuard)
  findByClient(@Param('clientId') clientId: string) {
    return this.equipmentService.findByClient(clientId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateEquipmentDto) {
    return this.equipmentService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.equipmentService.remove(id);
  }
}
