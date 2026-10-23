/** Arbre radial des espèces, construit à partir de leur classification. */
import { GROUP_ORDER } from '@/data/reference';
import type { GroupId, Species } from '@/data/types';

/** Rangs dessinés, du centre vers l’extérieur (le règne est au centre). */
const LEVELS = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'] as const;
type Level = (typeof LEVELS)[number];

export interface PhyloNode {
  id: string;
  name: string;
  fr?: string;
  rank: Level;
  children: PhyloNode[];
  parent?: PhyloNode;
  species?: Species;
  /** Groupe de l’app si toute la branche y appartient, sinon `undefined`. */
  group?: GroupId;
  leafCount: number;
  angle: number;
  radius: number;
}

export interface PhyloLayout {
  root: PhyloNode;
  leaves: PhyloNode[];
  /** Branches regroupées par couleur (groupe de l’app, ou `mixed`) en tracés SVG. */
  branches: Partial<Record<GroupId | 'mixed', string>>;
  /** Classes assez fournies pour être nommées sur le pourtour. */
  labels: PhyloNode[];
  size: number;
  center: number;
  /** Rayon du cercle des espèces. */
  outer: number;
}

const groupRank = (g: GroupId | undefined) => (g ? GROUP_ORDER.indexOf(g) : GROUP_ORDER.length);
/** Rang du premier groupe présent dans la branche : les vertébrés passent devant les arthropodes, etc. */
const firstGroup = (n: PhyloNode): number => (n.children.length ? Math.min(...n.children.map(firstGroup)) : groupRank(n.group));

/** Assemble l’arbre : règne → embranchement → classe → ordre → famille → genre → espèce. */
export function buildTree(species: Species[]): PhyloNode {
  const root: PhyloNode = { id: 'root', name: 'Animalia', fr: 'Animaux', rank: 'kingdom', children: [], leafCount: 0, angle: 0, radius: 0 };
  for (const s of species) {
    let node = root;
    for (const rank of LEVELS.slice(1, -1)) {
      const t = s.taxonomy.find((x) => x.rank === rank);
      if (!t) continue;
      const id = `${rank}:${t.name}`;
      let child = node.children.find((c) => c.id === id);
      if (!child) {
        child = { id, name: t.name, fr: t.fr, rank, children: [], parent: node, leafCount: 0, angle: 0, radius: 0 };
        node.children.push(child);
      }
      node = child;
    }
    node.children.push({ id: s.id, name: s.name, rank: 'species', children: [], parent: node, species: s, group: s.group, leafCount: 1, angle: 0, radius: 0 });
  }
  const finish = (n: PhyloNode): void => {
    if (!n.children.length) return;
    n.children.forEach(finish);
    n.leafCount = n.children.reduce((sum, c) => sum + c.leafCount, 0);
    const groups = new Set(n.children.map((c) => c.group ?? 'mixed'));
    n.group = groups.size === 1 && !groups.has('mixed') ? n.children[0].group : undefined;
    // Les groupes de l’app se suivent dans le même ordre que partout ailleurs.
    n.children.sort((a, b) => firstGroup(a) - firstGroup(b) || b.leafCount - a.leafCount || a.name.localeCompare(b.name));
  };
  finish(root);
  return root;
}

const polar = (center: number, r: number, a: number) => [center + r * Math.cos(a), center + r * Math.sin(a)] as const;
const fmt = (n: number) => n.toFixed(1);

/** Segment d’arc de rayon `r` entre deux angles (le plus court, dans le sens des angles croissants). */
function arc(center: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(center, r, from);
  const [x2, y2] = polar(center, r, to);
  const large = Math.abs(to - from) > Math.PI ? 1 : 0;
  const sweep = to > from ? 1 : 0;
  return `M${fmt(x1)} ${fmt(y1)}A${fmt(r)} ${fmt(r)} 0 ${large} ${sweep} ${fmt(x2)} ${fmt(y2)}`;
}

function radial(center: number, r1: number, r2: number, a: number): string {
  const [x1, y1] = polar(center, r1, a);
  const [x2, y2] = polar(center, r2, a);
  return `M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`;
}

