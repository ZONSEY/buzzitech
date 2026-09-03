import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
// Le schema.prisma définit un output personnalisé :
//   generator client { output = "../generated/prisma" }
// `npx prisma generate` régénère donc le client dans
// backend/generated/prisma, PAS dans node_modules/@prisma/client.
// Importer depuis '@prisma/client' pointait vers un client jamais
// mis à jour (d'où l'erreur persistante sur displayOrder, etc.).
import { PrismaClient } from 'generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'DATABASE_URL est requise pour connecter Prisma à PostgreSQL.',
      );
    }

    super({
      adapter: new PrismaPg({ connectionString }),
    });
  }

  private readonly logger = new Logger(PrismaService.name);

  // Au démarrage, postgres.railway.internal (réseau privé Railway) met
  // parfois quelques secondes à devenir joignable — surtout si Postgres et
  // l'API redémarrent au même moment. Sans retry, ce P1001 transitoire fait
  // planter tout le déploiement (échec silencieux, aucun autre log) au lieu
  // de laisser le temps au réseau privé de se stabiliser.
  async onModuleInit() {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.$connect();
        return;
      } catch (error) {
        if (attempt === maxAttempts) throw error;
        const delayMs = 2 ** attempt * 1000;
        this.logger.warn(
          `Connexion à PostgreSQL échouée (tentative ${attempt}/${maxAttempts}), nouvelle tentative dans ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
