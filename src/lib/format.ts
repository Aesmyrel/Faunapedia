/** Mise en forme française des nombres, mesures et textes. */
import type { Range } from '@/data/types';

const NNBSP = ' '; // espace fine insécable
const NBSP = ' ';

export function formatNumber(n: number, maxDigits = 1): string {
  const abs = Math.abs(n);
  const digits = abs >= 100 ? 0 : abs >= 10 ? Math.min(1, maxDigits) : maxDigits;
  const factor = 10 ** digits;
  const rounded = Math.round(n * factor) / factor;
  const [int, dec] = Math.abs(rounded).toFixed(digits).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  const body = dec && Number(dec) !== 0 ? `${grouped},${dec.replace(/0+$/, '')}` : grouped;
  return rounded < 0 ? `−${body}` : body;
}

/** Nombre compact : 12 300 → « 12,3 k », 4 500 000 → « 4,5 M ». */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${formatNumber(n / 1_000_000)}${NBSP}M`;
  if (n >= 10_000) return `${formatNumber(n / 1000, 0)}${NBSP}k`;
  if (n >= 1000) return `${formatNumber(n / 1000)}${NBSP}k`;
  return formatNumber(n, 0);
}

interface Unit {
  /** Facteur depuis l’unité de base (cm pour les longueurs, kg pour les masses…). */
  factor: number;
  symbol: string;
  /** Seuil (en unité de base) à partir duquel cette unité est utilisée. */
  from: number;
}

const LENGTH_UNITS: Unit[] = [
  { factor: 10, symbol: 'mm', from: 0 },
  { factor: 1, symbol: 'cm', from: 1 },
  { factor: 0.01, symbol: 'm', from: 100 },
];

const WEIGHT_UNITS: Unit[] = [
  { factor: 1_000_000, symbol: 'mg', from: 0 },
  { factor: 1000, symbol: 'g', from: 0.001 },
  { factor: 1, symbol: 'kg', from: 1 },
  { factor: 0.001, symbol: 't', from: 1000 },
];

function pickUnit(units: Unit[], value: number): Unit {
  let unit = units[0];
  for (const u of units) if (value >= u.from) unit = u;
  return unit;
}

function formatWith(units: Unit[], range: Range | number): string {
  const [min, max] = typeof range === 'number' ? [range, range] : range;
  const unit = pickUnit(units, max);
  const a = formatNumber(min * unit.factor);
  const b = formatNumber(max * unit.factor);
  return a === b ? `${b}${NBSP}${unit.symbol}` : `${a}–${b}${NBSP}${unit.symbol}`;
}

export const formatLength = (r: Range | number) => formatWith(LENGTH_UNITS, r);
export const formatWeight = (r: Range | number) => formatWith(WEIGHT_UNITS, r);

export function formatSpeed(kmh: number): string {
  return `${formatNumber(kmh)}${NBSP}km/h`;
}

function durationParts(years: number): { value: number; unit: string; plural: string } {
  if (years >= 1) return { value: years, unit: 'an', plural: 'ans' };
  const months = years * 12;
  if (months >= 1) return { value: months, unit: 'mois', plural: 'mois' };
  const weeks = years * 52;
  if (weeks >= 1) return { value: weeks, unit: 'semaine', plural: 'semaines' };
  return { value: years * 365, unit: 'jour', plural: 'jours' };
}

export function formatLifespan(range: Range | number): string {
  const [min, max] = typeof range === 'number' ? [range, range] : range;
  const hi = durationParts(max);
  const lo = durationParts(min);
  const plural = (v: number, p: ReturnType<typeof durationParts>) => (Math.round(v) >= 2 ? p.plural : p.unit);
  if (Math.round(min * 100) === Math.round(max * 100)) {
    return `${formatNumber(hi.value, 0)}${NBSP}${plural(hi.value, hi)}`;
  }
  if (lo.unit === hi.unit) {
    return `${formatNumber(lo.value, 0)}–${formatNumber(hi.value, 0)}${NBSP}${plural(hi.value, hi)}`;
  }
  return `${formatNumber(lo.value, 0)}${NBSP}${plural(lo.value, lo)} – ${formatNumber(hi.value, 0)}${NBSP}${plural(hi.value, hi)}`;
}

/** Applique la typographie française (apostrophes courbes, espaces fines avant ; : ! ? et dans les guillemets). */
export function frTypo(text: string): string {
  return text
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿŒœ])'(?=[A-Za-zÀ-ÖØ-öø-ÿŒœ])/g, '$1’')
    .replace(/ ([;:!?»])/g, `${NNBSP}$1`)
    .replace(/« /g, `«${NNBSP}`)
    .replace(/(\d) (\d{3})\b/g, `$1${NNBSP}$2`)
    .replace(/ (km\/h|km|m|cm|mm|kg|g|t|°C|%|dB|ans|mois)\b/g, `${NBSP}$1`);
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatNumber(n, 0)} ${n >= 2 ? pluralForm : singular}`;
}

const ACCENTS: Record<string, string> = {
  à: 'a', â: 'a', ä: 'a', á: 'a', ã: 'a', å: 'a',
  ç: 'c',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  î: 'i', ï: 'i', í: 'i', ì: 'i',
  ñ: 'n',
  ô: 'o', ö: 'o', ó: 'o', ò: 'o', õ: 'o', ø: 'o',
  û: 'u', ü: 'u', ù: 'u', ú: 'u',
  ÿ: 'y', ý: 'y',
};

/** Retire les diacritiques, avec un repli si `String.normalize` est indisponible. */
function stripAccents(text: string): string {
  try {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
  } catch {
    return text.toLowerCase().replace(/[à-ÿ]/g, (c) => ACCENTS[c] ?? c);
  }
}

/** Retire accents et casse pour les comparaisons de recherche. */
export function normalize(text: string): string {
  return stripAccents(text)
    .replace(/[’'`]/g, ' ')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const LICENSE_FR: Record<string, string> = { 'public domain': 'domaine public', cc0: 'domaine public (CC0)' };

/**
 * Crédit photo ou sonore en français : « (c) Ana, some rights reserved (CC BY-NC),
 * uploaded by Ana » devient « © Ana · CC BY-NC ». La licence fournie à part est
 * ajoutée si le texte ne la mentionne pas.
 */
export function formatCredit(attribution: string, license?: string): string {
  const text = attribution.trim();
  const licenseFr = (l: string) => LICENSE_FR[l.toLowerCase()] ?? l;
  let credit = text;
  let named: string | undefined;
  const free = /^no rights reserved(?:,\s*uploaded by\s+(.+))?$/i.exec(text);
  const own = /^\(c\)\s*(.+?),\s*(?:some|all) rights reserved(?:\s*\(([^)]+)\))?(?:,\s*uploaded by\s+.+)?$/i.exec(text);
  if (free) {
    credit = free[1] ? `${free[1]} · domaine public` : 'Domaine public';
    named = 'domaine public';
  } else if (own) {
    credit = own[2] ? `© ${own[1]} · ${own[2]}` : `© ${own[1]}`;
    named = own[2];
  } else {
    credit = text.replace(/^\(c\)\s*/i, '© ');
  }
  if (!license) return credit;
  const l = licenseFr(license);
  const mentioned = [named, credit].some((x) => x?.toLowerCase().includes(l.toLowerCase()) || x?.toLowerCase().includes(license.toLowerCase()));
  return mentioned ? credit : `${credit} · ${l}`;
}

/** Majuscule initiale (les noms iNaturalist sont parfois en minuscules). */
export function capitalize(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1) : text;
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}