/** Disposition radiale : les espèces sur le cercle extérieur, chaque rang sur son anneau. */
export function layoutTree(root: PhyloNode, size = 1000): PhyloLayout {
  const center = size / 2;
  const outer = size * 0.35;
  const step = outer / (LEVELS.length - 1);
  const leaves: PhyloNode[] = [];
  const collect = (n: PhyloNode) => (n.children.length ? n.children.forEach(collect) : leaves.push(n));
  collect(root);
  // Un petit vide en haut sépare le premier et le dernier groupe.
  const gap = 0.06;
  const span = Math.PI * 2 - gap;
  leaves.forEach((leaf, i) => {
    leaf.angle = -Math.PI / 2 + gap / 2 + (span * (i + 0.5)) / leaves.length;
    leaf.radius = outer;
  });
  const place = (n: PhyloNode): void => {
    if (!n.children.length) return;
    n.children.forEach(place);
    n.angle = (n.children[0].angle + n.children[n.children.length - 1].angle) / 2;
    n.radius = step * LEVELS.indexOf(n.rank);
  };
  place(root);

  const branches: PhyloLayout['branches'] = {};
  const add = (key: GroupId | 'mixed', d: string) => {
    branches[key] = (branches[key] ?? '') + d;
  };
  const draw = (n: PhyloNode): void => {
    if (!n.children.length) return;
    const key = n.group ?? 'mixed';
    if (n.children.length > 1 && n !== root) add(key, arc(center, n.radius, n.children[0].angle, n.children[n.children.length - 1].angle));
    for (const c of n.children) {
      add(c.group ?? 'mixed', radial(center, n === root ? 0 : n.radius, c.radius, c.angle));
      draw(c);
    }
  };
  draw(root);

  const labels: PhyloNode[] = [];
  const findClasses = (n: PhyloNode) => {
    if (n.rank === 'class') {
      if (n.leafCount >= 4) labels.push(n);
      return;
    }
    n.children.forEach(findClasses);
  };
  findClasses(root);

  return { root, leaves, branches, labels, size, center, outer };
}

/** Chemin de l’espèce jusqu’à la racine, pour la surligner. */
export function lineagePath(leaf: PhyloNode, center: number): string {
  let d = '';
  let node = leaf;
  while (node.parent) {
    const parent = node.parent;
    d += radial(center, node.radius, parent.radius, node.angle);
    if (parent.parent && Math.abs(parent.angle - node.angle) > 1e-6) d += arc(center, parent.radius, Math.min(node.angle, parent.angle), Math.max(node.angle, parent.angle));
    node = parent;
  }
  return d;
}

/** Ancêtres d’une feuille, du règne au genre. */
export function lineage(leaf: PhyloNode): PhyloNode[] {
  const out: PhyloNode[] = [];
  for (let n = leaf.parent; n; n = n.parent) out.unshift(n);
  return out;
}

/** Espèce dont l’angle est le plus proche (les feuilles sont rangées par angle croissant). */
export function nearestLeaf(layout: PhyloLayout, angle: number): PhyloNode {
  const { leaves } = layout;
  const first = leaves[0].angle;
  // Ramène l’angle dans le tour qui commence à la première feuille.
  const a = first + ((((angle - first) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
  let lo = 0;
  let hi = leaves.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (leaves[mid].angle < a) lo = mid + 1;
    else hi = mid;
  }
  // Voisines de part et d’autre, sans oublier le raccord entre la dernière et la première.
  const candidates = [leaves[lo], leaves[lo - 1], leaves[0], leaves[leaves.length - 1]].filter((l) => l !== undefined);
  const dist = (l: PhyloNode) => Math.abs(Math.atan2(Math.sin(a - l.angle), Math.cos(a - l.angle)));
  return candidates.reduce((best, l) => (dist(l) < dist(best) ? l : best));
}

export interface GroupRun {
  group: GroupId;
  leaves: PhyloNode[];
  /** Angle médian du secteur. */
  angle: number;
}

/** Secteurs du cercle : une suite d’espèces voisines du même groupe. Ne garde que le plus grand secteur de chaque groupe. */
export function groupSectors(layout: PhyloLayout): GroupRun[] {
  const runs: GroupRun[] = [];
  for (const leaf of layout.leaves) {
    const group = leaf.group ?? 'others';
    const last = runs[runs.length - 1];
    if (last && last.group === group) last.leaves.push(leaf);
    else runs.push({ group, leaves: [leaf], angle: 0 });
  }
  const best = new Map<GroupId, GroupRun>();
  for (const run of runs) {
    run.angle = (run.leaves[0].angle + run.leaves[run.leaves.length - 1].angle) / 2;
    const current = best.get(run.group);
    if (!current || run.leaves.length > current.leaves.length) best.set(run.group, run);
  }
  return runs.filter((r) => best.get(r.group) === r);
}

/** Nom court d’un clade pour le pourtour : nom français allégé, sinon nom savant. */
export function cladeLabel(n: PhyloNode): string {
  if (!n.fr) return n.name;
  let name = n.fr
    .replace(/\s*\(.*?\)/g, '')
    .replace(/,?\s+et\s+apparentés$/i, '')
    .trim();
  while (name.length > 24 && name.includes(',')) name = name.slice(0, name.lastIndexOf(','));
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/** Lignées des espèces découvertes, regroupées par couleur de groupe. */
export function litPaths(layout: PhyloLayout, isLit: (id: string) => boolean): Partial<Record<GroupId, string>> {
  const out: Partial<Record<GroupId, string>> = {};
  for (const leaf of layout.leaves) {
    if (!isLit(leaf.id)) continue;
    const group = leaf.group ?? 'others';
    out[group] = (out[group] ?? '') + lineagePath(leaf, layout.center);
  }
  return out;
}

export { polar };
