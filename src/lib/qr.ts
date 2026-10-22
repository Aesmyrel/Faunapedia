/** Encodage QR code, rendu sous forme de tracé SVG. */
import createQr from 'qrcode-generator';

export type QrLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrShape {
  /** Nombre de modules par côté (marge non comprise). */
  size: number;
  /** Tracé des modules sombres, un module valant une unité. */
  path: string;
}

/** Une lettre par octet UTF-8 : l’encodeur de la bibliothèque ne garde que l’octet de poids faible. */
function utf8Bytes(text: string): string {
  return Array.from(new TextEncoder().encode(text), (b) => String.fromCharCode(b)).join('');
}

/**
 * Encode un texte (UTF-8) et regroupe les modules sombres consécutifs de chaque
 * ligne en un seul rectangle, pour un tracé compact.
 */
export function qrShape(text: string, level: QrLevel = 'M'): QrShape {
  const qr = createQr(0, level);
  qr.addData(utf8Bytes(text), 'Byte');
  qr.make();
  const size = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < size; row++) {
    let col = 0;
    while (col < size) {
      if (!qr.isDark(row, col)) {
        col++;
        continue;
      }
      const start = col;
      while (col < size && qr.isDark(row, col)) col++;
      path += `M${start} ${row}h${col - start}v1h${start - col}z`;
    }
  }
  return { size, path };
}
