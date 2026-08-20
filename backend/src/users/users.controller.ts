import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from 'generated/prisma';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { CurrentUserData } from 'src/common/interfaces/current-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserMapper } from 'src/common/mappers/user.mapper';
import { UsersService } from './users.service';
import { CloudinaryService } from 'src/common/storage/cloudinary.service';
import { UserQueryDto } from './dto/user-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';

@ApiTags('Utilisateurs')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Expect Multer interceptor to be applied at route registration if needed by caller
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const upload = await this.cloudinaryService.uploadBuffer(file.buffer, {
      folder: `avatars/${id}`,
      publicId: randomUUID(),
      width: 400,
      height: 400,
    });

    const url = upload.secure_url ?? upload.url;

    const user = await this.usersService.updateAvatar(id, url);

    return { success: true, url, user };
  }

  // NOTE: findByEmail, create et updateRefreshToken de UsersService ne
  // sont volontairement PAS exposés en HTTP :
  // - findByEmail : usage interne à l'auth (risque d'énumération d'emails)
  // - create : déjà couvert par POST /api/auth/register (hash du mot
  //   de passe géré là-bas, un accès direct le contournerait)
  // - updateRefreshToken : purement interne à la rotation des tokens

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lister les utilisateurs (admin)',
  })
  async findAll(@Query() query: UserQueryDto) {
    const result = await this.usersService.findAll(query);

    return {
      ...result,
      data: result.data.map((u) => UserMapper.toResponse(u)),
    };
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Consulter le profil d’un utilisateur (admin)',
  })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return UserMapper.toResponse(user);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le rôle d’un utilisateur (admin)',
  })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    const user = await this.usersService.updateRole(id, dto.role);

    return UserMapper.toResponse(user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Supprimer un utilisateur (admin)',
  })
  async remove(
    @Param('id') id: string,
    // Ajouté : empêche un admin de se supprimer lui-même par erreur.
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    if (currentUser.id === id) {
      throw new BadRequestException(
        'Vous ne pouvez pas supprimer votre propre compte via cette route.',
      );
    }

    return this.usersService.remove(id);
  }
}
