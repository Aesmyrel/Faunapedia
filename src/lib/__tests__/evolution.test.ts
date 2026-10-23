import { getSpecies } from '@/data';
import { EVO_EVENTS, PERIODS } from '@/data/evolution';

import { clockTime, eventsByPeriod, formatAge } from '../evolution';

describe('frise de l’évolution', () => {
  it('enchaîne les périodes sans trou ni chevauchement jusqu’à aujourd’hui', () => {
    for (let i = 1; i < PERIODS.length; i++) expect(PERIODS[i].start).toBe(PERIODS[i - 1].end);
    expect(PERIODS[PERIODS.length - 1].end).toBe(0);
  });

  it('ne cite que des espèces de l’application', () => {
    const missing = EVO_EVENTS.flatMap((e) => e.speciesIds ?? []).filter((id) => !getSpecies(id));
    expect(missing).toEqual([]);
  });

  it('range chaque événement dans une seule période, du plus ancien au plus récent', () => {
    const grouped = eventsByPeriod();
    expect(grouped.reduce((n, g) => n + g.events.length, 0)).toBe(EVO_EVENTS.length);
    for (const { period, events } of grouped.slice(1)) {
      for (const e of events) expect(e.ma <= period.start && e.ma > period.end).toBe(true);
    }
  });

  it('formate les âges et l’analogie des 24 heures', () => {
    expect(formatAge({ ma: 375 })).toBe('≈ 375 Ma');
    expect(formatAge({ ma: 0.3 })).toBe('≈ 300\u202f000 ans');
    expect(formatAge({ ma: 0.00009, date: '1936' })).toBe('1936');
    expect(clockTime(66)).toBe('21 h 04');
    expect(clockTime(225)).toBe('14 h 00');
    expect(clockTime(0.3)).toBe('23 h 59 min 12 s');
  });
});
