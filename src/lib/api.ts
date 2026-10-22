/**
 * Clients des API ouvertes interrogées en direct : iNaturalist (arbre du
 * vivant, sons, observations), Wikipédia (articles) et GBIF (cartes).
 */
import type { Photo } from '@/data/types';

const INAT = 'https://api.inaturalist.org/v1';
const WIKI = 'https://fr.wikipedia.org';
const OPEN_LICENSES = 'cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd';

// ───────────────────────────── Cache mémoire ─────────────────────────────

const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
const TTL = 30 * 60 * 1000;

export async function fetchJson<T>(url: string, ttl = TTL): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;
  const p = (async () => {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as T;
    cache.set(url, { at: Date.now(), value: json });
    return json;
  })().finally(() => inflight.delete(url));
  inflight.set(url, p);
  return p;
}

export function peekCache<T>(url: string): T | undefined {
  return cache.get(url)?.value as T | undefined;
}

// ───────────────────────────── iNaturalist ─────────────────────────────

export interface INatPhoto {
  id: number;
  license_code: string | null;
  attribution: string;
  url: string;
  medium_url?: string;
  original_dimensions?: { width: number; height: number };
}

export interface INatTaxon {
  id: number;
  name: string;
  rank: string;
  rank_level: number;
  preferred_common_name?: string;
  english_common_name?: string;
  observations_count?: number;
  complete_species_count?: number | null;
  extinct?: boolean;
  iconic_taxon_name?: string;
  wikipedia_url?: string | null;
  default_photo?: INatPhoto | null;
  ancestors?: INatTaxon[];
  ancestor_ids?: number[];
  taxon_photos?: { photo: INatPhoto }[];
  conservation_status?: { status?: string; iucn?: number; authority?: string; place?: unknown } | null;
  children?: INatTaxon[];
}

interface Paged<T> {
  total_results: number;
  results: T[];
}

export function inatPhoto(p: INatPhoto | null | undefined, size: 'square' | 'small' | 'medium' | 'large' = 'medium') {
  if (!p) return undefined;
  return (p.medium_url ?? p.url).replace(/\/(square|small|thumb|medium|large|original)\./, `/${size}.`);
}

export function toPhoto(p: INatPhoto): Photo | null {
  if (!p.license_code) return null;
  return {
    url: inatPhoto(p, 'medium') as string,
    w: p.original_dimensions?.width,
    h: p.original_dimensions?.height,
    attribution: p.attribution,
    license: p.license_code.toUpperCase().replace(/^CC-/, 'CC '),
  };
}

export async function getTaxon(id: number): Promise<INatTaxon> {
  const res = await fetchJson<Paged<INatTaxon>>(`${INAT}/taxa/${id}?locale=fr`);
  if (!res.results[0]) throw new Error('Taxon introuvable');
  return res.results[0];
}

/** Sous-taxons directs, les plus observés d’abord. */
export async function getChildren(id: number): Promise<INatTaxon[]> {
  const res = await fetchJson<Paged<INatTaxon>>(
    `${INAT}/taxa?parent_id=${id}&locale=fr&is_active=true&per_page=200&order_by=observations_count&order=desc`,
  );
  return res.results;
}

/** Recherche dans toute la faune mondiale (descendants d’Animalia). */
export async function searchAnimals(q: string): Promise<INatTaxon[]> {
  const res = await fetchJson<Paged<INatTaxon>>(
    `${INAT}/taxa/autocomplete?q=${encodeURIComponent(q)}&taxon_id=1&is_active=true&locale=fr&per_page=20`,
  );
  return res.results;
}

export interface SoundClip {
  url: string;
  attribution: string;
  license: string;
  place?: string;
}

interface INatObservation {
  id: number;
  place_guess?: string;
  sounds?: { file_url: string; file_content_type?: string; license_code: string | null; attribution: string }[];
}

/** Enregistrements sonores sous licence libre, les mieux notés d’abord. */
export async function getSounds(taxonId: number, limit = 6): Promise<SoundClip[]> {
  const res = await fetchJson<Paged<INatObservation>>(
    `${INAT}/observations?taxon_id=${taxonId}&sounds=true&sound_license=${OPEN_LICENSES}` +
      `&quality_grade=research&order_by=votes&per_page=${limit * 2}`,
  );
  const clips: SoundClip[] = [];
  for (const o of res.results) {
    const s = (o.sounds ?? []).find((x) => x.license_code && !/wav/.test(x.file_content_type ?? ''))
      ?? (o.sounds ?? []).find((x) => x.license_code);
    if (!s?.license_code) continue;
    clips.push({
      url: s.file_url,
      attribution: s.attribution,
      license: s.license_code.toUpperCase().replace(/^CC-/, 'CC '),
      place: o.place_guess,
    });
    if (clips.length >= limit) break;
  }
  return clips;
}

export interface NearbySpecies {
  count: number;
  taxon: INatTaxon;
}

