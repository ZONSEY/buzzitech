/** Miroir de backend/src/common/utils/slug.util.ts, pour pré-remplir
 * le champ slug côté formulaire admin sans aller-retour serveur. */
export function generateSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
