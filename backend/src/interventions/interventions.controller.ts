import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';
import { InterventionsService } from './interventions.service';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { CompleteInterventionDto } from './dto/complete-intervention.dto';
import { ObservationsDto } from './dto/observations.dto';
import { AddMaterialDto } from './dto/add-material.dto';
import { InterventionFilterDto } from './dto/intervention-filter.dto';
import { RateInterventionDto } from './dto/rate-intervention.dto';

@ApiTags('Interventions')
@Controller('interventions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterventionsController {
  constructor(
    private readonly interventionsService: InterventionsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // --- Admin ---

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateInterventionDto) {
    return this.interventionsService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Query() filter: InterventionFilterDto) {
    return this.interventionsService.findAll(filter);
  }

  @Get('technicians')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findTechnicians() {
    return this.interventionsService.findTechnicians();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateInterventionDto) {
    return this.interventionsService.update(id, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  cancel(@Param('id') id: string) {
    return this.interventionsService.cancel(id);
  }

  // --- Technicien ---

  @Get('me')
  @Roles(UserRole.TECHNICIEN)
  @UseGuards(RolesGuard)
  findMine(
    @CurrentUser('id') technicianId: string,
    @Query() filter: InterventionFilterDto,
  ) {
    return this.interventionsService.findMine(technicianId, filter);
  }

  @Get('me/stats')
  @Roles(UserRole.TECHNICIEN)
  @UseGuards(RolesGuard)
  getMyStats(@CurrentUser('id') technicianId: string) {
    return this.interventionsService.getTechnicianStats(technicianId);
  }

  @Patch(':id/accept')
  @Roles(UserRole.TECHNICIEN)
  @UseGuards(RolesGuard)
  accept(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.interventionsService.accept(user, id);
  }

  @Patch(':id/on-the-way')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  markOnTheWay(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.interventionsService.markOnTheWay(user, id);
  }

  @Patch(':id/start')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  start(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.interventionsService.start(user, id);
  }

  @Patch(':id/observations')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  updateObservations(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: ObservationsDto,
  ) {
    return this.interventionsService.updateObservations(user, id, dto);
  }

  @Post(':id/materials')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  addMaterial(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: AddMaterialDto,
  ) {
    return this.interventionsService.addMaterial(user, id, dto);
  }

  @Delete(':id/materials/:materialId')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  removeMaterial(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Param('materialId') materialId: string,
  ) {
    return this.interventionsService.removeMaterial(user, id, materialId);
  }

  @Post(':id/photos')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      fileFilter(req, file, callback) {
        const allowed = /\.(jpg|jpeg|png|webp)$/i;
        if (!allowed.test(file.originalname)) {
          return callback(
            new BadRequestException('Format de fichier non autorisé.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async addPhoto(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Aucune image fournie.');
    }

    const upload = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: `interventions/${id}`,
      publicId: randomUUID(),
      width: 1600,
    });

    return this.interventionsService.addPhoto(
      user,
      id,
      upload.secure_url ?? upload.url,
    );
  }

  @Delete(':id/photos/:photoId')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  removePhoto(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ) {
    return this.interventionsService.removePhoto(user, id, photoId);
  }

  @Patch(':id/complete')
  @Roles(UserRole.TECHNICIEN, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  complete(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: CompleteInterventionDto,
  ) {
    return this.interventionsService.complete(user, id, dto);
  }

  // --- Client ---

  @Get('mine-client')
  findMineAsClient(
    @CurrentUser('id') clientId: string,
    @Query() filter: InterventionFilterDto,
  ) {
    return this.interventionsService.findMineAsClient(clientId, filter);
  }

  @Patch(':id/rate')
  rate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: RateInterventionDto,
  ) {
    return this.interventionsService.rateIntervention(user, id, dto);
  }

  // --- Partagé (admin / technicien assigné / client concerné) ---

  @Get(':id/report/pdf')
  async getReportPdf(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const buffer = await this.interventionsService.getReportPdf(user, id);
    return {
      filename: `rapport-intervention-${id}.pdf`,
      content: buffer.toString('base64'),
    };
  }

  @Get(':id')
  findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.interventionsService.findOne(user, id);
  }
}
