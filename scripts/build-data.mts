/**
 * Enrichit les fiches rédigées à la main avec des données ouvertes :
 *  - iNaturalist : identifiant, classification complète (noms français),
 *    photos sous licence Creative Commons, statut UICN mondial, nb d’observations ;
 *  - Wikipédia (fr) : résumé introductif et identifiant Wikidata ;
 *  - GBIF : clé taxonomique (cartes de répartition) et auteur de la description ;
 *  - PhyloPic : silhouette vectorielle de l’espèce (ou d’un proche parent).
 *
 * Usage : npm run data:build  (les réponses sont mises en cache dans .cache/)
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { CuratedSpecies, IucnStatus, Photo, Silhouette, TaxonNode } from '../src/data/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, '.cache', 'data');
const OUT_FILE = join(ROOT, 'src', 'data', 'generated', 'enrichment.json');
const UA = 'FaunapediaBuild/1.0 (https://github.com/Aesmyrel/Faunapedia ; projet passion non commercial)';

const CURATED_FILES = ['mammals', 'birds', 'reptiles', 'amphibians', 'fishes', 'insects', 'invertebrates'];
const MAX_PHOTOS = 8;
const SUMMARY_MAX = 900;

export interface Enrichment {
  inatId?: number;
  gbifKey?: number;
  wikidata?: string;
  wikiTitle?: string;
  authority?: string;
  summary?: string;
  photos: Photo[];
  taxonomy: TaxonNode[];
  silhouette?: Silhouette;
  observations?: number;
  status?: IucnStatus;
  statusSource?: 'iucn' | 'curated';
}

// ───────────────────────────── HTTP & cache ─────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lastCall = new Map<string, number>();

/** Espace les appels par hôte pour respecter les limites des API. */
async function throttle(host: string, gapMs: number) {
  const prev = lastCall.get(host) ?? 0;
  const wait = prev + gapMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall.set(host, Date.now());
}

const GAPS: Record<string, number> = {
  'api.inaturalist.org': 1100,
  'fr.wikipedia.org': 400,
  'api.gbif.org': 150,
  'api.phylopic.org': 250,
};

async function getJson<T>(url: string, { allow404 = false } = {}): Promise<T | null> {
  const key = createHash('sha1').update(url).digest('hex');
  const file = join(CACHE_DIR, `${key}.json`);
  try {
    return JSON.parse(await readFile(file, 'utf8')) as T;
  } catch {
    // pas en cache
  }
  const host = new URL(url).host;
  for (let attempt = 0; attempt < 5; attempt++) {
    await throttle(host, GAPS[host] ?? 300);
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (res.status === 404 && allow404) {
      await writeFile(file, 'null');
      return null;
    }
    if (res.status === 429 || res.status >= 500) {
      const backoff = 2000 * 2 ** attempt;
      console.warn(`  ↻ ${res.status} sur ${host}, nouvel essai dans ${backoff / 1000}s`);
      await sleep(backoff);
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    const json = (await res.json()) as T;
    await writeFile(file, JSON.stringify(json));
    return json;
  }
  throw new Error(`Échec après plusieurs essais : ${url}`);
}

// ───────────────────────────── iNaturalist ─────────────────────────────

interface INatPhoto {
  id: number;
  license_code: string | null;
  attribution: string;
  url: string;
  medium_url?: string;
  original_dimensions?: { width: number; height: number };
}

interface INatTaxon {
  id: number;
  name: string;
  rank: string;
  matched_term?: string;
  preferred_common_name?: string;
  observations_count?: number;
  ancestors?: INatTaxon[];
  taxon_photos?: { photo: INatPhoto }[];
  default_photo?: INatPhoto;
  conservation_status?: { status?: string; iucn?: number; authority?: string; place?: unknown } | null;
}

const IUCN_CODES: IucnStatus[] = ['EX', 'EW', 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'];
const IUCN_BY_NUMBER: Record<number, IucnStatus> = {
  0: 'NE',
  5: 'DD',
  10: 'LC',
  20: 'NT',
  30: 'VU',
  40: 'EN',
  50: 'CR',
  60: 'EW',
  70: 'EX',
};

async function findINatTaxon(sci: string): Promise<INatTaxon | undefined> {
  const lower = sci.toLowerCase();
  // Le second passage (rang espèce) rattrape les tautonymes comme « Lynx lynx ».
  for (const extra of ['&per_page=20', '&per_page=30&rank=species']) {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(sci)}&is_active=true${extra}`;
    const res = await getJson<{ results: INatTaxon[] }>(url);
    const results = res?.results ?? [];
    const found =
      results.find((t) => t.name.toLowerCase() === lower) ??
      results.find((t) => t.matched_term?.toLowerCase() === lower && t.rank === 'species');
    if (found) return found;
  }
  return undefined;
}

async function fetchINatDetails(ids: number[]): Promise<Map<number, INatTaxon>> {
  const out = new Map<number, INatTaxon>();
  for (let i = 0; i < ids.length; i += 25) {
    const chunk = ids.slice(i, i + 25);
    const res = await getJson<{ results: INatTaxon[] }>(
      `https://api.inaturalist.org/v1/taxa/${chunk.join(',')}?locale=fr`,
    );
    for (const t of res?.results ?? []) out.set(t.id, t);
  }
  return out;
}

