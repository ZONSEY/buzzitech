import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, UserRole } from 'generated/prisma';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateRefreshToken(userId: string, hashedRefreshToken: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  // Ajouté : liste paginée/filtrée pour un panel admin.
  async findAll(filter: UserQueryDto) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;
    const sortBy = filter.sortBy ?? 'createdAt';
    const order = filter.order ?? 'desc';

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      role: filter.role,
      OR: filter.search
        ? [
            { nom: { contains: filter.search, mode: 'insensitive' } },
            { prenom: { contains: filter.search, mode: 'insensitive' } },
            { email: { contains: filter.search, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Ajouté : changement de rôle par un admin.
  async updateRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  // Ajouté : suppression d'un compte par un admin.
  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    await this.prisma.user.delete({ where: { id } });

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès.',
    };
  }

  async updateAvatar(userId: string, url: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: url },
    });
  }

  async setResetPasswordToken(
    userId: string,
    hashedToken: string,
    expires: Date,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: expires,
      },
    });
  }

  async findByResetPasswordToken(hashedToken: string) {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    });
  }

  async resetPassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        // Invalide les sessions existantes : on force une reconnexion
        // après un changement de mot de passe.
        hashedRefreshToken: null,
      },
    });
  }

  async setEmailVerificationToken(
    userId: string,
    hashedToken: string,
    expires: Date,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: expires,
      },
    });
  }

  async findByEmailVerificationToken(hashedToken: string) {
    return this.prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { gt: new Date() },
      },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }
}
