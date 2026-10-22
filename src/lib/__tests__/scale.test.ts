import { getSpecies, SPECIES } from '@/data';

import { animalBox, stretchedBodyPath } from '../scale';

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

  it('reporte la longueur d’un oiseau perché sur sa hauteur', () => {
    const eagle = box('aigle-royal');
    expect(eagle.height).toBeCloseTo(102);
    expect(eagle.width).toBeLessThan(eagle.height);
    expect(eagle.rotated).toBe(false);
  });

  it('couche les silhouettes vues de dessus', () => {
    const croc = box('crocodile-du-nil');
    expect(croc.rotated).toBe(true);
    expect(croc.width).toBeCloseTo(500);
    expect(croc.height).toBeLessThan(croc.width);
    expect(box('requin-marteau-halicorne').rotated).toBe(true);
    // Postures réellement verticales conservées
    expect(box('ours-brun').rotated).toBe(false);
    expect(box('ver-tubicole-geant').rotated).toBe(false);
  });

  it('étire les serpents sur toute leur longueur', () => {
    const cobra = box('cobra-royal');
    expect(cobra.stretched).toBe(true);
    expect(cobra.width).toBeCloseTo(550);
    expect(cobra.height).toBeLessThan(cobra.width / 5);
    expect(stretchedBodyPath(cobra.width, cobra.height)).toMatch(/^M[\d. ]+L.*z/);
  });

  it('garde la hauteur pour les grands animaux mesurés debout', () => {
    expect(box('girafe').height).toBeCloseTo(580);
    expect(box('autruche').height).toBeCloseTo(275);
  });
});
