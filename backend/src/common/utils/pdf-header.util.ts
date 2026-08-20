import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const LOGO_PATH = join(
  process.cwd(),
  'src',
  'common',
  'assets',
  'logo-buzzitech.png',
);

let cachedLogo: Buffer | null | undefined;

function getLogoBuffer(): Buffer | null {
  if (cachedLogo === undefined) {
    cachedLogo = existsSync(LOGO_PATH) ? readFileSync(LOGO_PATH) : null;
  }
  return cachedLogo;
}

/**
 * En-tête commun aux PDF générés (factures, devis, rapports d'intervention) :
 * logo Buzzitech en haut à gauche, puis le titre du document. Renvoie la
 * position Y à partir de laquelle le contenu du document peut continuer.
 */
export function drawPdfHeader(doc: PDFKit.PDFDocument, title: string): number {
  const logo = getLogoBuffer();
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const marginTop = doc.page.margins.top;
  const usableWidth = doc.page.width - marginLeft - marginRight;

  if (logo) {
    // Logo natif ~1597x424 (ratio ~3.77), affiché en petit format cohérent
    // avec le reste du document.
    doc.image(logo, marginLeft, marginTop, { width: 130 });
    doc.fontSize(18).text(title, marginLeft, marginTop + 46, {
      width: usableWidth,
      align: 'center',
    });
  } else {
    doc.fontSize(20).text(title, { align: 'center' });
  }

  doc.moveDown(2);
  return doc.y;
}