async function observationPhotos(taxonId: number): Promise<INatPhoto[]> {
  const res = await getJson<{ results: { photos: INatPhoto[] }[] }>(
    `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&photos=true&quality_grade=research` +
      '&photo_license=cc0,cc-by,cc-by-sa,cc-by-nc,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd&order_by=votes&per_page=10',
  );
  return (res?.results ?? []).flatMap((o) => o.photos.slice(0, 1));
}

function photoFrom(p: INatPhoto): Photo | null {
  if (!p.license_code) return null; // « tous droits réservés » : exclu
  const base = (p.medium_url ?? p.url).replace(/\/(square|small|thumb|large|original)\./, '/medium.');
  return {
    url: base,
    w: p.original_dimensions?.width,
    h: p.original_dimensions?.height,
    attribution: p.attribution,
    license: p.license_code.toUpperCase().replace(/^CC-/, 'CC '),
  };
}

function iucnFrom(t: INatTaxon): IucnStatus | undefined {
  const cs = t.conservation_status;
  if (!cs || cs.place || !/iucn/i.test(cs.authority ?? '')) return undefined;
  const code = cs.status?.toUpperCase() as IucnStatus | undefined;
  if (code && IUCN_CODES.includes(code)) return code;
  return cs.iucn !== undefined ? IUCN_BY_NUMBER[cs.iucn] : undefined;
}

// ───────────────────────────── Wikipédia ─────────────────────────────

interface WikiPage {
  title: string;
  missing?: string;
  extract?: string;
  pageprops?: { wikibase_item?: string; disambiguation?: string };
}

interface WikiQuery {
  query?: {
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
    pages?: Record<string, WikiPage>;
  };
}

/** Résout un lot de titres (≤ 20) vers leur page finale. */
async function fetchWikiPages(titles: string[]): Promise<Map<string, WikiPage>> {
  const url =
    'https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1' +
    '&prop=extracts|pageprops&exintro=1&explaintext=1&exlimit=20&ppprop=wikibase_item|disambiguation' +
    `&titles=${encodeURIComponent(titles.join('|'))}`;
  const res = await getJson<WikiQuery>(url);
  const q = res?.query ?? {};
  const resolve = (title: string) => {
    let t = title;
    for (const n of q.normalized ?? []) if (n.from === t) t = n.to;
    for (const r of q.redirects ?? []) if (r.from === t) t = r.to;
    return t;
  };
  const byTitle = new Map<string, WikiPage>();
  for (const p of Object.values(q.pages ?? {})) byTitle.set(p.title, p);
  const out = new Map<string, WikiPage>();
  for (const title of titles) {
    const page = byTitle.get(resolve(title));
    if (page && page.missing === undefined && !page.pageprops?.disambiguation) out.set(title, page);
  }
  return out;
}

interface CommonsInfo {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: {
          thumburl?: string;
          thumbwidth?: number;
          thumbheight?: number;
          extmetadata?: Record<string, { value?: string }>;
        }[];
      }
    >;
  };
}

