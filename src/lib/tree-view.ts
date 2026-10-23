/**
 * Géométrie de la vue de l’arbre : passage entre le dessin (unités du tracé)
 * et l’écran (points), pour un zoom `s` et un décalage `tx`, `ty`.
 */

export interface TreeFrame {
  /** Taille de la scène, en points. */
  width: number;
  height: number;
  /** Centre de l’arbre dans la scène au zoom 1. */
  cx: number;
  cy: number;
  /** Points par unité du dessin au zoom 1. */
  k: number;
  /** Centre de l’arbre dans le dessin. */
  center: number;
}

export interface TreeView {
  s: number;
  tx: number;
  ty: number;
}

export const HOME_VIEW: TreeView = { s: 1, tx: 0, ty: 0 };

/**
 * Portion du dessin couverte par la scène, au format `viewBox` (x, y, largeur, hauteur).
 * `over` élargit la zone d’une fraction de la scène de chaque côté.
 */
export function viewBoxFor(v: TreeView, f: TreeFrame, over = 0): [number, number, number, number] {
  const scale = v.s * f.k;
  return [
    f.center - (f.cx + v.tx + over * f.width) / scale,
    f.center - (f.cy + v.ty + over * f.height) / scale,
    (f.width * (1 + 2 * over)) / scale,
    (f.height * (1 + 2 * over)) / scale,
  ];
}

/** Point de l’écran → point du dessin. */
export function toDrawing(v: TreeView, f: TreeFrame, x: number, y: number): [number, number] {
  const scale = v.s * f.k;
  return [f.center + (x - f.cx - v.tx) / scale, f.center + (y - f.cy - v.ty) / scale];
}

/** Décalage maximal autorisé : peu au zoom 1, jusqu’au pourtour (et ses noms) quand on zoome. */
export function panLimit(s: number, rim: number): number {
  'worklet';
  return (s - 1) * (rim + 70) + 46;
}

export const clampView = (v: TreeView, rim: number, minZoom: number, maxZoom: number): TreeView => {
  const s = Math.min(maxZoom, Math.max(minZoom, v.s));
  const limit = panLimit(s, rim);
  const clamp = (t: number) => Math.max(-limit, Math.min(limit, t));
  return { s, tx: clamp(v.tx), ty: clamp(v.ty) };
};

/**
 * Vue qui cadre une zone du dessin (`[minX, minY, maxX, maxY]`) dans la scène,
 * en laissant `bottom` points libres en bas (pour la carte du dessous).
 */
export function fitView(f: TreeFrame, box: readonly [number, number, number, number], bottom = 0, maxZoom = Infinity, fill = 0.86): TreeView {
  const [minX, minY, maxX, maxY] = box;
  const w = Math.max(1, (maxX - minX) * f.k);
  const h = Math.max(1, (maxY - minY) * f.k);
  const s = Math.min(maxZoom, (f.width * fill) / w, ((f.height - bottom) * fill) / h);
  // Centre de la zone, relatif au centre de l’arbre, en points au zoom 1.
  const mx = ((minX + maxX) / 2 - f.center) * f.k;
  const my = ((minY + maxY) / 2 - f.center) * f.k;
  return { s, tx: f.width / 2 - f.cx - s * mx, ty: (f.height - bottom) / 2 - f.cy - s * my };
}

/** Vue qui amène un point du dessin au centre de la zone visible, au zoom `s`. */
export function centerOn(f: TreeFrame, x: number, y: number, s: number, bottom = 0): TreeView {
  return fitView(f, [x, y, x, y], bottom, s);
}
