/**
 * Script de maintenance ponctuel : passe un utilisateur existant en rôle
 * ADMIN. Pas de mécanisme de seed dans ce projet, donc pas d'autre moyen
 * de créer le tout premier admin en production que d'y accéder
 * directement — voir preDeployCommand sur le service `api` (Railway) pour
 * un exemple d'invocation en pré-déploiement.
 *
 * Usage : node dist/scripts/promote-admin.js <email>
 */
import { PrismaClient } from 'generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node dist/scripts/promote-admin.js <email>');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL est requise.');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });
    console.log(`OK : ${user.email} (${user.id}) est maintenant ADMIN.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
