import { Prisma } from 'generated/prisma';

export function formatCurrency(
  value: string | number | Prisma.Decimal,
): string {
  const amount = Number(value);
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 2,
  }).format(amount);
}