/** Espèces animales observées (qualité recherche) dans un rayon donné (km). */
export async function getNearby(lat: number, lng: number, radiusKm: number, iconic?: string): Promise<NearbySpecies[]> {
  const iconicParam = iconic ? `&iconic_taxa=${iconic}` : '';
  const res = await fetchJson<Paged<NearbySpecies>>(
    `${INAT}/observations/species_counts?lat=${lat.toFixed(3)}&lng=${lng.toFixed(3)}&radius=${radiusKm}` +
      `&taxon_id=1&quality_grade=research&locale=fr&per_page=60${iconicParam}`,
  );
  return res.results;
}

// ───────────────────────────── Wikipédia ─────────────────────────────

export interface WikiSection {
  title: string;
  level: number;
  text: string;
}

const SKIPPED_SECTIONS =
  /^(notes?( et références)?|références|voir aussi|bibliographie|liens externes|annexes|galerie|articles connexes|sources|publication originale|filmographie|webographie|références taxinomiques)$/i;

/** Article complet découpé en sections (texte brut). */
export async function getWikiArticle(title: string): Promise<{ title: string; intro: string; sections: WikiSection[] }> {
  const url =
    `${WIKI}/w/api.php?action=query&format=json&origin=*&redirects=1&prop=extracts` +
    `&explaintext=1&exsectionformat=wiki&titles=${encodeURIComponent(title)}`;
  const res = await fetchJson<{ query: { pages: Record<string, { title: string; extract?: string }> } }>(url);
  const page = Object.values(res.query.pages)[0];
  if (!page?.extract) throw new Error('Article introuvable');
  return { title: page.title, ...splitSections(page.extract) };
}

export function splitSections(extract: string): { intro: string; sections: WikiSection[] } {
  const lines = extract.split('\n');
  const sections: WikiSection[] = [];
  let intro = '';
  let current: WikiSection | null = null;
  let skipLevel = 0;
  for (const raw of lines) {
    const m = raw.match(/^(={2,5})\s*(.+?)\s*\1\s*$/);
    if (m) {
      const level = m[1].length;
      const title = m[2];
      if (skipLevel && level > skipLevel) continue;
      skipLevel = SKIPPED_SECTIONS.test(title) ? level : 0;
      if (skipLevel) {
        current = null;
        continue;
      }
      current = { title, level, text: '' };
      sections.push(current);
      continue;
    }
    if (skipLevel) continue;
    const line = raw.trim();
    if (!line) continue;
    if (current) current.text += (current.text ? '\n\n' : '') + line;
    else intro += (intro ? '\n\n' : '') + line;
  }
  return { intro: cleanWiki(intro), sections: sections.map((s) => ({ ...s, text: cleanWiki(s.text) })).filter((s) => s.text || s.level === 2) };
}

function cleanWiki(text: string): string {
  return text
    .replace(/\s*\\[^\\\n]{1,60}\\/g, '')
    .replace(/\(\s*[;,]?\s*\)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .trim();
}

export interface WikiSummary {
  title: string;
  extract: string;
  thumbnail?: string;
}

/** Résumé d’une page (par nom scientifique, redirections suivies). */
export async function getWikiSummary(title: string): Promise<WikiSummary | null> {
  try {
    const res = await fetchJson<{ title: string; extract?: string; type?: string; thumbnail?: { source: string } }>(
      `${WIKI}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    );
    if (!res.extract || res.type === 'disambiguation') return null;
    return { title: res.title, extract: cleanWiki(res.extract), thumbnail: res.thumbnail?.source };
  } catch {
    return null;
  }
}

export const wikiPageUrl = (title: string) => `${WIKI}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

// ───────────────────────────── GBIF ─────────────────────────────

export type MapStyle = 'dark' | 'light';

/** Tuiles (projection équirectangulaire, zoom 0 = 2 tuiles) du fond de carte GBIF. */
export function gbifBaseTile(x: 0 | 1, style: MapStyle): string {
  return `https://tile.gbif.org/4326/omt/0/${x}/0@2x.png?style=gbif-${style === 'dark' ? 'dark' : 'light'}`;
}

/** Tuiles de densité d’observations pour un taxon GBIF. */
export function gbifDensityTile(taxonKey: number, x: 0 | 1, style: MapStyle): string {
  const palette = style === 'dark' ? 'orangeHeat' : 'purpleYellow';
  return (
    `https://api.gbif.org/v2/map/occurrence/density/0/${x}/0@2x.png?srs=EPSG:4326` +
    `&taxonKey=${taxonKey}&bin=hex&hexPerTile=48&style=${palette}.poly`
  );
}

export async function gbifOccurrenceCount(taxonKey: number): Promise<number> {
  const res = await fetchJson<{ count: number }>(`https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&limit=0`);
  return res.count;
}

export const gbifSpeciesUrl = (key: number) => `https://www.gbif.org/species/${key}`;
export const inatTaxonUrl = (id: number) => `https://www.inaturalist.org/taxa/${id}`;
