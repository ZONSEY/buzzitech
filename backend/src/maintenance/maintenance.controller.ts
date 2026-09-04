import {
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Endpoint temporaire pour une opération ponctuelle (promouvoir un compte
 * en ADMIN sur l'environnement de prod, faute de mécanisme de seed —
 * voir src/scripts/promote-admin.ts). À supprimer une fois utilisé :
 * preDeployCommand ne permet pas d'exécuter de script custom sur ce
 * projet Railway (il ne fait tourner que son propre check Prisma
 * implicite, quoi qu'on y mette), donc pas d'autre canal fiable pour un
 * one-off en prod que de passer par le pipeline de déploiement normal.
 */
@Controller('_maintenance')
export class MaintenanceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post('promote-admin/:email')
  async promoteAdmin(
    @Param('email') email: string,
    @Query('secret') secret: string,
  ) {
    const expected = this.config.get<string>('MAINTENANCE_SECRET');
    if (!expected || secret !== expected) {
      throw new ForbiddenException();
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(`Aucun utilisateur avec l'email ${email}`);
    }

    const updated = await this.prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    return { id: updated.id, email: updated.email, role: updated.role };
  }
}
