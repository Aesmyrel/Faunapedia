/**
 * Moteur de quiz : génère des questions variées à partir des fiches.
 *
 * Tout est déterministe pour une graine donnée (le « Défi du jour » est le
 * même pour tout le monde). La difficulté joue surtout sur le choix des
 * leurres : faciles = groupes différents, expert = proches parents.
 */
import { kinship, taxonAt } from '@/data';
import { ACTIVITIES, DIETS, GROUPS, HABITATS, IUCN, REGIONS } from '@/data/reference';
import type { Diet, GroupId, IucnStatus, Range, Region, Species } from '@/data/types';

import { capitalize, formatLength, formatLifespan, formatSpeed, formatWeight, normalize } from './format';
import { createRng, pick, randInt, type Rng, sample, shuffle, weightedPick } from './random';

export type Difficulty = 1 | 2 | 3;

export type QuizMode =
  | 'daily'
  | 'quick'
  | 'whoami'
  | 'duel'
  | 'survival'
  | 'timed'
  | 'expert'
  | 'silhouettes'
  | 'sounds'
  | 'review'
  | 'species'
  | 'challenge';

export type QuestionKind =
  | 'photo-to-name'
  | 'name-to-photo'
  | 'silhouette'
  | 'sci-name'
  | 'from-sci'
  | 'order'
  | 'family'
  | 'class'
  | 'status'
  | 'compare'
  | 'true-false'
  | 'record'
  | 'fact'
  | 'lore'
  | 'region'
  | 'diet'
  | 'sound'
  | 'clues';

export interface Choice {
  id: string;
  label: string;
  sublabel?: string;
  speciesId?: string;
  italic?: boolean;
  color?: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  category: string;
  prompt: string;
  /** Terme mis en valeur sous la question (nom d’espèce, citation…). */
  subject?: { text: string; italic?: boolean; quote?: boolean };
  media?: { type: 'photo' | 'silhouette' | 'sound'; speciesId: string; photoIndex?: number };
  layout: 'list' | 'grid' | 'duel' | 'binary';
  choices: Choice[];
  answerId: string;
  explanation: string;
  /** Espèces à (re)découvrir après la réponse. */
  learnIds: string[];
  difficulty: Difficulty;
  clues?: string[];
}

// ───────────────────────────── Modes de jeu ─────────────────────────────

export interface ModeInfo {
  id: QuizMode;
  title: string;
  tagline: string;
  description: string;
  icon: { set: 'mci' | 'fa6'; name: string };
  color: string;
  /** Nombre de questions (null = sans fin). */
  length: number | null;
  lives?: number;
  timeLimitSec?: number;
  online?: boolean;
}

