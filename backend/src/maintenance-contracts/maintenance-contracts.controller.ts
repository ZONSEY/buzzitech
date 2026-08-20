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
import { MaintenanceContractsService } from './maintenance-contracts.service';
import { CreateMaintenanceContractDto } from './dto/create-maintenance-contract.dto';
import { UpdateMaintenanceContractDto } from './dto/update-maintenance-contract.dto';
import { MaintenanceContractFilterDto } from './dto/maintenance-contract-filter.dto';

@ApiTags('Contrats de maintenance')
@Controller('maintenance-contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class MaintenanceContractsController {
  constructor(
    private readonly maintenanceContractsService: MaintenanceContractsService,
  ) {}

  @Get()
  findAll(@Query() filter: MaintenanceContractFilterDto) {
    return this.maintenanceContractsService.findAll(filter);
  }

  @Post()
  create(@Body() dto: CreateMaintenanceContractDto) {
    return this.maintenanceContractsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceContractDto) {
    return this.maintenanceContractsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.maintenanceContractsService.remove(id);
  }

  @Post('generate-due')
  generateDue() {
    return this.maintenanceContractsService.generateDueInterventions();
  }
}
