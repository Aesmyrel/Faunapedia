/** Niveaux, rangs et badges : la progression du naturaliste. */
import { SPECIES, SPECIES_BY_GROUP } from '@/data';
import { GROUP_ORDER, GROUPS, type IconRef } from '@/data/reference';
import type { GroupId } from '@/data/types';

import type { QuizMode } from './quiz';

// ───────────────────────────── Niveaux ─────────────────────────────

/** XP cumulée nécessaire pour atteindre le niveau `level` (niveau 1 = 0 XP). */
export function xpForLevel(level: number): number {
  return level <= 1 ? 0 : Math.round(60 * (level - 1) ** 1.6);
}

export interface Rank {
  from: number;
  title: string;
  quote: string;
}

export const RANKS: Rank[] = [
  { from: 1, title: 'Curieux de nature', quote: 'Tout commence par un regard.' },
  { from: 3, title: 'Observateur', quote: 'Regarder, c’est déjà comprendre un peu.' },
  { from: 5, title: 'Naturaliste en herbe', quote: 'Les carnets se remplissent.' },
  { from: 8, title: 'Naturaliste', quote: 'Le terrain n’a plus de secrets… presque.' },
  { from: 12, title: 'Explorateur', quote: 'Chaque branche de l’arbre du vivant vous appelle.' },
  { from: 16, title: 'Zoologiste', quote: 'Rigueur et passion, le duo gagnant.' },
  { from: 20, title: 'Émule de Buffon', quote: '« Le génie n’est qu’une plus grande aptitude à la patience. »' },
  { from: 25, title: 'Disciple de Darwin', quote: '« Il y a de la grandeur dans cette conception de la vie. »' },
  { from: 30, title: 'Héritier de Linné', quote: 'Nommer, classer, émerveiller.' },
  { from: 40, title: 'Légende du vivant', quote: 'Le règne animal vous salue.' },
];

export interface LevelInfo {
  level: number;
  rank: Rank;
  nextRank?: Rank;
  /** XP acquise dans le niveau courant. */
  current: number;
  /** XP nécessaire pour passer au niveau suivant. */
  needed: number;
  progress: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const rank = [...RANKS].reverse().find((r) => level >= r.from) ?? RANKS[0];
  const nextRank = RANKS.find((r) => r.from > level);
  return {
    level,
    rank,
    nextRank,
    current: xp - floor,
    needed: ceil - floor,
    progress: (xp - floor) / (ceil - floor),
  };
}

// ───────────────────────────── Révision espacée (Leitner) ─────────────────────────────

/** Intervalle (jours) avant de revoir une espèce selon sa « boîte ». */
export const REVIEW_INTERVALS = [0, 1, 3, 7, 16];
export const MASTERED_BOX = REVIEW_INTERVALS.length;

export interface ReviewItem {
  box: number;
  due: number;
}

export function reviewAfter(item: ReviewItem | undefined, correct: boolean, now: number): ReviewItem | null {
  if (!correct) return { box: 0, due: now };
  if (!item) return null;
  const box = item.box + 1;
  if (box >= MASTERED_BOX) return null;
  return { box, due: now + REVIEW_INTERVALS[box] * 86_400_000 };
}

export function dueReviews(review: Record<string, ReviewItem>, now: number): string[] {
  return Object.entries(review)
    .filter(([, r]) => r.due <= now)
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id);
}

// ───────────────────────────── Badges ─────────────────────────────

export interface ProgressSnapshot {
  seen: Record<string, number>;
  favorites: string[];
  xp: number;
  stats: {
    quizzes: number;
    answered: number;
    correct: number;
    bestCombo: number;
    perfects: number;
    bestCorrect: Partial<Record<QuizMode, number>>;
    mastered: number;
  };
  daily: { streak: number; best: number };
  counters: { taxa: number; compares: number; nearby: number; night: number };
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: IconRef;
  color: string;
  /** Progression [actuel, objectif]. */
  progress: (p: ProgressSnapshot) => [number, number];
  secret?: boolean;
}

const seenCount = (p: ProgressSnapshot) => Object.keys(p.seen).length;
const seenInGroup = (p: ProgressSnapshot, g: GroupId) => SPECIES_BY_GROUP[g].filter((s) => p.seen[s.id]).length;

const GROUP_BADGES: Record<GroupId, string> = {
  mammals: 'Mammalogiste',
  birds: 'Ornithologue',
  reptiles: 'Herpétologue',
  amphibians: 'Batrachologue',
  fishes: 'Ichtyologue',
  insects: 'Entomologiste',
  arachnids: 'Arachnologue',
  crustaceans: 'Carcinologue',
  molluscs: 'Malacologue',
  cnidarians: 'Ami des méduses',
  echinoderms: 'Ami des étoiles de mer',
  others: 'Explorateur de l’invisible',
};

