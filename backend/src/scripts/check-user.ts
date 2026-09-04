/**
 * Script de diagnostic ponctuel : affiche l'état d'un utilisateur (id,
 * email, role) tel qu'il est réellement en base. Voir promote-admin.ts.
 *
 * Usage : node dist/scripts/check-user.js <email>
 */
import { PrismaClient } from 'generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node dist/scripts/check-user.js <email>');
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
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('===CHECK_USER_RESULT===');
    console.log(JSON.stringify(user));
    console.log('===END_CHECK_USER_RESULT===');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('===CHECK_USER_ERROR===', error);
  process.exit(1);
});
