/** Recherche locale tolérante (accents, fautes de frappe) et filtres combinables. */
import { GROUPS, IUCN } from '@/data/reference';
import type { Activity, Diet, GroupId, Habitat, IucnStatus, Region, Species } from '@/data/types';

import { normalize } from './format';

interface IndexEntry {
  species: Species;
  name: string;
  nameWords: string[];
  aka: string[];
  sci: string;
  taxa: string[];
  group: string;
}

function buildEntry(s: Species): IndexEntry {
  const name = normalize(s.name);
  return {
    species: s,
    name,
    nameWords: name.split(' '),
    aka: (s.aka ?? []).map(normalize),
    sci: normalize(s.sci),
    taxa: s.taxonomy.flatMap((t) => [normalize(t.name), t.fr ? normalize(t.fr) : '']).filter(Boolean),
    group: normalize(GROUPS[s.group].label),
  };
}

/** Distance de Levenshtein bornée (arrêt anticipé au-delà de `max`). */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function scoreEntry(e: IndexEntry, q: string): number {
  if (!q) return 1;
  if (e.name === q) return 100;
  if (e.name.startsWith(q)) return 85;
  if (e.nameWords.some((w) => w.startsWith(q))) return 75;
  if (e.aka.some((a) => a === q || a.startsWith(q))) return 65;
  if (e.sci.startsWith(q) || e.sci.split(' ').some((w) => w.startsWith(q))) return 60;
  if (e.name.includes(q) || e.aka.some((a) => a.includes(q))) return 50;
  if (e.sci.includes(q)) return 45;
  if (q.length >= 3 && e.taxa.some((t) => t.startsWith(q))) return 30;
  if (q.length >= 3 && e.group.startsWith(q)) return 20;
  if (q.length >= 4) {
    const max = q.length >= 8 ? 2 : 1;
    const words = [...e.nameWords, ...e.aka.flatMap((a) => a.split(' ')), ...e.sci.split(' ')];
    if (words.some((w) => editDistance(w, q, max) <= max)) return 25;
    if (words.some((w) => w.length > q.length && editDistance(w.slice(0, q.length), q, 1) <= 1)) return 15;
  }
  return 0;
}

export interface SpeciesFilters {
  groups?: GroupId[];
  statuses?: IucnStatus[];
  habitats?: Habitat[];
  regions?: Region[];
  diets?: Diet[];
  activities?: Activity[];
}

export type SortKey = 'relevance' | 'name' | 'size' | 'weight' | 'threat' | 'popularity';

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Pertinence',
  name: 'Nom (A → Z)',
  size: 'Taille',
  weight: 'Poids',
  threat: 'Menace',
  popularity: 'Popularité',
};

export function maxSize(s: Species): number {
  return Math.max(s.stats.length?.[1] ?? 0, s.stats.height?.[1] ?? 0, s.stats.wingspan?.[1] ?? 0);
}

const any = <T,>(selected: T[] | undefined, values: readonly T[]) =>
  !selected?.length || selected.some((v) => values.includes(v));

export function matchesFilters(s: Species, f: SpeciesFilters): boolean {
  return (
    (!f.groups?.length || f.groups.includes(s.group)) &&
    (!f.statuses?.length || f.statuses.includes(s.status)) &&
    any(f.habitats, s.habitats) &&
    any(f.regions, s.regions) &&
    any(f.diets, s.diet) &&
    (!f.activities?.length || f.activities.includes(s.activity))
  );
}

export function countActiveFilters(f: SpeciesFilters): number {
  return (
    (f.statuses?.length ?? 0) +
    (f.habitats?.length ?? 0) +
    (f.regions?.length ?? 0) +
    (f.diets?.length ?? 0) +
    (f.activities?.length ?? 0)
  );
}

export function createSearch(species: Species[]) {
  const index = species.map(buildEntry);
  return function search(query: string, filters: SpeciesFilters = {}, sort: SortKey = 'relevance'): Species[] {
    const q = normalize(query);
    const scored = index
      .map((e) => ({ s: e.species, score: scoreEntry(e, q) }))
      .filter(({ s, score }) => score > 0 && matchesFilters(s, filters));
    const byName = (a: Species, b: Species) => a.name.localeCompare(b.name, 'fr');
    const comparators: Record<SortKey, (a: { s: Species; score: number }, b: { s: Species; score: number }) => number> = {
      relevance: (a, b) => (q ? b.score - a.score : 0) || byName(a.s, b.s),
      name: (a, b) => byName(a.s, b.s),
      size: (a, b) => maxSize(b.s) - maxSize(a.s),
      weight: (a, b) => (b.s.stats.weight?.[1] ?? -1) - (a.s.stats.weight?.[1] ?? -1),
      threat: (a, b) => IUCN[b.s.status].level - IUCN[a.s.status].level || byName(a.s, b.s),
      popularity: (a, b) => (b.s.observations ?? 0) - (a.s.observations ?? 0),
    };
    return scored.sort(comparators[sort]).map(({ s }) => s);
  };
}
