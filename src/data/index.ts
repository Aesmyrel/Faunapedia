/**
 * Point d’accès unique aux fiches : fusionne le rédactionnel et les données
 * enrichies, et expose quelques sélecteurs.
 */
import { curatedSpecies } from './curated';
import enrichmentJson from './generated/enrichment.json';
import { GROUP_ORDER } from './reference';
import type { GroupId, Photo, Species, TaxonNode } from './types';

type Enrichment = Partial<Omit<Species, keyof import('./types').CuratedSpecies>> & {
  status?: Species['status'];
  photos?: Photo[];
  taxonomy?: TaxonNode[];
};

const enrichment = enrichmentJson as unknown as Record<string, Enrichment>;

export const SPECIES: Species[] = curatedSpecies.map((c) => {
  const e = enrichment[c.id] ?? {};
  return {
    ...c,
    ...e,
    // Le statut officiel (UICN via iNaturalist) prime ; sinon on garde celui de la fiche rédigée.
    status: e.statusSource === 'iucn' && e.status ? e.status : c.status,
    statusSource: e.statusSource === 'iucn' ? 'iucn' : 'curated',
    photos: e.photos ?? [],
    taxonomy: e.taxonomy ?? [],
  };
});

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

const BY_INAT: Map<number, Species> = new Map(
  SPECIES.filter((s) => s.inatId).map((s) => [s.inatId as number, s]),
);

export function getSpecies(id: string | undefined): Species | undefined {
  return id ? SPECIES_BY_ID[id] : undefined;
}

export function getSpeciesByInatId(id: number | undefined): Species | undefined {
  return id === undefined ? undefined : BY_INAT.get(id);
}

export const SPECIES_BY_GROUP: Record<GroupId, Species[]> = Object.fromEntries(
  GROUP_ORDER.map((g) => [g, SPECIES.filter((s) => s.group === g)]),
) as Record<GroupId, Species[]>;

/** Taille d’affichage d’une photo iNaturalist. */
export type PhotoSize = 'square' | 'small' | 'medium' | 'large' | 'original';

export function photoUrl(photo: Photo | undefined, size: PhotoSize = 'medium'): string | undefined {
  return photo?.url.replace('/medium.', `/${size}.`);
}

export function coverUrl(s: Species, size: PhotoSize = 'medium'): string | undefined {
  return photoUrl(s.photos[0], size);
}

/** Nœud taxonomique d’un rang donné (ordre, famille…). */
export function taxonAt(s: Species, rank: string): TaxonNode | undefined {
  return s.taxonomy.find((t) => t.rank === rank);
}

/** Dernier ancêtre commun de deux espèces dans la classification. */
export function commonAncestor(a: Species, b: Species): TaxonNode | undefined {
  const ids = new Set(b.taxonomy.map((t) => t.id));
  let last: TaxonNode | undefined;
  for (const t of a.taxonomy) {
    if (ids.has(t.id)) last = t;
    else break;
  }
  return last;
}

/** Nombre de rangs partagés : mesure grossière de parenté. */
export function kinship(a: Species, b: Species): number {
  const ids = new Set(b.taxonomy.map((t) => t.id));
  let n = 0;
  for (const t of a.taxonomy) {
    if (!ids.has(t.id)) break;
    n++;
  }
  return n;
}

/** Espèces les plus proches dans la classification (hors elle-même). */
export function relatedSpecies(s: Species, limit = 10): Species[] {
  return SPECIES.filter((o) => o.id !== s.id)
    .map((o) => ({ o, k: kinship(s, o) + (o.group === s.group ? 0.5 : 0) }))
    .filter(({ k }) => k >= 3)
    .sort((x, y) => y.k - x.k || x.o.name.localeCompare(y.o.name, 'fr'))
    .slice(0, limit)
    .map(({ o }) => o);
}

/** Hachage simple et stable d’une chaîne (pour les tirages quotidiens). */
export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Espèce du jour : identique pour tout le monde à une date donnée. */
export function speciesOfTheDay(dateKey: string): Species {
  const pool = SPECIES.filter((s) => s.photos.length > 0);
  return pool[hashString(`espece-${dateKey}`) % pool.length];
}
