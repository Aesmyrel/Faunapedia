import { qrShape } from '../qr';

/** Reconstruit la grille de modules à partir du tracé. */
function toGrid(size: number, path: string): boolean[][] {
  const grid = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  for (const [, x, y, w] of path.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
    for (let c = Number(x); c < Number(x) + Number(w); c++) grid[Number(y)][c] = true;
  }
  return grid;
}

/** Motif de repérage 7×7 : bord sombre, anneau clair, cœur 3×3 sombre. */
function hasFinder(grid: boolean[][], top: number, left: number): boolean {
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const ring = r === 0 || r === 6 || c === 0 || c === 6;
      const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      if (grid[top + r][left + c] !== (ring || core)) return false;
    }
  }
  return true;
}

describe('QR code', () => {
  const url = 'https://github.com/Aesmyrel/Faunapedia';

  it('produit une grille valide avec les trois motifs de repérage', () => {
    const { size, path } = qrShape(url);
    expect((size - 17) % 4).toBe(0);
    const grid = toGrid(size, path);
    expect(hasFinder(grid, 0, 0)).toBe(true);
    expect(hasFinder(grid, 0, size - 7)).toBe(true);
    expect(hasFinder(grid, size - 7, 0)).toBe(true);
  });

  it('est déterministe et grandit avec la correction d’erreurs', () => {
    expect(qrShape(url)).toEqual(qrShape(url));
    expect(qrShape(url, 'H').size).toBeGreaterThan(qrShape(url, 'L').size);
  });

  it('encode les caractères accentués en UTF-8', () => {
    expect(() => qrShape('Œdicnème criard, éléphant')).not.toThrow();
    expect(qrShape('é').path).not.toEqual(qrShape('e').path);
  });
});
