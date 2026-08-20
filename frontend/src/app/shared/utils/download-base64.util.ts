/** Déclenche le téléchargement d'un fichier encodé en base64 (ex : PDF renvoyé par l'API). */
export function downloadBase64File(
  filename: string,
  base64Content: string,
  mimeType = 'application/pdf',
): void {
  const byteChars = atob(base64Content);
  const byteNumbers = new Array<number>(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
