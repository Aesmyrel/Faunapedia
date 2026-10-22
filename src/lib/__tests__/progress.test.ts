import { SPECIES, SPECIES_BY_GROUP } from '@/data';

import { BADGES, dueReviews, levelFromXp, MASTERED_BOX, newlyUnlocked, type ProgressSnapshot, reviewAfter, xpForLevel } from '../progress';

const empty: ProgressSnapshot = {
  seen: {},
  favorites: [],
  xp: 0,
  stats: { quizzes: 0, answered: 0, correct: 0, bestCombo: 0, perfects: 0, bestCorrect: {}, mastered: 0 },
  daily: { streak: 0, best: 0 },
  counters: { taxa: 0, compares: 0, nearby: 0, night: 0 },
};

describe('niveaux', () => {
  it('commence au niveau 1 et progresse avec l’XP', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(xpForLevel(2)).level).toBe(2);
    expect(levelFromXp(xpForLevel(10) - 1).level).toBe(9);
    expect(levelFromXp(xpForLevel(30)).rank.title).toBe('Héritier de Linné');
  });

  it('a des seuils strictement croissants', () => {
    for (let l = 1; l < 60; l++) expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l));
  });

  it('calcule la progression dans le niveau courant', () => {
    const info = levelFromXp(xpForLevel(5) + 10);
    expect(info.current).toBe(10);
    expect(info.progress).toBeGreaterThan(0);
    expect(info.progress).toBeLessThan(1);
  });
});

describe('révision espacée', () => {
  const now = 1_000_000;

  it('met une espèce ratée en révision immédiate', () => {
    expect(reviewAfter(undefined, false, now)).toEqual({ box: 0, due: now });
  });

  it('ignore une bonne réponse sur une espèce hors révision', () => {
    expect(reviewAfter(undefined, true, now)).toBeNull();
  });

  it('espace les révisions puis considère l’espèce maîtrisée', () => {
    let item = reviewAfter(undefined, false, now);
    for (let i = 1; i < MASTERED_BOX; i++) {
      item = reviewAfter(item!, true, now);
      expect(item?.box).toBe(i);
      expect(item!.due).toBeGreaterThan(now);
    }
    expect(reviewAfter(item!, true, now)).toBeNull();
  });

  it('liste les révisions dues, les plus fragiles d’abord', () => {
    const due = dueReviews({ a: { box: 2, due: 5 }, b: { box: 0, due: 9 }, c: { box: 1, due: 99_999_999 } }, 100);
    expect(due).toEqual(['b', 'a']);
  });
});

describe('badges', () => {
  it('a des identifiants uniques', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });

  it('ne débloque rien au départ', () => {
    expect(newlyUnlocked(empty, {})).toEqual([]);
  });

  it('débloque « Premiers pas » et un badge de spécialiste', () => {
    const seen = Object.fromEntries(SPECIES_BY_GROUP.cnidarians.map((s) => [s.id, 1]));
    const unlocked = newlyUnlocked({ ...empty, seen }, {});
    expect(unlocked).toContain('premiers-pas');
    expect(unlocked).toContain('groupe-cnidarians');
    expect(unlocked).not.toContain('omniscient');
  });

  it('ne redonne pas un badge déjà obtenu', () => {
    const seen = { [SPECIES[0].id]: 1 };
    expect(newlyUnlocked({ ...empty, seen }, { 'premiers-pas': 1 })).not.toContain('premiers-pas');
  });
});
