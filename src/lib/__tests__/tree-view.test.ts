import { centerOn, clampView, fitView, HOME_VIEW, panLimit, type TreeFrame, toDrawing, viewBoxFor } from '../tree-view';

const frame: TreeFrame = { width: 400, height: 600, cx: 200, cy: 250, k: 0.5, center: 500 };

describe('vue de l’arbre', () => {
  it('au zoom 1, le centre de l’arbre est au centre de sa zone', () => {
    expect(toDrawing(HOME_VIEW, frame, 200, 250)).toEqual([500, 500]);
    expect(viewBoxFor(HOME_VIEW, frame)).toEqual([100, 0, 800, 1200]);
  });

  it('élargit la zone dessinée de chaque côté', () => {
    const [x, y, w, h] = viewBoxFor(HOME_VIEW, frame, 0.25);
    expect([x, y, w, h]).toEqual([-100, -300, 1200, 1800]);
  });

  it('zoome et décale de façon cohérente', () => {
    const v = { s: 2, tx: 30, ty: -40 };
    const [x, y, w] = viewBoxFor(v, frame);
    expect(w).toBe(400);
    // Le coin haut gauche de l’écran correspond au début de la zone dessinée.
    expect(toDrawing(v, frame, 0, 0)).toEqual([x, y]);
  });

  it('cadre une zone au centre de la partie visible', () => {
    const v = fitView(frame, [600, 600, 700, 700], 100);
    // Le centre de la zone (650, 650) arrive au centre de l’espace libre (200, 250).
    expect(toDrawing(v, frame, 200, 250).map((n) => Math.round(n))).toEqual([650, 650]);
    expect(v.s).toBeCloseTo((400 * 0.86) / 50);
    expect(centerOn(frame, 650, 650, 3, 100).s).toBe(3);
  });

  it('borne le zoom et les déplacements', () => {
    expect(clampView({ s: 20, tx: 0, ty: 0 }, 160, 1, 9).s).toBe(9);
    const v = clampView({ s: 1, tx: 500, ty: -500 }, 160, 1, 9);
    expect(v).toEqual({ s: 1, tx: panLimit(1, 160), ty: -panLimit(1, 160) });
    expect(panLimit(4, 160)).toBeGreaterThan(4 * 160);
  });
});
