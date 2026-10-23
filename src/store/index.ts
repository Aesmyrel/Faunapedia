/**
 * État persistant de l’application : découvertes, favoris, XP, statistiques
 * de quiz, série quotidienne, révision et réglages. Sauvegardé localement.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { daysBetween, todayKey } from '@/lib/format';
import { levelFromXp, newlyUnlocked, type ProgressSnapshot, type ReviewItem, reviewAfter } from '@/lib/progress';
import type { QuizMode } from '@/lib/quiz';

export type ThemePreference = 'system' | 'dark' | 'light';

export interface Settings {
  haptics: boolean;
  sounds: boolean;
  theme: ThemePreference;
  /** L’écran de bienvenue a-t-il déjà été vu ? */
  onboarded: boolean;
  /** Mode arachnophobie (absent tant que la question n’a pas été posée). */
  hideSpiders?: boolean;
}

export interface QuizStats {
  quizzes: number;
  answered: number;
  correct: number;
  bestCombo: number;
  perfects: number;
  points: number;
  bestCorrect: Partial<Record<QuizMode, number>>;
  bestPoints: Partial<Record<QuizMode, number>>;
  mastered: number;
}

export interface DailyState {
  last?: string;
  streak: number;
  best: number;
  scores: Record<string, number>;
}

export interface Counters {
  taxa: number;
  compares: number;
  nearby: number;
  night: number;
}

export interface AnswerRecord {
  speciesIds: string[];
  correct: boolean;
}

export interface QuizResult {
  mode: QuizMode;
  correct: number;
  total: number;
  points: number;
  bestCombo: number;
  answers: AnswerRecord[];
}

export interface QuizReward {
  xp: number;
  levelBefore: number;
  levelAfter: number;
  newBadges: string[];
  streak?: number;
  perfect: boolean;
  record: boolean;
}

interface PersistedState {
  seen: Record<string, number>;
  favorites: string[];
  xp: number;
  stats: QuizStats;
  daily: DailyState;
  review: Record<string, ReviewItem>;
  badges: Record<string, number>;
  counters: Counters;
  settings: Settings;
}

interface AppState extends PersistedState {
  /** File d’attente des célébrations à afficher (badges, niveaux). */
  celebrations: Celebration[];
  markSeen: (id: string) => void;
  toggleFavorite: (id: string) => void;
  finishQuiz: (result: QuizResult) => QuizReward;
  bump: (counter: keyof Counters) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  shiftCelebration: () => void;
  resetProgress: () => void;
}

export type Celebration = { type: 'badge'; id: string } | { type: 'level'; level: number };

const INITIAL: PersistedState = {
  seen: {},
  favorites: [],
  xp: 0,
  stats: {
    quizzes: 0,
    answered: 0,
    correct: 0,
    bestCombo: 0,
    perfects: 0,
    points: 0,
    bestCorrect: {},
    bestPoints: {},
    mastered: 0,
  },
  daily: { streak: 0, best: 0, scores: {} },
  review: {},
  badges: {},
  counters: { taxa: 0, compares: 0, nearby: 0, night: 0 },
  settings: { haptics: true, sounds: true, theme: 'system', onboarded: false },
};

/** XP gagnée pour chaque nouvelle espèce découverte. */
export const XP_PER_DISCOVERY = 5;

function snapshot(s: PersistedState): ProgressSnapshot {
  return { seen: s.seen, favorites: s.favorites, xp: s.xp, stats: s.stats, daily: s.daily, counters: s.counters };
}