export const BADGES: Badge[] = [
  {
    id: 'premiers-pas',
    title: 'Premiers pas',
    description: 'Consulter une première fiche espèce.',
    icon: { set: 'mci', name: 'shoe-print' },
    color: '#E8B04B',
    progress: (p) => [seenCount(p), 1],
  },
  {
    id: 'curieux',
    title: 'Curieux insatiable',
    description: 'Découvrir 25 espèces.',
    icon: { set: 'mci', name: 'magnify' },
    color: '#38BDF8',
    progress: (p) => [seenCount(p), 25],
  },
  {
    id: 'encyclopediste',
    title: 'Encyclopédiste',
    description: 'Découvrir 100 espèces.',
    icon: { set: 'mci', name: 'book-open-page-variant' },
    color: '#A78BFA',
    progress: (p) => [seenCount(p), 100],
  },
  {
    id: 'omniscient',
    title: 'Omniscient',
    description: 'Découvrir toutes les espèces de Faunapedia.',
    icon: { set: 'mci', name: 'crown' },
    color: '#FACC15',
    progress: (p) => [seenCount(p), SPECIES.length],
  },
  ...GROUP_ORDER.map<Badge>((g) => ({
    id: `groupe-${g}`,
    title: GROUP_BADGES[g],
    description: `Découvrir toutes les fiches « ${GROUPS[g].label} ».`,
    icon: GROUPS[g].icon,
    color: GROUPS[g].color,
    progress: (p) => [seenInGroup(p, g), SPECIES_BY_GROUP[g].length],
  })),
  {
    id: 'premier-quiz',
    title: 'Baptême du feu',
    description: 'Terminer un premier quiz.',
    icon: { set: 'mci', name: 'flag-checkered' },
    color: '#22C55E',
    progress: (p) => [p.stats.quizzes, 1],
  },
  {
    id: 'sans-faute',
    title: 'Sans faute',
    description: 'Réussir une partie de 10 questions sans aucune erreur.',
    icon: { set: 'mci', name: 'star-circle' },
    color: '#FACC15',
    progress: (p) => [p.stats.perfects, 1],
  },
  {
    id: 'en-feu',
    title: 'En feu',
    description: 'Enchaîner 10 bonnes réponses.',
    icon: { set: 'mci', name: 'fire' },
    color: '#F97316',
    progress: (p) => [p.stats.bestCombo, 10],
  },
  {
    id: 'inarretable',
    title: 'Inarrêtable',
    description: 'Enchaîner 25 bonnes réponses.',
    icon: { set: 'mci', name: 'rocket-launch' },
    color: '#EF4444',
    progress: (p) => [p.stats.bestCombo, 25],
  },
  {
    id: 'assidu',
    title: 'Assidu',
    description: 'Relever le défi du jour 3 jours d’affilée.',
    icon: { set: 'mci', name: 'calendar-check' },
    color: '#E8B04B',
    progress: (p) => [p.daily.best, 3],
  },
  {
    id: 'fidele',
    title: 'Fidèle',
    description: 'Relever le défi du jour 7 jours d’affilée.',
    icon: { set: 'mci', name: 'calendar-heart' },
    color: '#F472B6',
    progress: (p) => [p.daily.best, 7],
  },
  {
    id: 'rituel',
    title: 'Rituel sacré',
    description: 'Relever le défi du jour 30 jours d’affilée.',
    icon: { set: 'mci', name: 'calendar-star' },
    color: '#C084FC',
    progress: (p) => [p.daily.best, 30],
  },
  {
    id: 'survivant',
    title: 'Survivant',
    description: 'Atteindre 20 bonnes réponses en mode Survie.',
    icon: { set: 'mci', name: 'heart-pulse' },
    color: '#EF4444',
    progress: (p) => [p.stats.bestCorrect.survival ?? 0, 20],
  },
  {
    id: 'eclair',
    title: 'Éclair',
    description: 'Atteindre 15 bonnes réponses en Contre-la-montre.',
    icon: { set: 'mci', name: 'lightning-bolt' },
    color: '#22C55E',
    progress: (p) => [p.stats.bestCorrect.timed ?? 0, 15],
  },
  {
    id: 'duelliste',
    title: 'Duelliste',
    description: 'Remporter 15 duels d’affilée en Plus ou moins.',
    icon: { set: 'mci', name: 'scale-balance' },
    color: '#F97316',
    progress: (p) => [p.stats.bestCorrect.duel ?? 0, 15],
  },
  {
    id: 'latiniste',
    title: 'Latiniste',
    description: 'Obtenir au moins 8/10 en mode Expert.',
    icon: { set: 'mci', name: 'school' },
    color: '#A78BFA',
    progress: (p) => [p.stats.bestCorrect.expert ?? 0, 8],
  },
  {
    id: 'oeil-de-lynx',
    title: 'Œil de lynx',
    description: 'Obtenir au moins 8/10 en Silhouettes.',
    icon: { set: 'mci', name: 'eye' },
    color: '#2DD4BF',
    progress: (p) => [p.stats.bestCorrect.silhouettes ?? 0, 8],
  },
  {
    id: 'oreille-fine',
    title: 'Oreille fine',
    description: 'Obtenir au moins 7/10 en Chants & cris.',
    icon: { set: 'mci', name: 'ear-hearing' },
    color: '#F472B6',
    progress: (p) => [p.stats.bestCorrect.sounds ?? 0, 7],
  },
  {
    id: 'detective',
    title: 'Détective',
    description: 'Démasquer les 8 espèces d’une partie « Qui suis-je ? ».',
    icon: { set: 'mci', name: 'incognito' },
    color: '#C084FC',
    progress: (p) => [p.stats.bestCorrect.whoami ?? 0, 8],
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Donner 100 bonnes réponses.',
    icon: { set: 'mci', name: 'shield-star' },
    color: '#38BDF8',
    progress: (p) => [p.stats.correct, 100],
  },
  {
    id: 'puits-de-science',
    title: 'Puits de science',
    description: 'Donner 1 000 bonnes réponses.',
    icon: { set: 'mci', name: 'brain' },
    color: '#FACC15',
    progress: (p) => [p.stats.correct, 1000],
  },
  {
    id: 'perseverant',
    title: 'Persévérant',
    description: 'Maîtriser 10 espèces grâce à la révision.',
    icon: { set: 'mci', name: 'refresh' },
    color: '#FACC15',
    progress: (p) => [p.stats.mastered, 10],
  },
  {
    id: 'collectionneur',
    title: 'Collectionneur',
    description: 'Ajouter 10 espèces à vos favoris.',
    icon: { set: 'mci', name: 'heart-multiple' },
    color: '#F472B6',
    progress: (p) => [p.favorites.length, 10],
  },
  {
    id: 'arboriste',
    title: 'Grimpeur d’arbre',
    description: 'Explorer 25 branches de l’arbre du vivant.',
    icon: { set: 'mci', name: 'family-tree' },
    color: '#84CC16',
    progress: (p) => [p.counters.taxa, 25],
  },
  {
    id: 'comparateur',
    title: 'Œil comparatif',
    description: 'Comparer 10 paires d’espèces.',
    icon: { set: 'mci', name: 'compare-horizontal' },
    color: '#FB923C',
    progress: (p) => [p.counters.compares, 10],
  },
  {
    id: 'terrain',
    title: 'Naturaliste de terrain',
    description: 'Découvrir la faune observée autour de vous.',
    icon: { set: 'mci', name: 'map-marker-radius' },
    color: '#22C55E',
    progress: (p) => [p.counters.nearby, 1],
  },
  {
    id: 'noctambule',
    title: 'Noctambule',
    description: 'Terminer un quiz entre minuit et 5 h du matin.',
    icon: { set: 'mci', name: 'owl' },
    color: '#818CF8',
    progress: (p) => [p.counters.night, 1],
    secret: true,
  },
  {
    id: 'niveau-10',
    title: 'Expérience',
    description: 'Atteindre le niveau 10.',
    icon: { set: 'mci', name: 'chevron-triple-up' },
    color: '#E8B04B',
    progress: (p) => [levelFromXp(p.xp).level, 10],
  },
  {
    id: 'niveau-25',
    title: 'Sommité',
    description: 'Atteindre le niveau 25.',
    icon: { set: 'mci', name: 'trophy-award' },
    color: '#FACC15',
    progress: (p) => [levelFromXp(p.xp).level, 25],
  },
];

export const BADGES_BY_ID: Record<string, Badge> = Object.fromEntries(BADGES.map((b) => [b.id, b]));

export function isUnlocked(b: Badge, p: ProgressSnapshot): boolean {
  const [cur, goal] = b.progress(p);
  return cur >= goal;
}

/** Badges débloqués par l’état `p` mais pas encore enregistrés. */
export function newlyUnlocked(p: ProgressSnapshot, owned: Record<string, number>): string[] {
  return BADGES.filter((b) => !owned[b.id] && isUnlocked(b, p)).map((b) => b.id);
}
