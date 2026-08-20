export interface PdfTableColumn {
  header: string;
  key: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

const HEADER_FILL = '#1a1a21';
const HEADER_TEXT = '#ffffff';
const BORDER_COLOR = '#cccccc';
const ROW_TEXT = '#111111';
const ROW_HEIGHT = 22;
const CELL_PADDING_X = 6;

// Intl.NumberFormat('fr-FR', ...) (voir formatCurrency) insere des espaces
// insecables (U+00A0) et fines insecables (U+202F) comme separateurs de
// milliers et avant le code devise. La police Helvetica standard de
// PDFKit n'a pas ces glyphes et les affiche comme un caractere casse
// ("/") -- on les remplace par une espace normale avant rendu.
const NON_BREAKING_SPACE_PATTERN = new RegExp(
  '[' + String.fromCharCode(160) + String.fromCharCode(8239) + ']',
  'g',
);

function sanitizeForPdf(text: string): string {
  return text.replace(NON_BREAKING_SPACE_PATTERN, ' ');
}

/**
 * Dessine un tableau bordé (en-tête + lignes) à partir de la position Y
 * courante du document. Gère le passage à la page suivante si le tableau
 * dépasse la hauteur disponible. Renvoie la position Y après le tableau.
 */
export function drawPdfTable(
  doc: PDFKit.PDFDocument,
  columns: PdfTableColumn[],
  rows: Record<string, string>[],
  startX = doc.page.margins.left,
): number {
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const bottomLimit = doc.page.height - doc.page.margins.bottom;

  let y = doc.y;

  const ensureSpace = (rowsNeeded = 1) => {
    if (y + ROW_HEIGHT * rowsNeeded > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
    }
  };

  const drawRow = (
    values: Record<string, string>,
    options: { isHeader?: boolean } = {},
  ) => {
    ensureSpace();
    const rowTop = y;

    if (options.isHeader) {
      doc.rect(startX, rowTop, tableWidth, ROW_HEIGHT).fill(HEADER_FILL);
    }

    let x = startX;
    doc
      .font(options.isHeader ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(10)
      .fillColor(options.isHeader ? HEADER_TEXT : ROW_TEXT);

    for (const col of columns) {
      doc.text(
        sanitizeForPdf(values[col.key] ?? ''),
        x + CELL_PADDING_X,
        rowTop + 6,
        {
          width: col.width - CELL_PADDING_X * 2,
          align: col.align ?? 'left',
        },
      );
      x += col.width;
    }

    doc
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .rect(startX, rowTop, tableWidth, ROW_HEIGHT)
      .stroke();

    x = startX;
    for (const col of columns.slice(0, -1)) {
      x += col.width;
      doc
        .moveTo(x, rowTop)
        .lineTo(x, rowTop + ROW_HEIGHT)
        .stroke();
    }

    y = rowTop + ROW_HEIGHT;
  };

  const headerValues: Record<string, string> = {};
  for (const col of columns) headerValues[col.key] = col.header;
  drawRow(headerValues, { isHeader: true });

  for (const row of rows) {
    drawRow(row);
  }

  doc.fillColor('black');
  // Les appels doc.text(str, x, y, ...) positionnés explicitement dans les
  // cellules déplacent aussi le curseur interne doc.x — sans ce reset, le
  // prochain doc.text(str) (sans coordonnées) hérite du x de la dernière
  // cellule au lieu de repartir de la marge gauche de la page.
  doc.x = doc.page.margins.left;
  doc.y = y + 10;
  return doc.y;
}