/** Enregistre les nouveaux badges et niveaux, et les met en file pour célébration. */
function withRewards(prev: AppState, next: Partial<PersistedState>): Partial<AppState> {
  const merged = { ...prev, ...next };
  const unlocked = newlyUnlocked(snapshot(merged), merged.badges);
  const celebrations = [...prev.celebrations];
  const levelBefore = levelFromXp(prev.xp).level;
  const levelAfter = levelFromXp(merged.xp).level;
  if (levelAfter > levelBefore) celebrations.push({ type: 'level', level: levelAfter });
  if (!unlocked.length) return { ...next, celebrations };
  const now = Date.now();
  const badges = { ...merged.badges };
  for (const id of unlocked) {
    badges[id] = now;
    celebrations.push({ type: 'badge', id });
  }
  return { ...next, badges, celebrations };
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...INITIAL,
      celebrations: [],

      markSeen: (id) => {
        const s = get();
        if (s.seen[id]) return;
        set(withRewards(s, { seen: { ...s.seen, [id]: Date.now() }, xp: s.xp + XP_PER_DISCOVERY }));
      },

      toggleFavorite: (id) => {
        const s = get();
        const favorites = s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites];
        set(withRewards(s, { favorites }));
      },

      bump: (counter) => {
        const s = get();
        set(withRewards(s, { counters: { ...s.counters, [counter]: s.counters[counter] + 1 } }));
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      shiftCelebration: () => set((s) => ({ celebrations: s.celebrations.slice(1) })),

      resetProgress: () => set((s) => ({ ...INITIAL, settings: s.settings, celebrations: [] })),

      finishQuiz: (result) => {
        const s = get();
        const now = Date.now();
        const today = todayKey();
        const perfect = result.total >= 5 && result.correct === result.total;
        const prevBest = s.stats.bestCorrect[result.mode] ?? 0;
        const record = result.correct > prevBest && result.correct > 0;

        let xp = Math.round(result.points / 10) + (perfect ? 50 : 0);

        // Série du défi du jour
        let daily = s.daily;
        if (result.mode === 'daily' && s.daily.last !== today) {
          const continues = s.daily.last !== undefined && daysBetween(s.daily.last, today) === 1;
          const streak = continues ? s.daily.streak + 1 : 1;
          daily = {
            last: today,
            streak,
            best: Math.max(s.daily.best, streak),
            scores: { ...s.daily.scores, [today]: result.correct },
          };
          xp += 20 + Math.min(streak, 10) * 5;
        }

        // Révision espacée
        const review = { ...s.review };
        let mastered = s.stats.mastered;
        for (const a of result.answers) {
          const id = a.speciesIds[0];
          if (!id) continue;
          const next = reviewAfter(review[id], a.correct, now);
          if (next) review[id] = next;
          else if (review[id]) {
            delete review[id];
            mastered++;
          }
        }

        const stats: QuizStats = {
          quizzes: s.stats.quizzes + 1,
          answered: s.stats.answered + result.total,
          correct: s.stats.correct + result.correct,
          bestCombo: Math.max(s.stats.bestCombo, result.bestCombo),
          perfects: s.stats.perfects + (perfect && result.total >= 10 ? 1 : 0),
          points: s.stats.points + result.points,
          bestCorrect: { ...s.stats.bestCorrect, [result.mode]: Math.max(prevBest, result.correct) },
          bestPoints: {
            ...s.stats.bestPoints,
            [result.mode]: Math.max(s.stats.bestPoints[result.mode] ?? 0, result.points),
          },
          mastered,
        };

        const hour = new Date(now).getHours();
        const counters = hour < 5 ? { ...s.counters, night: s.counters.night + 1 } : s.counters;
        const levelBefore = levelFromXp(s.xp).level;
        const patch = withRewards(s, { xp: s.xp + xp, stats, daily, review, counters });
        set(patch);
        const after = get();
        return {
          xp,
          levelBefore,
          levelAfter: levelFromXp(after.xp).level,
          newBadges: Object.keys(after.badges).filter((id) => !s.badges[id]),
          streak: result.mode === 'daily' ? after.daily.streak : undefined,
          perfect,
          record,
        };
      },
    }),
    {
      name: 'faunapedia-v1',
      version: 1,
      // Complète les réglages ajoutés depuis une version antérieure de la sauvegarde.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        return { ...current, ...p, settings: { ...current.settings, ...p.settings } };
      },
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedState => ({
        seen: s.seen,
        favorites: s.favorites,
        xp: s.xp,
        stats: s.stats,
        daily: s.daily,
        review: s.review,
        badges: s.badges,
        counters: s.counters,
        settings: s.settings,
      }),
    },
  ),
);

/** Vrai une fois la sauvegarde locale relue (évite d’afficher l’état par défaut). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

/** La série quotidienne est-elle toujours active (jouée hier ou aujourd’hui) ? */
export function activeStreak(daily: DailyState, today = todayKey()): number {
  if (!daily.last) return 0;
  return daysBetween(daily.last, today) <= 1 ? daily.streak : 0;
}
