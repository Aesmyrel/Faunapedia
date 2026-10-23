import { getSpecies, SPECIES } from '@/data';

import { animalBox, stretchedBodyPath } from '../scale';

const typical = (r?: readonly [number, number]) => (r ? (r[0] + r[1]) / 2 : 0);

const box = (id: string) => {
  const s = getSpecies(id);
  if (!s) throw new Error(id);
  const b = animalBox(s);
  if (!b) throw new Error(`pas d’emprise : ${id}`);
  return b;
};

describe('comparaison d’échelle', () => {
  it('ne dessine jamais un animal plus grand que ses mensurations', () => {
    const oversized = SPECIES.filter((s) => {
      const b = animalBox(s);
      const { length, height, wingspan } = s.stats;
      const largest = Math.max(length?.[1] ?? 0, height?.[1] ?? 0, wingspan?.[1] ?? 0);
      return b !== null && Math.max(b.width, b.height) > largest + 1e-9;
    }).map((s) => s.id);
    expect(oversized).toEqual([]);
  });

  it('dessine un adulte moyen, pas un record', () => {
    const eagle = box('aigle-royal');
    expect(Math.max(eagle.width, eagle.height)).toBeLessThanOrEqual(typical(getSpecies('aigle-royal')?.stats.length) + 1e-9);
    expect(eagle.rotated).toBe(false);
  });

  it('borne le dessin par la hauteur au garrot quand elle est connue', () => {
    for (const id of ['hippopotame', 'elephant-de-savane', 'panda-geant', 'zebre-des-plaines', 'dromadaire']) {
      const s = getSpecies(id);
      expect({ id, ok: box(id).height <= typical(s?.stats.height) + 1e-9 }).toEqual({ id, ok: true });
    }
  });

  it('couche les silhouettes vues de dessus', () => {
    const shark = box('requin-marteau-halicorne');
    if (shark.rotated) expect(shark.width).toBeGreaterThan(shark.height);
    // Postures réellement verticales conservées
    expect(box('ours-brun').rotated).toBe(false);
    expect(box('ver-tubicole-geant').rotated).toBe(false);
  });

  it('étire les serpents sur toute leur longueur', () => {
    const cobra = box('cobra-royal');
    expect(cobra.stretched).toBe(true);
    expect(cobra.width).toBeCloseTo(typical(getSpecies('cobra-royal')?.stats.length));
    expect(cobra.height).toBeLessThan(cobra.width / 5);
    expect(stretchedBodyPath(cobra.width, cobra.height)).toMatch(/^M[\d. ]+L.*z/);
  });

  it('garde la hauteur pour les grands animaux mesurés debout', () => {
    expect(box('girafe').height).toBeCloseTo(typical(getSpecies('girafe')?.stats.height));
    expect(box('autruche').height).toBeCloseTo(typical(getSpecies('autruche')?.stats.height));
  });
});
