import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const STAMP_PATH = join(
  process.cwd(),
  'src',
  'common',
  'assets',
  'cachet-buzzitech.png',
);

let cachedStamp: Buffer | null | undefined;

function getStampBuffer(): Buffer | null {
  if (cachedStamp === undefined) {
    cachedStamp = existsSync(STAMP_PATH) ? readFileSync(STAMP_PATH) : null;
  }
  return cachedStamp;
}

// Reprend exactement le pied de page utilisé sur les factures proforma
// Buzzitech (voir mentions légales de la SARL).
const FOOTER_LINES = [
  "BUZZITECH ASSISTANCE SARL - Secteur 24, Lot 18, Parcelle 15 - Rue 15.13, Patte d'Oie 01 BP 1497 Ouagadougou 01 – Burkina Faso",
  'Tél : (+226) 79 66 60 66 / 04 04 18 22 / 44 22 23 77 | E-mail : infos@buzzi-tech.com',
  'RCCM : BFOUA2022B3463 | IFU : 00176846Z',
];

/**
 * Dessine le pied de page (mentions légales) sur toutes les pages déjà
 * générées du document. À appeler juste avant doc.end(), une fois tout le
 * contenu ajouté — nécessite { bufferPages: true } à la création du
 * PDFDocument pour pouvoir revenir sur les pages précédentes.
 */
export function drawPdfFooters(doc: PDFKit.PDFDocument): void {
  const range = doc.bufferedPageRange();
  const marginLeft = doc.page.margins.left;
  const marginRight = doc.page.margins.right;
  const originalBottomMargin = doc.page.margins.bottom;

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    const usableWidth = doc.page.width - marginLeft - marginRight;
    const top = doc.page.height - originalBottomMargin + 12;

    doc
      .save()
      .moveTo(marginLeft, top)
      .lineTo(marginLeft + usableWidth, top)
      .strokeColor('#cccccc')
      .lineWidth(0.5)
      .stroke()
      .restore();

    // PDFKit insère automatiquement une nouvelle page dès qu'un .text()
    // dépasse page.height - margins.bottom : on écrit ici volontairement
    // DANS la marge basse, donc on la ramène à 0 le temps du dessin pour
    // désactiver cette pagination automatique, puis on la restaure.
    doc.page.margins.bottom = 0;
    doc.fontSize(7.5).fillColor('#666666');
    let y = top + 5;
    for (const line of FOOTER_LINES) {
      doc.text(line, marginLeft, y, { width: usableWidth, align: 'center' });
      y = doc.y;
    }
    doc.page.margins.bottom = originalBottomMargin;
    doc.fillColor('black');
  }
}

/**
 * Dessine le cachet Buzzitech (image) à la position donnée, ou par défaut
 * en bas à droite de la zone de contenu courante. Ne fait rien si le
 * fichier d'image du cachet n'est pas présent (évite de casser la
 * génération du PDF si l'asset n'a pas encore été déposé).
 */
export function drawPdfStamp(
  doc: PDFKit.PDFDocument,
  options: { x?: number; y?: number; width?: number } = {},
): void {
  const stamp = getStampBuffer();
  if (!stamp) {
    return;
  }

  const width = options.width ?? 110;
  // Hauteur estimée (le ratio exact dépend du fichier) : sert uniquement à
  // décider s'il faut passer à la page suivante avant de dessiner le
  // cachet, pour ne pas chevaucher le pied de page.
  const estimatedHeight = width * 0.9;
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  let y = options.y ?? doc.y;
  if (y + estimatedHeight > bottomLimit) {
    doc.addPage();
    y = doc.page.margins.top;
  }

  const x = options.x ?? doc.page.width - doc.page.margins.right - width;
  doc.image(stamp, x, y, { width });
  doc.y = y + estimatedHeight + 10;
}
