import { SPECIES } from '@/data';

import { buildTree, layoutTree, leafAt, lineage, lineagePath, polar } from '../phylo';

describe('arbre des espèces', () => {
  const root = buildTree(SPECIES);
  const layout = layoutTree(root);

  it('place chaque espèce une seule fois sur le cercle extérieur', () => {
    expect(layout.leaves).toHaveLength(SPECIES.length);
    expect(new Set(layout.leaves.map((l) => l.id)).size).toBe(SPECIES.length);
    expect(root.leafCount).toBe(SPECIES.length);
    for (const l of layout.leaves) expect(l.radius).toBeCloseTo(layout.outer);
  });

  it('suit la classification : le lion descend des carnivores et des félidés', () => {
    const lion = layout.leaves.find((l) => l.id === 'lion')!;
    const names = lineage(lion).map((n) => n.name);
    expect(names).toEqual(expect.arrayContaining(['Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Felidae', 'Panthera']));
    expect(lineagePath(lion, layout.center)).toMatch(/^M[\d.]+ [\d.]+L/);
  });

  it('regroupe les espèces proches côte à côte', () => {
    const angle = (id: string) => layout.leaves.find((l) => l.id === id)!.angle;
    const close = Math.abs(angle('lion') - angle('tigre'));
    const far = Math.abs(angle('lion') - angle('corbeille-de-venus'));
    expect(close).toBeLessThan(far);
  });

  it('colore les branches par groupe et nomme les grandes classes', () => {
    expect(Object.keys(layout.branches)).toEqual(expect.arrayContaining(['mammals', 'birds', 'mixed']));
    expect(layout.labels.map((l) => l.name)).toEqual(expect.arrayContaining(['Mammalia', 'Aves', 'Insecta']));
  });

  it('retrouve l’espèce touchée', () => {
    const tiger = layout.leaves.find((l) => l.id === 'tigre')!;
    const [x, y] = polar(layout.center, tiger.radius, tiger.angle);
    expect(leafAt(layout, x + 1, y - 1, 10)?.id).toBe('tigre');
    expect(leafAt(layout, layout.center, layout.center, 10)).toBeUndefined();
  });
});
