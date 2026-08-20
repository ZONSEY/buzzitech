import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
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

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