/** Photo de l’article Wikipédia (Wikimedia Commons), si sa licence est libre : dernier recours sans photo iNaturalist. */
async function wikiPhoto(title: string): Promise<Photo | undefined> {
  const page = await getJson<{ query?: { pages?: Record<string, { pageimage?: string }> } }>(
    `https://fr.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`,
  );
  const file = Object.values(page?.query?.pages ?? {})[0]?.pageimage;
  if (!file) return undefined;
  const info = await getJson<CommonsInfo>(
    `https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200&titles=${encodeURIComponent(`Fichier:${file}`)}`,
  );
  const img = Object.values(info?.query?.pages ?? {})[0]?.imageinfo?.[0];
  const meta = img?.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? '';
  if (!img?.thumburl || !/^(CC|Public domain|Domaine public)/i.test(license)) return undefined;
  const artist = (meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    url: img.thumburl.split('?')[0],
    w: img.thumbwidth,
    h: img.thumbheight,
    attribution: artist ? `© ${artist} (Wikimedia Commons)` : 'Wikimedia Commons',
    license,
  };
}

function cleanSummary(text: string | undefined): string | undefined {
  if (!text) return undefined;
  let s = text
    .replace(/\s*\\[^\\\n]{1,60}\\/g, '') // prononciation API : \ak.sɔ.lɔtl\
    .replace(/\(\s*[;,]?\s*\)/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .trim();
  const paragraphs = s.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  s = '';
  for (const p of paragraphs) {
    if (s && s.length + p.length > SUMMARY_MAX) break;
    s = s ? `${s}\n\n${p}` : p;
  }
  if (s.length > SUMMARY_MAX) {
    const cut = s.slice(0, SUMMARY_MAX);
    const end = cut.lastIndexOf('. ');
    s = end > 200 ? cut.slice(0, end + 1) : `${cut.trimEnd()}…`;
  }
  return s || undefined;
}

// ───────────────────────────── GBIF ─────────────────────────────

interface GbifMatch {
  usageKey?: number;
  acceptedUsageKey?: number;
  scientificName?: string;
  canonicalName?: string;
  status?: string;
  matchType?: string;
  rank?: string;
  genusKey?: number;
  familyKey?: number;
  orderKey?: number;
}

async function gbifMatch(sci: string): Promise<GbifMatch | null> {
  return getJson<GbifMatch>(
    `https://api.gbif.org/v1/species/match?kingdom=Animalia&name=${encodeURIComponent(sci)}`,
  );
}

function authorityFrom(m: GbifMatch | null): string | undefined {
  if (!m?.scientificName || !m.canonicalName) return undefined;
  const rest = m.scientificName.slice(m.canonicalName.length).trim();
  return rest || undefined;
}

// ───────────────────────────── PhyloPic ─────────────────────────────

interface PhyloImage {
  _links: {
    rasterFiles?: { href: string; sizes: string }[];
    specificNode?: { title: string };
    license?: { href: string };
    contributor?: { title: string };
  };
}

interface PhyloNode {
  _links?: { cladeImages?: { href: string } };
  _embedded?: { primaryImage?: PhyloImage };
}

let phyloBuild: number | undefined;

const mid = (r?: readonly [number, number]) => (r ? (r[0] + r[1]) / 2 : 0);

/** Espèces dont la silhouette la plus allongée est trompeuse (une tête seule) : on garde la principale. */
const KEEP_PRIMARY_SILHOUETTE = new Set(['crocodile-du-nil']);

/**
 * Note d’une silhouette pour la comparaison d’échelle (plus basse = meilleure).
 * Oiseaux : perchés ou debout plutôt qu’en vol. Mammifères : de profil, aux
 * proportions longueur / hauteur de l’espèce. Reptiles et poissons : de profil
 * (la vue la plus allongée) plutôt que vus de dessus. Amphibiens : la silhouette
 * principale, la plus allongée étant souvent un têtard.
 */
function poseScore(ratio: number, s: CuratedSpecies): number | null {
  const log = (x: number) => Math.abs(Math.log(x));
  if (KEEP_PRIMARY_SILHOUETTE.has(s.id)) return null;
  if (s.group === 'birds') return log(ratio / 0.75);
  if (s.group === 'mammals') {
    const len = mid(s.stats.length);
    const tall = mid(s.stats.height);
    if (len && tall) return log(ratio / Math.min(4, Math.max(0.8, len / tall)));
    // Sans hauteur, la vue la plus allongée est le profil ; sans longueur (girafe), on garde la silhouette principale.
    return len ? -Math.min(ratio, 4) : null;
  }
  if (s.group === 'reptiles' || s.group === 'fishes') return -ratio;
  return null;
}

function rasterOf(img: PhyloImage) {
  const rasters = img._links.rasterFiles ?? [];
  const raster = rasters.find((r) => r.sizes.startsWith('512x')) ?? rasters[rasters.length - 1];
  if (!raster) return undefined;
  const [w, h] = raster.sizes.split('x').map(Number);
  return { href: raster.href, ratio: w / h };
}

async function phylopic(s: CuratedSpecies, keys: (number | undefined)[]): Promise<Silhouette | undefined> {
  if (phyloBuild === undefined) {
    const root = await getJson<{ build: number }>('https://api.phylopic.org/');
    phyloBuild = root?.build ?? 0;
  }
  const ids = keys.filter((k): k is number => typeof k === 'number');
  if (!ids.length) return undefined;
  const res = await getJson<PhyloNode>(
    `https://api.phylopic.org/resolve/gbif.org/species?build=${phyloBuild}&embed_primaryImage=true&objectIDs=${ids.join(',')}`,
    { allow404: true },
  );
  const primary = res?._embedded?.primaryImage;
  if (!primary) return undefined;
  const isExact = (img: PhyloImage) => (img._links.specificNode?.title ?? '').toLowerCase().startsWith(s.sci.toLowerCase());

  // Toutes les silhouettes de l’espèce, pour choisir la pose la plus parlante.
  let img = primary;
  const clade = res?._links?.cladeImages?.href;
  if (isExact(primary) && clade) {
    const list = await getJson<{ _embedded?: { items?: PhyloImage[] } }>(`https://api.phylopic.org${clade}&embed_items=true&page=0`);
    const candidates = (list?._embedded?.items ?? []).filter((c) => isExact(c) && rasterOf(c));
    let best = poseScore(rasterOf(primary)?.ratio ?? 1, s);
    for (const c of candidates) {
      const score = poseScore(rasterOf(c)!.ratio, s);
      // La silhouette principale garde l’avantage à quasi-égalité.
      if (score !== null && best !== null && score < best - 0.1) {
        best = score;
        img = c;
      }
    }
  }

  const raster = rasterOf(img);
  if (!raster) return undefined;
  return {
    url: raster.href,
    ratio: Math.round(raster.ratio * 1000) / 1000,
    attribution: img._links.contributor?.title,
    license: licenseName(img._links.license?.href),
    exact: isExact(img),
  };
}

function licenseName(href?: string): string | undefined {
  if (!href) return undefined;
  if (href.includes('publicdomain/zero')) return 'CC0';
  if (href.includes('publicdomain/mark')) return 'Domaine public';
  const m = href.match(/licenses\/([a-z-]+)\/([\d.]+)/);
  return m ? `CC ${m[1].toUpperCase()} ${m[2]}` : href;
}

// ───────────────────────────── Programme principal ─────────────────────────────

const MAIN_RANKS = new Set([
  'kingdom',
  'phylum',
  'subphylum',
  'class',
  'subclass',
  'infraclass',
  'superorder',
  'order',
  'suborder',
  'infraorder',
  'superfamily',
  'family',
  'subfamily',
  'tribe',
  'genus',
  'species',
]);

async function loadCurated(): Promise<CuratedSpecies[]> {
  const all: CuratedSpecies[] = [];
  for (const f of CURATED_FILES) {
    const mod = (await import(join(ROOT, 'src', 'data', 'curated', `${f}.ts`))) as Record<string, unknown>;
    for (const v of Object.values(mod)) if (Array.isArray(v)) all.push(...(v as CuratedSpecies[]));
  }
  return all;
}

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  await mkdir(dirname(OUT_FILE), { recursive: true });
  const species = await loadCurated();
  const only = process.argv.slice(2);
  const targets = only.length ? species.filter((s) => only.includes(s.id)) : species;
  console.log(`🦁  ${targets.length} espèces à enrichir`);

  let previous: Record<string, Enrichment> = {};
  try {
    previous = JSON.parse(await readFile(OUT_FILE, 'utf8'));
  } catch {
    // premier passage
  }

  // 1. iNaturalist : recherche puis détails par lots
  console.log('→ iNaturalist (recherche)');
  const inatIds = new Map<string, number>();
  for (const s of targets) {
    const t = await findINatTaxon(s.sci);
    if (t) inatIds.set(s.id, t.id);
    else console.warn(`  ⚠ introuvable sur iNaturalist : ${s.sci} (${s.id})`);
  }
  console.log('→ iNaturalist (détails)');
  const details = await fetchINatDetails([...new Set(inatIds.values())]);

  // 2. Wikipédia : par nom scientifique, puis par nom français
  console.log('→ Wikipédia');
  const wiki = new Map<string, WikiPage>();
  const lookup = async (pairs: [string, string][]) => {
    for (let i = 0; i < pairs.length; i += 20) {
      const chunk = pairs.slice(i, i + 20);
      const pages = await fetchWikiPages(chunk.map(([, title]) => title));
      for (const [id, title] of chunk) {
        const page = pages.get(title);
        if (page) wiki.set(id, page);
      }
    }
  };
  await lookup(targets.map((s) => [s.id, s.wiki ?? s.sci]));
  await lookup(targets.filter((s) => !wiki.has(s.id)).map((s) => [s.id, s.name]));

  // 3. GBIF + PhyloPic
  console.log('→ GBIF & PhyloPic');
  const out: Record<string, Enrichment> = { ...previous };
  for (const s of targets) {
    const t = details.get(inatIds.get(s.id) ?? -1);
    const g = await gbifMatch(s.sci);
    const gbifKey = g?.matchType && g.matchType !== 'NONE' ? (g.acceptedUsageKey ?? g.usageKey) : undefined;
    const silhouette = gbifKey ? await phylopic(s, [gbifKey, g?.genusKey, g?.familyKey, g?.orderKey]) : undefined;
    const page = wiki.get(s.id);

    const photos: Photo[] = [];
    const seen = new Set<number>();
    for (const tp of [...(t?.default_photo ? [{ photo: t.default_photo }] : []), ...(t?.taxon_photos ?? [])]) {
      if (seen.has(tp.photo.id)) continue;
      seen.add(tp.photo.id);
      const p = photoFrom(tp.photo);
      if (p) photos.push(p);
      if (photos.length >= MAX_PHOTOS) break;
    }
    // Trop peu de photos libres sur la fiche iNaturalist : on puise dans les observations.
    if (t && photos.length < 4) {
      for (const p of await observationPhotos(t.id)) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        const photo = photoFrom(p);
        if (photo) photos.push(photo);
        if (photos.length >= MAX_PHOTOS) break;
      }
    }

    if (!photos.length && page?.title) {
      const fallback = await wikiPhoto(page.title);
      if (fallback) photos.push(fallback);
    }

    const taxonomy: TaxonNode[] = [...(t?.ancestors ?? []), ...(t ? [t] : [])]
      .filter((a) => MAIN_RANKS.has(a.rank))
      .map((a) => ({ id: a.id, rank: a.rank, name: a.name, fr: a.preferred_common_name || undefined }));

    const iucn = t ? iucnFrom(t) : undefined;
    out[s.id] = {
      inatId: t?.id,
      gbifKey,
      wikidata: page?.pageprops?.wikibase_item,
      wikiTitle: page?.title,
      authority: authorityFrom(g),
      summary: cleanSummary(page?.extract),
      photos,
      taxonomy,
      silhouette,
      observations: t?.observations_count,
      // Seul le statut officiel est stocké : le statut rédigé reste dans la fiche.
      status: iucn,
      statusSource: iucn ? 'iucn' : 'curated',
    };
    if (iucn && iucn !== s.status) console.log(`  ℹ statut ${s.id} : ${s.status} → ${iucn} (UICN)`);
  }

  // Ne garde que les espèces encore présentes, dans l’ordre des fiches.
  const ordered: Record<string, Enrichment> = {};
  for (const s of species) if (out[s.id]) ordered[s.id] = out[s.id];
  // Une fiche par ligne : compact pour l’application, lisible dans les diffs.
  const lines = Object.entries(ordered).map(([id, e]) => `  ${JSON.stringify(id)}: ${JSON.stringify(e)}`);
  await writeFile(OUT_FILE, `{\n${lines.join(',\n')}\n}\n`);

  const missing = (pred: (e: Enrichment) => boolean) =>
    species.filter((s) => ordered[s.id] && pred(ordered[s.id])).map((s) => s.id);
  console.log(`✓ ${Object.keys(ordered).length} fiches écrites dans ${OUT_FILE}`);
  console.log(`  sans photo : ${missing((e) => !e.photos.length).join(', ') || '—'}`);
  console.log(`  sans Wikipédia : ${missing((e) => !e.summary).join(', ') || '—'}`);
  console.log(`  sans silhouette : ${missing((e) => !e.silhouette).length}`);
  console.log(`  sans clé GBIF : ${missing((e) => !e.gbifKey).join(', ') || '—'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