export const MODES: Record<QuizMode, ModeInfo> = {
  daily: {
    id: 'daily',
    title: 'Défi du jour',
    tagline: '10 questions, les mêmes pour tous',
    description: 'Un nouveau défi chaque jour. Revenez quotidiennement pour entretenir votre série !',
    icon: { set: 'mci', name: 'calendar-star' },
    color: '#E8B04B',
    length: 10,
  },
  quick: {
    id: 'quick',
    title: 'Partie rapide',
    tagline: '10 questions variées',
    description: 'Identification, records, classification, statuts… un mélange de tout ce que Faunapedia sait.',
    icon: { set: 'mci', name: 'lightning-bolt' },
    color: '#38BDF8',
    length: 10,
  },
  whoami: {
    id: 'whoami',
    title: 'Qui suis-je ?',
    tagline: 'Indices progressifs',
    description: 'Les indices se dévoilent un à un et la photo se précise. Moins vous en utilisez, plus vous marquez de points.',
    icon: { set: 'mci', name: 'incognito' },
    color: '#C084FC',
    length: 8,
  },
  duel: {
    id: 'duel',
    title: 'Plus ou moins',
    tagline: 'Jusqu’à la première erreur',
    description: 'Plus lourd ? Plus rapide ? Plus vieux ? Enchaînez les duels sans vous tromper. Les écarts se resserrent…',
    icon: { set: 'mci', name: 'scale-balance' },
    color: '#F97316',
    length: null,
    lives: 1,
  },
  survival: {
    id: 'survival',
    title: 'Survie',
    tagline: '3 vies, difficulté croissante',
    description: 'Les questions deviennent de plus en plus pointues. Combien de temps tiendrez-vous ?',
    icon: { set: 'mci', name: 'heart-pulse' },
    color: '#EF4444',
    length: null,
    lives: 3,
  },
  timed: {
    id: 'timed',
    title: 'Contre-la-montre',
    tagline: '60 secondes chrono',
    description: 'Un maximum de bonnes réponses en une minute. Les erreurs coûtent 3 secondes.',
    icon: { set: 'mci', name: 'timer-outline' },
    color: '#22C55E',
    length: null,
    timeLimitSec: 60,
  },
  expert: {
    id: 'expert',
    title: 'Expert',
    tagline: 'Noms latins et classification',
    description: 'Pour les vrais passionnés : noms scientifiques, ordres, familles et statuts UICN, avec des leurres très proches.',
    icon: { set: 'mci', name: 'school' },
    color: '#A78BFA',
    length: 10,
  },
  silhouettes: {
    id: 'silhouettes',
    title: 'Silhouettes',
    tagline: 'Ombres chinoises',
    description: 'Reconnaître un animal à sa seule silhouette, comme un naturaliste de terrain au crépuscule.',
    icon: { set: 'mci', name: 'shape' },
    color: '#2DD4BF',
    length: 10,
  },
  sounds: {
    id: 'sounds',
    title: 'Chants & cris',
    tagline: 'Enregistrements de terrain',
    description: 'Des enregistrements réels issus d’iNaturalist : chants d’oiseaux, coassements, rugissements…',
    icon: { set: 'mci', name: 'waveform' },
    color: '#F472B6',
    length: 10,
    online: true,
  },
  review: {
    id: 'review',
    title: 'Révision',
    tagline: 'Vos erreurs passées',
    description: 'Les espèces sur lesquelles vous avez trébuché reviennent à intervalles croissants, jusqu’à être maîtrisées.',
    icon: { set: 'mci', name: 'refresh' },
    color: '#FACC15',
    length: 10,
  },
  challenge: {
    id: 'challenge',
    title: 'Défi entre amis',
    tagline: '10 questions, les mêmes pour vous deux',
    description: 'Jouez, envoyez votre code à un collègue ou un ami : il répond exactement aux mêmes questions, et vous comparez vos scores.',
    icon: { set: 'mci', name: 'sword-cross' },
    color: '#FB7185',
    length: 10,
  },
  species: {
    id: 'species',
    title: 'Me tester',
    tagline: '5 questions sur une espèce',
    description: 'Vérifiez ce que vous avez retenu de cette fiche.',
    icon: { set: 'mci', name: 'target' },
    color: '#E8B04B',
    length: 5,
  },
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { 1: 'Découverte', 2: 'Naturaliste', 3: 'Expert' };

// ───────────────────────────── Outils ─────────────────────────────

const STOP_WORDS = new Set([
  'des', 'les', 'commun', 'commune', 'grand', 'grande', 'petit', 'petite', 'geant', 'geante', 'europe', 'afrique',
  'amerique', 'nord', 'sud', 'ouest', 'est', 'mer', 'eau', 'douce', 'blanc', 'blanche', 'noir', 'noire', 'rouge',
  'bleu', 'bleue', 'vert', 'verte', 'gris', 'grise', 'royal', 'japon', 'chine', 'asie',
]);

/** Lettres latines, accentuées comprises (sans `\p{L}`, pour rester compatible avec tous les moteurs JS). */
const LETTERS = 'A-Za-zÀ-ÖØ-öø-ÿŒœ';

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Masque le nom de l’espèce (et ses variantes) dans un texte d’indice. */
export function maskName(text: string, s: Species): string {
  const genus = s.sci.split(' ')[0];
  const names = [s.name, ...(s.aka ?? []), s.sci, genus];
  const words = [s.name, ...(s.aka ?? [])]
    .flatMap((n) => n.split(/[\s’'-]+/))
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(normalize(w)));
  let out = text;
  for (const n of [...names].sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`\\b${escapeRe(n)}s?\\b`, 'gi'), '…');
  }
  for (const w of words) {
    out = out.replace(new RegExp(`(^|[^${LETTERS}])${escapeRe(w)}(s|x)?(?=$|[^${LETTERS}])`, 'gi'), '$1…');
  }
  return out;
}

const isMasked = (original: string, masked: string) => masked !== original;

/** Adjectifs trop courants pour trahir une espèce (contrairement aux noms de lieux). */
const GENERIC_WORDS = new Set(['grand', 'grande', 'petit', 'petite', 'commun', 'commune', 'geant', 'geante', 'blanc', 'blanche', 'rouge', 'royal']);

/**
 * Débuts de mots du nom qui, retrouvés dans un texte masqué, trahiraient la
 * réponse : dérivés (« lionne », « galápago ») ou lieux (« Japon »).
 */
export function nameStems(s: Species): string[] {
  return normalize(s.name)
    .split(' ')
    .filter((w, i) => (i === 0 ? w.length >= 4 : w.length >= 5 && !GENERIC_WORDS.has(w)))
    .map((w) => w.slice(0, 5));
}

/** Noms dont le premier mot est féminin (« la panthère des neiges », « l’hyène »…). */
const FEMININE_HEADS = new Set([
  'abeille', 'anemone', 'anguille', 'araignee', 'argyronete', 'autruche', 'bagheera', 'baleine', 'barge', 'baudroie',
  'brachine', 'cecilie', 'chauve', 'cigale', 'cigogne', 'coccinelle', 'corbeille', 'crevette', 'effraie', 'elysie',
  'epeire', 'etoile', 'fourmi', 'girafe', 'grenouille', 'grue', 'guepe', 'harpie', 'huppe', 'hydre', 'hyene', 'lamproie',
  'limule', 'loutre', 'mante', 'meduse', 'mesange', 'mygale', 'orque', 'paedophryne', 'panthere', 'phyllie', 'physalie',
  'pie', 'pieuvre', 'rainette', 'raie', 'rascasse', 'salamandre', 'sangsue', 'scolopendre', 'seiche', 'sterne', 'tique',
  'tortue', 'vanesse', 'veuve', 'vipere',
]);

/** Mots commençant par un h aspiré : pas d’élision (« le hérisson »). */
const ASPIRATED_H = new Set(['harfang', 'harpie', 'herisson', 'homard', 'huppe', 'hibou']);

const headWord = (s: Species) => normalize(s.name).split(' ')[0];

/** Genre grammatical du nom français (« elle » pour l’hyène, « il » pour l’aigle). */
export function gender(s: Species): 'f' | 'm' {
  return FEMININE_HEADS.has(headWord(s)) ? 'f' : 'm';
}

export function article(s: Species): 'le' | 'la' | 'l’' {
  const head = headWord(s);
  if (/^[aeiouy]/.test(head) || (head.startsWith('h') && !ASPIRATED_H.has(head))) return 'l’';
  return gender(s) === 'f' ? 'la' : 'le';
}

/** Leurres du même genre : dans un texte masqué, « Elle » ou « décrite » ne doit pas trahir la réponse. */
const sameGender = (s: Species) => (o: Species) => gender(o) === gender(s);

/** « le Lion », « l’Axolotl », « la Salamandre tachetée ». */
export function withArticle(s: Species, capital = false): string {
  const a = article(s);
  const out = a === 'l’' ? `l’${s.name}` : `${a} ${s.name}`;
  return capital ? capitalize(out) : out;
}

/** « du Lion », « de l’Axolotl », « de la Salamandre ». */
export function ofSpecies(s: Species): string {
  const a = article(s);
  if (a === 'le') return `du ${s.name}`;
  return a === 'la' ? `de la ${s.name}` : `de l’${s.name}`;
}

function choiceFor(s: Species): Choice {
  return { id: s.id, label: s.name, sublabel: s.sci, speciesId: s.id };
}

/** Choisit `n` leurres selon la difficulté (proches parents en mode expert). */
export function pickDistractors(
  rng: Rng,
  target: Species,
  pool: Species[],
  n: number,
  difficulty: Difficulty,
  accept: (s: Species) => boolean = () => true,
): Species[] {
  const out: Species[] = [];
  const labels = new Set([normalize(target.name)]);
  const candidates = pool.filter((s) => s.id !== target.id && accept(s));
  const weight = (s: Species) => {
    const k = kinship(target, s);
    if (difficulty === 3) return 1 + k ** 3;
    if (difficulty === 2) return s.group === target.group ? 6 + k : 1;
    return s.group === target.group ? 1 : 3;
  };
  let guard = 0;
  while (out.length < n && guard++ < 200 && candidates.length) {
    const s = weightedPick(rng, candidates, weight);
    const label = normalize(s.name);
    if (!labels.has(label)) {
      labels.add(label);
      out.push(s);
    }
    candidates.splice(candidates.indexOf(s), 1);
  }
  return out;
}

/** Phrase d’« en savoir plus » affichée après une réponse. */
function funLine(s: Species, avoid?: string): string {
  if (s.record && s.record !== avoid) return `Record : ${s.record.charAt(0).toLowerCase()}${s.record.slice(1)}.`;
  return s.facts.find((f) => f !== avoid) ?? s.facts[0];
}

function photoIndex(rng: Rng, s: Species): number {
  return randInt(rng, Math.min(4, Math.max(1, s.photos.length)));
}

const hasPhoto = (s: Species) => s.photos.length > 0;

// ───────────────────────────── Générateurs ─────────────────────────────

type Generator = (ctx: GenContext, s: Species) => Question | null;

interface GenContext {
  rng: Rng;
  pool: Species[];
  difficulty: Difficulty;
  uid: () => string;
}

const genPhotoToName: Generator = ({ rng, pool, difficulty, uid }, s) => {
  if (!hasPhoto(s)) return null;
  const choices = shuffle(rng, [s, ...pickDistractors(rng, s, pool, 3, difficulty)]).map(choiceFor);
  return {
    id: uid(),
    kind: 'photo-to-name',
    category: 'Identification',
    prompt: 'Quelle est cette espèce ?',
    media: { type: 'photo', speciesId: s.id, photoIndex: photoIndex(rng, s) },
    layout: 'list',
    choices,
    answerId: s.id,
    explanation: funLine(s),
    learnIds: [s.id],
    difficulty,
  };
};

const genNameToPhoto: Generator = ({ rng, pool, difficulty, uid }, s) => {
  if (!hasPhoto(s)) return null;
  const others = pickDistractors(rng, s, pool, 3, difficulty, hasPhoto);
  if (others.length < 3) return null;
  return {
    id: uid(),
    kind: 'name-to-photo',
    category: 'Identification',
    prompt: `Où se cache ${withArticle(s)} ?`,
    layout: 'grid',
    choices: shuffle(rng, [s, ...others]).map(choiceFor),
    answerId: s.id,
    explanation: s.facts[0],
    learnIds: [s.id, ...others.map((o) => o.id)],
    difficulty,
  };
};

const genSilhouette: Generator = ({ rng, pool, difficulty, uid }, s) => {
  if (!s.silhouette?.exact) return null;
  const others = pickDistractors(rng, s, pool, 3, difficulty);
  return {
    id: uid(),
    kind: 'silhouette',
    category: 'Silhouette',
    prompt: 'À qui appartient cette silhouette ?',
    media: { type: 'silhouette', speciesId: s.id },
    layout: 'list',
    choices: shuffle(rng, [s, ...others]).map(choiceFor),
    answerId: s.id,
    explanation: funLine(s),
    learnIds: [s.id],
    difficulty,
  };
};

const genSciName: Generator = ({ rng, pool, uid }, s) => {
  const others = pickDistractors(rng, s, pool, 3, 3);
  return {
    id: uid(),
    kind: 'sci-name',
    category: 'Nom scientifique',
    prompt: 'Quel est le nom scientifique de…',
    subject: { text: s.name },
    layout: 'list',
    choices: shuffle(rng, [s, ...others]).map((o) => ({ id: o.id, label: o.sci, italic: true, speciesId: o.id })),
    answerId: s.id,
    explanation: s.etymology ?? `Le nom scientifique ${ofSpecies(s)} est ${s.sci}${s.authority ? ` ${s.authority}` : ''}.`,
    learnIds: [s.id],
    difficulty: 3,
  };
};

const genFromSci: Generator = ({ rng, pool, difficulty, uid }, s) => {
  const others = pickDistractors(rng, s, pool, 3, Math.max(2, difficulty) as Difficulty);
  return {
    id: uid(),
    kind: 'from-sci',
    category: 'Nom scientifique',
    prompt: 'Quel animal se cache derrière ce nom latin ?',
    subject: { text: s.sci, italic: true },
    layout: 'list',
    choices: shuffle(rng, [s, ...others]).map((o) => ({ id: o.id, label: o.name, speciesId: o.id })),
    answerId: s.id,
    explanation: s.etymology ?? `${s.sci} est le nom scientifique ${ofSpecies(s)}.`,
    learnIds: [s.id],
    difficulty: Math.max(2, difficulty) as Difficulty,
  };
};

function rankLabel(t: { name: string; fr?: string }): Choice {
  return { id: t.name, label: t.fr ? capitalize(t.fr) : t.name, sublabel: t.fr ? t.name : undefined };
}

function genRank(rank: 'order' | 'family' | 'class', category: string, prompt: string): Generator {
  return ({ rng, pool, difficulty, uid }, s) => {
    const own = taxonAt(s, rank);
    if (!own) return null;
    const parentRank = rank === 'family' ? 'order' : rank === 'order' ? 'class' : 'phylum';
    const parent = taxonAt(s, parentRank);
    const seen = new Set([own.name]);
    const candidates = shuffle(rng, pool)
      .map((o) => ({ o, t: taxonAt(o, rank) }))
      .filter(({ o, t }) => t && !seen.has(t.name) && (difficulty < 3 || !parent || taxonAt(o, parentRank)?.id === parent.id));
    const options: Choice[] = [];
    for (const { t } of candidates) {
      if (!t || seen.has(t.name)) continue;
      seen.add(t.name);
      options.push(rankLabel(t));
      if (options.length === 3) break;
    }
    if (options.length < 3) return null;
    return {
      id: uid(),
      kind: rank,
      category,
      prompt,
      subject: { text: s.name },
      layout: 'list',
      choices: shuffle(rng, [rankLabel(own), ...options]),
      answerId: own.name,
      explanation: `${capitalize(withArticle(s))} appartient ${rank === 'class' ? 'à la classe' : rank === 'order' ? 'à l’ordre' : 'à la famille'} des ${own.fr ? `${own.fr} (${own.name})` : own.name}.`,
      learnIds: [s.id],
      difficulty,
    };
  };
}

const genOrder = genRank('order', 'Classification', 'À quel ordre appartient…');
const genFamily = genRank('family', 'Classification', 'À quelle famille appartient…');
const genClass = genRank('class', 'Classification', 'À quelle classe appartient…');

const STATUS_POOL: IucnStatus[] = ['LC', 'NT', 'VU', 'EN', 'CR', 'EX'];

const genStatus: Generator = ({ rng, difficulty, uid }, s) => {
  if (!STATUS_POOL.includes(s.status)) return null;
  const others = shuffle(
    rng,
    STATUS_POOL.filter((c) => c !== s.status),
  )
    .sort((a, b) => Math.abs(IUCN[a].level - IUCN[s.status].level) - Math.abs(IUCN[b].level - IUCN[s.status].level))
    .slice(0, difficulty === 1 ? 5 : 3);
  const picked = difficulty === 1 ? sample(rng, others, 3) : others;
  return {
    id: uid(),
    kind: 'status',
    category: 'Conservation',
    prompt: 'Quel est le statut UICN de…',
    subject: { text: s.name },
    layout: 'list',
    choices: shuffle(rng, [s.status, ...picked]).map((c) => ({ id: c, label: IUCN[c].label, sublabel: c, color: IUCN[c].color })),
    answerId: s.status,
    explanation: `Statut ${ofSpecies(s)} sur la Liste rouge de l’UICN : « ${IUCN[s.status].label} ». ${IUCN[s.status].description}`,
    learnIds: [s.id],
    difficulty,
  };
};

type Metric = 'weight' | 'length' | 'lifespan' | 'speed';

interface MetricInfo {
  prompt: string;
  /** Formulation neutre (sans accord) pour les affirmations « vrai ou faux ». */
  comparative: string;
  verb: string;
  /** Intervalle [min, max] de la mesure (une valeur unique s’écrit [v, v]). */
  range: (s: Species) => Range | undefined;
  fmt: (v: Range | number) => string;
}

/** Envergure (pattes, tentacules) très supérieure au corps : « le plus long » serait trompeur. */
const spanDominates = (s: Species) => s.group !== 'birds' && (s.stats.wingspan?.[1] ?? 0) > (s.stats.length?.[1] ?? Infinity) * 2;

const METRICS: Record<Metric, MetricInfo> = {
  weight: {
    prompt: 'Lequel est le plus lourd ?',
    comparative: 'pèse plus que',
    verb: 'pèse',
    range: (s) => s.stats.weight,
    fmt: formatWeight,
  },
  length: {
    prompt: 'Lequel est le plus long ?',
    comparative: 'mesure plus que',
    verb: 'mesure',
    range: (s) => (spanDominates(s) ? undefined : s.stats.length),
    fmt: formatLength,
  },
  lifespan: {
    prompt: 'Lequel vit le plus longtemps ?',
    comparative: 'vit plus longtemps que',
    verb: 'vit',
    range: (s) => s.stats.lifespan,
    fmt: formatLifespan,
  },
  speed: {
    prompt: 'Lequel est le plus rapide ?',
    comparative: 'va plus vite que',
    verb: 'atteint',
    range: (s) => (s.stats.speed ? [s.stats.speed, s.stats.speed] : undefined),
    fmt: (v) => formatSpeed(typeof v === 'number' ? v : v[1]),
  },
};

const typical = (r: Range) => (r[0] + r[1]) / 2;

interface Duel {
  metric: MetricInfo;
  winner: Species;
  loser: Species;
  explanation: string;
}

/**
 * Trouve un adversaire pour `s` sur une mesure. On compare des adultes moyens
 * (milieu de l’intervalle) et le gagnant doit dominer sur toute la fourchette :
 * jamais de duel où un grand individu de l’un dépasserait un petit de l’autre
 * dans le mauvais sens. L’écart minimal dépend de la difficulté.
 */
function pickDuel(ctx: GenContext, s: Species, forcedRatio?: number): Duel | null {
  const { rng, pool, difficulty } = ctx;
  const metrics = (Object.keys(METRICS) as Metric[]).filter((m) => METRICS[m].range(s) !== undefined);
  if (!metrics.length) return null;
  const m = METRICS[pick(rng, metrics)];
  const ra = m.range(s) as Range;
  const minRatio = forcedRatio ?? (difficulty === 1 ? 2 : difficulty === 2 ? 1.35 : 1.15);
  const maxRatio = difficulty === 1 ? Infinity : difficulty === 2 ? 20 : 4;
  const rivals = pool.filter((o) => {
    const rb = m.range(o);
    if (o.id === s.id || rb === undefined || !hasPhoto(o)) return false;
    const [big, small] = typical(ra) > typical(rb) ? [ra, rb] : [rb, ra];
    const r = typical(big) / typical(small);
    return r >= minRatio && r <= maxRatio && big[0] >= small[0] && big[1] > small[1];
  });
  if (!rivals.length) return null;
  const o = weightedPick(rng, rivals, (x) => (x.group === s.group ? 2 : 1));
  const rb = m.range(o) as Range;
  const winner = typical(ra) > typical(rb) ? s : o;
  const loser = winner === s ? o : s;
  const explanation =
    `${withArticle(winner, true)} ${m.verb} ${m.fmt(m.range(winner) as Range)}, ` +
    `contre ${m.fmt(m.range(loser) as Range)} pour ${withArticle(loser)}.`;
  return { metric: m, winner, loser, explanation };
}

export function genCompare(ctx: GenContext, s: Species, forcedRatio?: number): Question | null {
  const duel = pickDuel(ctx, s, forcedRatio);
  if (!duel) return null;
  return {
    id: ctx.uid(),
    kind: 'compare',
    category: 'Plus ou moins',
    prompt: duel.metric.prompt,
    layout: 'duel',
    choices: shuffle(ctx.rng, [duel.winner, duel.loser]).map(choiceFor),
    answerId: duel.winner.id,
    explanation: duel.explanation,
    learnIds: [duel.winner.id, duel.loser.id],
    difficulty: ctx.difficulty,
  };
}

const genCompareQ: Generator = (ctx, s) => genCompare(ctx, s);

const genRecord: Generator = ({ rng, pool, difficulty, uid }, s) => {
  if (!s.record) return null;
  const text = maskName(s.record, s);
  const others = pickDistractors(rng, s, pool, 3, difficulty, (o) => sameGender(s)(o) && (Boolean(o.record) || difficulty === 1));
  return {
    id: uid(),
    kind: 'record',
    category: 'Records',
    prompt: 'Qui détient ce record ?',
    subject: { text, quote: true },
    layout: 'list',
    choices: shuffle(rng, [s, ...others]).map(choiceFor),
    answerId: s.id,
    explanation: `C’est ${withArticle(s)}. ${s.facts[0]}`,
    learnIds: [s.id],
    difficulty,
  };
};

/** « De quel animal parle cette légende ? » — récits d’histoire et de mythologie. */
const genLore: Generator = ({ rng, pool, difficulty, uid }, s) => {
  const stems = nameStems(s);
  const stories = (s.lore ?? [])
    .map((l) => ({ l, m: maskName(`${l.culture} — ${l.text}`, s) }))
    .filter(({ m }) => !stems.some((stem) => normalize(m).includes(stem)));
  if (!stories.length) return null;
  const { l, m } = pick(rng, stories);
  return {
    id: uid(),
    kind: 'lore',
    category: 'Mythes & histoire',
    prompt: 'De quel animal parle-t-on ?',
    subject: { text: m, quote: true },
    layout: 'list',
    choices: shuffle(rng, [s, ...pickDistractors(rng, s, pool, 3, difficulty, (o) => sameGender(s)(o))]).map(choiceFor),
    answerId: s.id,
    explanation: `C’est ${withArticle(s)}. ${l.text}`,
    learnIds: [s.id],
    difficulty,
  };
};

const genFact: Generator = ({ rng, pool, difficulty, uid }, s) => {
  const facts = s.facts.map((f) => ({ f, m: maskName(f, s) })).filter(({ f, m }) => !isMasked(f, m) || m.split('…').length <= 3);
  if (!facts.length) return null;
  const { f, m } = pick(rng, facts);
  return {
    id: uid(),
    kind: 'fact',
    category: 'Le saviez-vous ?',
    prompt: 'De quel animal parle-t-on ?',
    subject: { text: m, quote: true },
    layout: 'list',
    choices: shuffle(rng, [s, ...pickDistractors(rng, s, pool, 3, difficulty, sameGender(s))]).map(choiceFor),
    answerId: s.id,
    explanation: `C’est ${withArticle(s)}. ${funLine(s, f)}`,
    learnIds: [s.id],
    difficulty,
  };
};

const CONTINENTS: Region[] = ['europe', 'afrique', 'asie', 'amerique-nord', 'amerique-sud', 'oceanie'];

/** Espèces polaires ou océaniques : leurs limites continentales sont trop floues pour une question fermée. */
const fuzzyRange = (s: Species) => s.regions.some((r) => r === 'arctique' || r === 'antarctique' || r === 'oceans');

const genRegion: Generator = ({ rng, difficulty, uid }, s) => {
  const own = s.regions.filter((r) => CONTINENTS.includes(r));
  if (!own.length || own.length > 3 || fuzzyRange(s)) return null;
  const answer = pick(rng, own);
  const wrong = sample(rng, CONTINENTS.filter((r) => !s.regions.includes(r)), 3);
  if (wrong.length < 3) return null;
  return {
    id: uid(),
    kind: 'region',
    category: 'Géographie',
    prompt: 'Sur quel continent vit, à l’état sauvage…',
    subject: { text: s.name },
    layout: 'list',
    choices: shuffle(rng, [answer, ...wrong]).map((r) => ({ id: r, label: REGIONS[r].label })),
    answerId: answer,
    explanation: `${capitalize(withArticle(s))} vit naturellement en ${own.map((r) => REGIONS[r].label).join(', ')}.`,
    learnIds: [s.id],
    difficulty,
  };
};

const DIET_POOL: Diet[] = ['carnivore', 'herbivore', 'insectivore', 'piscivore', 'omnivore', 'filtreur', 'frugivore', 'nectarivore', 'hematophage', 'charognard', 'myrmecophage'];

/** Régimes qui se recoupent : un leurre de la même famille pourrait être juste lui aussi. */
const DIET_FAMILY: Partial<Record<Diet, string>> = {
  carnivore: 'animal',
  piscivore: 'animal',
  insectivore: 'animal',
  myrmecophage: 'animal',
  charognard: 'animal',
  hematophage: 'animal',
  parasite: 'animal',
  herbivore: 'vegetal',
  folivore: 'vegetal',
  frugivore: 'vegetal',
  granivore: 'vegetal',
  nectarivore: 'vegetal',
};

const genDiet: Generator = ({ rng, difficulty, uid }, s) => {
  const answer = s.diet[0];
  if (!DIET_POOL.includes(answer) && answer !== 'folivore' && answer !== 'granivore') return null;
  const families = new Set(s.diet.map((d) => DIET_FAMILY[d]).filter(Boolean));
  // Un omnivore mange de tout : seuls les régimes très spécialisés restent faux.
  const wrongPool = DIET_POOL.filter((d) => {
    if (s.diet.includes(d)) return false;
    if (s.diet.includes('omnivore')) return d === 'filtreur' || d === 'hematophage' || d === 'myrmecophage' || d === 'nectarivore';
    // Un filtreur avale du plancton animal : seuls les régimes végétaux sont franchement faux.
    if (s.diet.includes('filtreur')) return DIET_FAMILY[d] === 'vegetal';
    const family = DIET_FAMILY[d];
    return !(family && families.has(family));
  });
  if (wrongPool.length < 3) return null;
  const wrong = sample(rng, wrongPool, 3);
  return {
    id: uid(),
    kind: 'diet',
    category: 'Régime alimentaire',
    prompt: 'Quel est le régime alimentaire principal de…',
    subject: { text: s.name },
    layout: 'list',
    choices: shuffle(rng, [answer, ...wrong]).map((d) => ({ id: d, label: DIETS[d].label })),
    answerId: answer,
    explanation: `Régime alimentaire ${ofSpecies(s)} : ${s.diet.map((d) => DIETS[d].label.toLowerCase()).join(', ')}.`,
    learnIds: [s.id],
    difficulty,
  };
};

const GROUP_IDS_FOR_TF: GroupId[] = [
  'mammals',
  'birds',
  'reptiles',
  'amphibians',
  'fishes',
  'insects',
  'arachnids',
  'crustaceans',
  'molluscs',
  'cnidarians',
];

const genTrueFalse: Generator = (ctx, s) => {
  const { rng, difficulty, uid } = ctx;
  const truth = rng() < 0.5;
  const name = withArticle(s, true);
  const variants: (() => { statement: string; explanation: string } | null)[] = [
    () => {
      if (s.group === 'others') return null;
      const g: GroupId = truth ? s.group : pick(rng, GROUP_IDS_FOR_TF.filter((x) => x !== s.group));
      return {
        statement: `${name} fait partie des ${GROUPS[g].label.toLowerCase()}.`,
        explanation: `${name} fait partie des ${GROUPS[s.group].label.toLowerCase()}.`,
      };
    },
    () => {
      if (!STATUS_POOL.includes(s.status)) return null;
      const st = truth ? s.status : pick(rng, STATUS_POOL.filter((c) => c !== s.status));
      return {
        statement: `${name} figure dans la catégorie « ${IUCN[st].label} » de la Liste rouge de l’UICN.`,
        explanation: `Statut UICN ${ofSpecies(s)} : « ${IUCN[s.status].label} ».`,
      };
    },
    () => {
      const duel = pickDuel(ctx, s, difficulty === 3 ? 1.15 : 1.6);
      if (!duel) return null;
      const [a, b] = truth ? [duel.winner, duel.loser] : [duel.loser, duel.winner];
      return {
        statement: `${withArticle(a, true)} ${duel.metric.comparative} ${withArticle(b)}.`,
        explanation: duel.explanation,
      };
    },
    () => {
      const own = s.regions.filter((r) => CONTINENTS.includes(r));
      const absent = CONTINENTS.filter((c) => !s.regions.includes(c));
      if (!own.length || !absent.length || fuzzyRange(s)) return null;
      const r = truth ? pick(rng, own) : pick(rng, absent);
      return {
        statement: `On peut observer ${withArticle(s)} à l’état sauvage en ${REGIONS[r].label}.`,
        explanation: `${name} vit naturellement en ${own.map((x) => REGIONS[x].label).join(', ')}.`,
      };
    },
    () => {
      // « Jour et nuit » rendrait l’affirmation ambiguë.
      if (s.activity === 'cathemeral' || s.activity === 'crepusculaire') return null;
      const shown = truth ? s.activity : s.activity === 'diurne' ? 'nocturne' : 'diurne';
      return {
        statement: `${name} est une espèce ${ACTIVITIES[shown].label.toLowerCase()}.`,
        explanation: `${name} est une espèce ${ACTIVITIES[s.activity].label.toLowerCase()}.`,
      };
    },
  ];
  for (const v of shuffle(rng, variants)) {
    const res = v();
    if (!res) continue;
    return {
      id: uid(),
      kind: 'true-false',
      category: 'Vrai ou faux',
      prompt: 'Cette affirmation est-elle exacte ?',
      subject: { text: res.statement, quote: true },
      layout: 'binary',
      choices: [
        { id: 'vrai', label: 'Vrai' },
        { id: 'faux', label: 'Faux' },
      ],
      answerId: truth ? 'vrai' : 'faux',
      explanation: res.explanation,
      learnIds: [s.id],
      difficulty,
    };
  }
  return null;
};

const HABITAT_FR: Record<string, string> = Object.fromEntries(
  Object.entries(HABITATS).map(([k, v]) => [k, v.label.toLowerCase()]),
);

const ACTIVITY_CLUES: Record<Species['activity'], string> = {
  diurne: 'plutôt actif le jour',
  nocturne: 'plutôt actif la nuit',
  crepusculaire: 'surtout actif à l’aube et au crépuscule',
  cathemeral: 'actif de jour comme de nuit',
};

/** Indices du plus vague au plus précis pour « Qui suis-je ? ». */
export function buildClues(s: Species): string[] {
  const clues: string[] = [];
  const g = GROUPS[s.group];
  clues.push(s.group === 'others' ? 'Je suis un invertébré.' : `Je fais partie des ${g.label.toLowerCase()}.`);
  clues.push(
    `Mes milieux : ${s.habitats
      .slice(0, 3)
      .map((h) => HABITAT_FR[h] ?? h)
      .join(', ')}.`,
  );
  const regions = s.regions.map((r) => REGIONS[r].label);
  clues.push(`On me rencontre : ${regions.slice(0, 4).join(', ')}.`);
  clues.push(`Je suis ${s.diet.map((d) => DIETS[d].label.toLowerCase()).join(' et ')}, ${ACTIVITY_CLUES[s.activity]}.`);
  const size = s.stats.length ?? s.stats.height ?? s.stats.wingspan;
  const parts: string[] = [];
  if (size) parts.push(`je mesure ${formatLength(size)}`);
  if (s.stats.weight) parts.push(`je pèse ${formatWeight(s.stats.weight)}`);
  if (parts.length) clues.push(`${capitalize(parts.join(' et '))}.`);
  const facts = s.facts.map((f) => maskName(f, s)).filter((f) => f.split('…').length <= 3);
  if (facts[0]) clues.push(facts[0]);
  if (s.record) {
    const r = maskName(s.record, s);
    clues.push(`Record : ${r.charAt(0).toLowerCase()}${r.slice(1)}.`);
  }
  else if (facts[1]) clues.push(facts[1]);
  return clues;
}

const genClues: Generator = ({ rng, pool, uid }, s) => {
  if (!hasPhoto(s)) return null;
  return {
    id: uid(),
    kind: 'clues',
    category: 'Qui suis-je ?',
    prompt: 'Qui suis-je ?',
    media: { type: 'photo', speciesId: s.id, photoIndex: photoIndex(rng, s) },
    layout: 'list',
    choices: shuffle(rng, [s, ...pickDistractors(rng, s, pool, 3, 2, sameGender(s))]).map(choiceFor),
    answerId: s.id,
    explanation: funLine(s),
    learnIds: [s.id],
    difficulty: 2,
    clues: buildClues(s),
  };
};

const genSound: Generator = ({ rng, pool, uid }, s) => {
  const others = pickDistractors(rng, s, pool.filter((o) => SOUND_IDS.has(o.id) || o.group === 'birds'), 3, 2);
  return {
    id: uid(),
    kind: 'sound',
    category: 'Chants & cris',
    prompt: 'Qui émet ce son ?',
    media: { type: 'sound', speciesId: s.id },
    layout: 'list',
    choices: shuffle(rng, [s, ...others]).map(choiceFor),
    answerId: s.id,
    explanation: s.facts[0],
    learnIds: [s.id],
    difficulty: 2,
  };
};

/** Espèces non aviaires dont les vocalisations sont caractéristiques. */
export const SOUND_IDS = new Set([
  'lion', 'loup-gris', 'cerf-elaphe', 'hyene-tachetee', 'chimpanze', 'baleine-a-bosse', 'orque', 'grand-dauphin',
  'beluga', 'elephant-de-savane', 'gorille-de-l-ouest', 'rainette-verte', 'rainette-aux-yeux-rouges', 'crapaud-commun',
  'crapaud-buffle', 'grenouille-des-bois', 'cigale-periodique', 'sanglier', 'renard-roux', 'koala', 'kakapo',
]);

export const GENERATORS: Record<Exclude<QuestionKind, never>, Generator> = {
  'photo-to-name': genPhotoToName,
  'name-to-photo': genNameToPhoto,
  silhouette: genSilhouette,
  'sci-name': genSciName,
  'from-sci': genFromSci,
  order: genOrder,
  family: genFamily,
  class: genClass,
  status: genStatus,
  compare: genCompareQ,
  'true-false': genTrueFalse,
  record: genRecord,
  fact: genFact,
  lore: genLore,
  region: genRegion,
  diet: genDiet,
  sound: genSound,
  clues: genClues,
};

// ───────────────────────────── Composition des parties ─────────────────────────────

type Mix = Partial<Record<QuestionKind, number>>;

const MIXES: Record<'standard' | 'expert' | 'timed' | 'species', Mix> = {
  standard: {
    'photo-to-name': 5,
    'name-to-photo': 2,
    fact: 2,
    compare: 2,
    record: 1.5,
    lore: 1.2,
    'true-false': 1.5,
    status: 1,
    silhouette: 1,
    region: 1,
    diet: 0.8,
    class: 0.6,
    order: 0.6,
    'from-sci': 0.6,
  },
  expert: { 'sci-name': 3, 'from-sci': 2, order: 2.5, family: 2.5, status: 1.5, record: 1, fact: 1, 'photo-to-name': 1.5 },
  timed: { 'photo-to-name': 4, 'true-false': 2, compare: 2, silhouette: 1 },
  species: { 'photo-to-name': 1, fact: 1, lore: 1.5, status: 1, compare: 1, region: 1, diet: 1, 'from-sci': 1, record: 1, 'true-false': 1 },
};

export interface QuizConfig {
  mode: QuizMode;
  seed: number;
  difficulty?: Difficulty;
  group?: GroupId;
  speciesId?: string;
  /** Espèces prioritaires (révision). */
  focusIds?: string[];
  /** Espèces dont les images sont masquées (mode arachnophobie) : jamais montrées, ni comme leurres. */
  hidden?: (s: Species) => boolean;
}

/** Types de questions qui montrent une photo ou une silhouette de l’espèce. */
const VISUAL_KINDS = new Set<QuestionKind>(['photo-to-name', 'name-to-photo', 'silhouette', 'clues', 'compare']);

export interface Quiz {
  info: ModeInfo;
  /** Génère la question n° `index` ; `streak` permet de durcir les modes sans fin. */
  next: (index: number, streak?: number) => Question | null;
}

export function createQuiz(all: Species[], config: QuizConfig): Quiz {
  const info = MODES[config.mode];
  const rng = createRng(config.seed);
  let counter = 0;
  const uid = () => `${config.mode}-${config.seed}-${counter++}`;
  const isHidden = config.hidden ?? (() => false);
  const visible = all.filter((s) => !isHidden(s));
  const base = config.group ? visible.filter((s) => s.group === config.group) : visible;
  const used = new Set<string>();
  const focus = (config.focusIds ?? []).map((id) => visible.find((s) => s.id === id)).filter(Boolean) as Species[];
  const target = config.speciesId ? all.find((s) => s.id === config.speciesId) : undefined;
  // « Me tester » sur une espèce masquée : seulement des questions sans image.
  const textOnlyTarget = target !== undefined && isHidden(target);
  const usedKinds = new Map<QuestionKind, number>();

  const difficultyAt = (index: number, streak: number): Difficulty => {
    if (config.mode === 'survival') return (streak >= 12 ? 3 : streak >= 5 ? 2 : 1) as Difficulty;
    if (config.mode === 'duel') return (index >= 10 ? 3 : index >= 4 ? 2 : 1) as Difficulty;
    if (config.mode === 'expert') return 3;
    if (config.mode === 'daily' || config.mode === 'challenge') return index < 3 ? 1 : index < 7 ? 2 : 3;
    return config.difficulty ?? 2;
  };

  const pickSpecies = (filter: (s: Species) => boolean): Species | undefined => {
    const source = focus.length ? focus.filter((s) => !used.has(s.id) && filter(s)) : [];
    const pool = source.length ? source : base.filter((s) => !used.has(s.id) && filter(s));
    if (!pool.length) {
      used.clear();
      const again = base.filter(filter);
      return again.length ? pick(rng, again) : undefined;
    }
    return pick(rng, pool);
  };

  const fromMix = (mix: Mix): QuestionKind => {
    const kinds = Object.keys(mix) as QuestionKind[];
    // Pénalise les types déjà sortis pour varier les plaisirs.
    return weightedPick(rng, kinds, (k) => (mix[k] ?? 0) / (1 + (usedKinds.get(k) ?? 0) * 0.8));
  };

  const kindFor = (index: number): QuestionKind => {
    switch (config.mode) {
      case 'whoami':
        return 'clues';
      case 'duel':
        return 'compare';
      case 'silhouettes':
        return 'silhouette';
      case 'sounds':
        return 'sound';
      case 'expert':
        return fromMix(MIXES.expert);
      case 'timed':
        return fromMix(MIXES.timed);
      case 'species':
        return index === 0 && !textOnlyTarget ? 'photo-to-name' : fromMix(MIXES.species);
      case 'review':
        return fromMix({ 'photo-to-name': 3, fact: 2, 'name-to-photo': 1, 'from-sci': 1, record: 1 });
      default:
        return fromMix(MIXES.standard);
    }
  };

  const speciesFilter = (kind: QuestionKind) => (s: Species) => {
    switch (kind) {
      case 'silhouette':
        return Boolean(s.silhouette?.exact);
      case 'sound':
        return s.group === 'birds' || SOUND_IDS.has(s.id);
      case 'record':
        return Boolean(s.record);
      case 'lore':
        return Boolean(s.lore?.length);
      case 'compare':
        return hasPhoto(s) && Boolean(s.stats.weight || s.stats.length || s.stats.lifespan || s.stats.speed);
      default:
        return true;
    }
  };

  return {
    info,
    next(index: number, streak = 0) {
      if (info.length !== null && index >= info.length) return null;
      const difficulty = difficultyAt(index, streak);
      for (let attempt = 0; attempt < 40; attempt++) {
        const kind = kindFor(index);
        if (textOnlyTarget && VISUAL_KINDS.has(kind)) continue;
        const s = target ?? pickSpecies(speciesFilter(kind));
        if (!s) continue;
        const ctx: GenContext = { rng, pool: visible, difficulty, uid };
        const q = GENERATORS[kind](ctx, s);
        if (q) {
          used.add(s.id);
          usedKinds.set(kind, (usedKinds.get(kind) ?? 0) + 1);
          return q;
        }
      }
      return null;
    },
  };
}

// ───────────────────────────── Score ─────────────────────────────

export interface AnswerScore {
  points: number;
  speedBonus: number;
  comboMultiplier: number;
}

/**
 * Points d’une réponse : base selon la difficulté, bonus de rapidité,
 * multiplicateur de série et pénalité d’indices.
 */
export function scoreAnswer(opts: {
  correct: boolean;
  difficulty: Difficulty;
  elapsedMs: number;
  combo: number;
  cluesUsed?: number;
}): AnswerScore {
  if (!opts.correct) return { points: 0, speedBonus: 0, comboMultiplier: 1 };
  const base = 100 * (1 + 0.25 * (opts.difficulty - 1));
  const speedBonus = opts.elapsedMs < 3000 ? 50 : opts.elapsedMs < 6000 ? 25 : opts.elapsedMs < 10000 ? 10 : 0;
  const comboMultiplier = 1 + Math.min(opts.combo, 10) * 0.1;
  const clueFactor = opts.cluesUsed ? Math.max(0.3, 1 - 0.12 * (opts.cluesUsed - 1)) : 1;
  return {
    points: Math.round((base * clueFactor + speedBonus) * comboMultiplier),
    speedBonus,
    comboMultiplier,
  };
}

export const xpFromPoints = (points: number) => Math.round(points / 10);
