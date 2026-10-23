import { SPECIES } from '@/data';

import { buildTree, cladeLabel, groupSectors, layoutTree, lineage, lineagePath, litPaths, nearestLeaf, type PhyloNode } from '../phylo';

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

  it('retrouve l’espèce touchée par son angle, même au passage du tour', () => {
    const tiger = layout.leaves.find((l) => l.id === 'tigre')!;
    expect(nearestLeaf(layout, tiger.angle + 0.001).id).toBe('tigre');
    expect(nearestLeaf(layout, tiger.angle + Math.PI * 2).id).toBe('tigre');
    const first = layout.leaves[0];
    const last = layout.leaves[layout.leaves.length - 1];
    expect(nearestLeaf(layout, first.angle - 0.0001).id).toBe(first.id);
    expect(nearestLeaf(layout, last.angle + 0.0001).id).toBe(last.id);
  });

  it('range les groupes dans l’ordre de l’app, des mammifères aux autres invertébrés', () => {
    const sectors = groupSectors(layout);
    expect(sectors[0].group).toBe('mammals');
    expect(new Set(sectors.map((s) => s.group)).size).toBe(sectors.length);
    for (let i = 1; i < sectors.length; i++) expect(sectors[i].angle).toBeGreaterThan(sectors[i - 1].angle);
    const mammals = sectors[0];
    expect(mammals.leaves.every((l) => l.group === 'mammals')).toBe(true);
  });

  it('abrège les noms de clades', () => {
    const node = (name: string, fr?: string) => ({ name, fr }) as PhyloNode;
    expect(cladeLabel(node('Lepidoptera', 'Lépidoptères (Papillons)'))).toBe('Lépidoptères');
    expect(cladeLabel(node('Strigiformes', 'Hiboux, Chouettes et apparentés'))).toBe('Hiboux, chouettes');
    expect(cladeLabel(node('Eulipotyphla', 'Musaraignes, hérissons, taupes et apparentés'))).toBe('Musaraignes, hérissons');
    expect(cladeLabel(node('Perciformes'))).toBe('Perciformes');
  });

  it('n’illumine que les lignées des espèces découvertes', () => {
    const paths = litPaths(layout, (id) => id === 'lion' || id === 'tigre');
    expect(Object.keys(paths)).toEqual(['mammals']);
    expect(litPaths(layout, () => false)).toEqual({});
  });
});
