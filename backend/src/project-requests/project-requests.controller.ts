import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// "import type" requis avec isolatedModules + emitDecoratorMetadata,
// puisque ce type apparaît dans la signature d'une méthode décorée.
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'generated/prisma';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { EstimateProjectDto } from './dto/estimate-project.dto';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { CreateQuoteItemDto } from './dto/create-quote-item.dto';
import { UpdateQuoteItemDto } from './dto/update-quote-item.dto';
import { ProjectRequestsService } from './project-requests.service';

@Controller('project-requests')
export class ProjectRequestsController {
  // projectRequestsService était utilisé plus bas sans jamais être injecté.
  constructor(
    private readonly projectRequestsService: ProjectRequestsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateProjectRequestDto,
  ) {
    return this.projectRequestsService.create(user.id, dto);
  }

  @Get('my-requests')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: CurrentUserData) {
    return this.projectRequestsService.findMyRequests(user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.projectRequestsService.findOne(user.id, id);
  }

  @Get(':id/quote/pdf')
  @UseGuards(JwtAuthGuard)
  async getQuotePdf(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const buffer = await this.projectRequestsService.getQuotePdf(user, id);
    return {
      filename: `devis-${id}.pdf`,
      content: buffer.toString('base64'),
    };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAll() {
    return this.projectRequestsService.findAll();
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateProjectStatusDto) {
    return this.projectRequestsService.updateStatus(id, dto.status);
  }

  @Patch(':id/estimate')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  estimate(@Param('id') id: string, @Body() dto: EstimateProjectDto) {
    return this.projectRequestsService.estimateProject(id, dto);
  }

  @Post(':id/items')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  addQuoteItem(@Param('id') id: string, @Body() dto: CreateQuoteItemDto) {
    return this.projectRequestsService.addQuoteItem(id, dto);
  }

  @Patch('items/:itemId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateQuoteItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuoteItemDto,
  ) {
    return this.projectRequestsService.updateQuoteItem(itemId, dto);
  }

  @Delete('items/:itemId')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  removeQuoteItem(@Param('itemId') itemId: string) {
    return this.projectRequestsService.removeQuoteItem(itemId);
  }
}
