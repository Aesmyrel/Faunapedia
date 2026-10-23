/** Outils de la frise de l’évolution. */
import { EVO_EVENTS, EVO_START, type EvoEvent, type Period, PERIODS } from '@/data/evolution';

import { formatNumber } from './format';

/** « ≈ 375 Ma », « ≈ 300 000 ans », ou la date historique fournie. */
export function formatAge(e: Pick<EvoEvent, 'ma' | 'date'>): string {
  if (e.date) return e.date;
  if (e.ma >= 1) return `≈ ${formatNumber(e.ma, 1)} Ma`;
  return `≈ ${formatNumber(Math.round(e.ma * 1_000_000), 0)} ans`;
}

/**
 * Heure à laquelle surviendrait un événement si les 540 millions d’années de
 * la vie animale tenaient en une journée (minuit = début, 24 h = aujourd’hui).
 */
export function clockTime(ma: number): string {
  const seconds = Math.round(((EVO_START - ma) / EVO_START) * 86_400);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  return h >= 23 && m >= 59 ? `${h} h ${mm} min ${String(s).padStart(2, '0')} s` : `${h} h ${mm}`;
}

/** Événements regroupés par période (les plus anciens rattachés à la première). */
export function eventsByPeriod(): { period: Period; events: EvoEvent[] }[] {
  return PERIODS.map((period, i) => ({
    period,
    events: EVO_EVENTS.filter((e) => (i === 0 ? e.ma > period.end : e.ma <= period.start && e.ma > period.end)).sort((a, b) => b.ma - a.ma),
  }));
}

export const durationLabel = (p: Period) => `${formatNumber(p.start - p.end, 0)} millions d’années`;
