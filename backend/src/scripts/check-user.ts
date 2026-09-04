/**
 * Script de diagnostic ponctuel : affiche l'état d'un utilisateur (id,
 * email, role) tel qu'il est réellement en base. Voir promote-admin.ts.
 *
 * Usage : node dist/scripts/check-user.js <email>
 */
import { PrismaClient } from 'generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  // Log immédiat, avant toute init Prisma : si ça n'apparaît jamais dans
  // les logs Railway, le script n'est même pas invoqué (souci de parsing
  // de la commande côté preDeployCommand, pas de notre code).
  console.log('===CHECK_USER_START===');

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
    adapter: new PrismaPg({
      connectionString,
      // Sans ça, un pool pg qui n'arrive pas à joindre le serveur (ou une
      // résolution IPv6 qui part dans le vide) attend indéfiniment — pas
      // d'erreur, pas de log, juste un hang jusqu'à ce que Railway tue le
      // process côté preDeploy.
      connectionTimeoutMillis: 8_000,
    }),
  });

  try {
    console.log('===CHECK_USER_QUERYING===');
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('===CHECK_USER_RESULT===');
    console.log(JSON.stringify(user));
    console.log('===END_CHECK_USER_RESULT===');
  } finally {
    await prisma.$disconnect();
  }

  // process.exit force le flush de stdout et tue le process immédiatement.
  // Sans ça, si le pool pg sous-jacent laisse un handle ouvert après
  // $disconnect(), le script ne termine jamais naturellement — Railway le
  // tue au bout d'un moment côté préDeploy et les console.log ci-dessus,
  // encore dans le buffer stdout, sont perdus (jamais vus dans les logs).
  process.exit(0);
}

main().catch((error) => {
  console.error('===CHECK_USER_ERROR===', error);
  process.exit(1);
});
