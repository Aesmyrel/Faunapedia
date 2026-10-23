import { SPECIES } from '@/data';

import { createRng } from '../random';
import {
  article,
  buildClues,
  createQuiz,
  gender,
  maskName,
  MODES,
  ofSpecies,
  pickDistractors,
  type Question,
  type QuizMode,
  scoreAnswer,
  withArticle,
} from '../quiz';

const byId = (id: string) => {
  const s = SPECIES.find((x) => x.id === id);
  if (!s) throw new Error(`espèce inconnue : ${id}`);
  return s;
};

function playAll(mode: QuizMode, seed: number, count = 25): Question[] {
  const quiz = createQuiz(SPECIES, { mode, seed, difficulty: 2 });
  const out: Question[] = [];
  for (let i = 0; i < (MODES[mode].length ?? count); i++) {
    const q = quiz.next(i, i);
    if (!q) break;
    out.push(q);
  }
  return out;
}

function assertValid(q: Question) {
  const ids = q.choices.map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids).toContain(q.answerId);
  expect(q.choices.length).toBeGreaterThanOrEqual(2);
  expect(q.explanation.length).toBeGreaterThan(5);
  for (const id of q.learnIds) expect(SPECIES.some((s) => s.id === id)).toBe(true);
  const labels = q.choices.map((c) => c.label);
  expect(new Set(labels).size).toBe(labels.length);
}

describe('quiz', () => {
  const modes: QuizMode[] = ['daily', 'quick', 'whoami', 'duel', 'survival', 'timed', 'expert', 'silhouettes', 'sounds'];

  it.each(modes)('génère des questions valides en mode %s', (mode) => {
    for (const seed of [1, 42, 2026]) {
      const questions = playAll(mode, seed);
      expect(questions.length).toBeGreaterThan(0);
      questions.forEach(assertValid);
      if (MODES[mode].length) expect(questions).toHaveLength(MODES[mode].length as number);
    }
  });

  it('est déterministe pour une même graine (défi du jour identique pour tous)', () => {
    const a = playAll('daily', 20261022).map((q) => [q.kind, q.answerId]);
    const b = playAll('daily', 20261022).map((q) => [q.kind, q.answerId]);
    expect(a).toEqual(b);
  });

  it('varie les types de questions dans une partie standard', () => {
    const kinds = new Set(playAll('quick', 7).map((q) => q.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(4);
  });

  it('ne répète pas la même espèce cible dans une partie de 10 questions', () => {
    const targets = playAll('quick', 99).map((q) => q.learnIds[0]);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('centre le mode « Me tester » sur l’espèce choisie', () => {
    const quiz = createQuiz(SPECIES, { mode: 'species', seed: 5, speciesId: 'axolotl' });
    for (let i = 0; i < 5; i++) {
      const q = quiz.next(i);
      expect(q).not.toBeNull();
      expect(q?.learnIds).toContain('axolotl');
    }
  });

  it('les duels sont sans appel : le gagnant domine sur toute la fourchette', () => {
    for (const seed of [3, 11, 42, 97, 1234]) {
      const quiz = createQuiz(SPECIES, { mode: 'duel', seed });
      for (let i = 0; i < 30; i++) {
        const q = quiz.next(i, i);
        if (!q) continue;
        const [a, b] = q.choices.map((c) => byId(c.id));
        const range = (s: typeof a): readonly [number, number] | undefined =>
          q.prompt.includes('lourd')
            ? s.stats.weight
            : q.prompt.includes('long ?')
              ? s.stats.length
              : q.prompt.includes('longtemps')
                ? s.stats.lifespan
                : s.stats.speed
                  ? [s.stats.speed, s.stats.speed]
                  : undefined;
        const [winner, loser] = q.answerId === a.id ? [a, b] : [b, a];
        const [w, l] = [range(winner), range(loser)];
        expect(w && l).toBeTruthy();
        expect({ q: q.explanation, ok: w![0] >= l![0] && w![1] > l![1] }).toEqual({ q: q.explanation, ok: true });
      }
    }
  });

  it('ne propose jamais un régime alimentaire qui serait juste lui aussi', () => {
    const animal = ['carnivore', 'piscivore', 'insectivore', 'myrmecophage', 'charognard', 'hematophage', 'parasite'];
    const vegetal = ['herbivore', 'folivore', 'frugivore', 'granivore', 'nectarivore'];
    for (const s of SPECIES) {
      const quiz = createQuiz([s, ...SPECIES.filter((o) => o.id !== s.id)], { mode: 'species', seed: 5, speciesId: s.id });
      for (let i = 0; i < 5; i++) {
        const q = quiz.next(i);
        if (q?.kind !== 'diet') continue;
        for (const c of q.choices.filter((c) => c.id !== q.answerId)) {
          expect(s.diet).not.toContain(c.id);
          const sameFamily = (fam: string[]) => fam.includes(c.id) && s.diet.some((d) => fam.includes(d));
          expect({ id: s.id, leurre: c.id, ambigu: sameFamily(animal) || sameFamily(vegetal) }).toEqual({ id: s.id, leurre: c.id, ambigu: false });
        }
      }
    }
  });

  it('les questions à texte ne trahissent pas la réponse par le genre des leurres', () => {
    for (const mode of ['quick', 'whoami', 'expert'] as QuizMode[]) {
      for (const seed of [1, 2, 3, 4, 5]) {
        for (const q of playAll(mode, seed, 15)) {
          if (q.kind !== 'fact' && q.kind !== 'record' && q.kind !== 'clues') continue;
          const g = gender(byId(q.answerId));
          expect(q.choices.every((c) => gender(byId(c.id)) === g)).toBe(true);
        }
      }
    }
  });

  it('les leurres « expert » sont des proches parents', () => {
    const lion = byId('lion');
    const rng = createRng(1);
    const d = pickDistractors(rng, lion, SPECIES, 3, 3);
    expect(d).toHaveLength(3);
    expect(d.filter((s) => s.group === 'mammals').length).toBeGreaterThanOrEqual(2);
  });
});

describe('textes', () => {
  it('masque le nom de l’espèce dans les indices', () => {
    const tigre = byId('tigre');
    expect(maskName('Le tigre de Sibérie (Panthera tigris) est un tigre.', tigre)).not.toMatch(/tigre|Panthera/i);
    const loutre = byId('loutre-de-mer');
    expect(maskName('La loutre de mer utilise des pierres.', loutre)).not.toMatch(/loutre/i);
  });

  it('choisit le bon article', () => {
    expect(withArticle(byId('lion'))).toBe('le Lion');
    expect(withArticle(byId('axolotl'))).toBe('l’Axolotl');
    expect(withArticle(byId('salamandre-tachetee'))).toBe('la Salamandre tachetée');
    expect(withArticle(byId('herisson-d-europe'))).toBe('le Hérisson d’Europe');
    expect(withArticle(byId('hippopotame'))).toBe('l’Hippopotame');
    expect(article(byId('panthere-des-neiges'))).toBe('la');
    expect(ofSpecies(byId('lion'))).toBe('du Lion');
    expect(ofSpecies(byId('orque'))).toBe('de l’Orque');
    expect(withArticle(byId('loutre-de-mer'))).toBe('la Loutre de mer');
    expect(withArticle(byId('fourmi-legionnaire'))).toBe('la Fourmi légionnaire');
    expect(gender(byId('hyene-tachetee'))).toBe('f');
    expect(gender(byId('aigle-royal'))).toBe('m');
  });

  it('accorde les anecdotes au genre du nom affiché', () => {
    const mismatches = SPECIES.flatMap((s) =>
      [...s.facts, s.record ?? '']
        .filter((f) => (gender(s) === 'f' ? /^Ils? /.test(f) : /^Elles? /.test(f)))
        .map((f) => `${s.id} : ${f}`),
    );
    expect(mismatches).toEqual([]);
  });

  it('produit des indices progressifs sans révéler le nom', () => {
    for (const s of SPECIES.slice(0, 80)) {
      const clues = buildClues(s);
      expect(clues.length).toBeGreaterThanOrEqual(4);
      const head = s.name.split(' ')[0];
      if (head.length >= 4) for (const c of clues) expect(c.toLowerCase()).not.toContain(` ${head.toLowerCase()} `);
    }
  });
});

describe('score', () => {
  it('récompense la rapidité, la difficulté et les séries', () => {
    const slow = scoreAnswer({ correct: true, difficulty: 1, elapsedMs: 15000, combo: 0 });
    const fast = scoreAnswer({ correct: true, difficulty: 1, elapsedMs: 1000, combo: 0 });
    const hard = scoreAnswer({ correct: true, difficulty: 3, elapsedMs: 15000, combo: 0 });
    const combo = scoreAnswer({ correct: true, difficulty: 1, elapsedMs: 15000, combo: 5 });
    expect(slow.points).toBe(100);
    expect(fast.points).toBeGreaterThan(slow.points);
    expect(hard.points).toBeGreaterThan(slow.points);
    expect(combo.points).toBe(150);
    expect(scoreAnswer({ correct: false, difficulty: 3, elapsedMs: 0, combo: 9 }).points).toBe(0);
  });

  it('pénalise les indices utilisés', () => {
    const one = scoreAnswer({ correct: true, difficulty: 2, elapsedMs: 20000, combo: 0, cluesUsed: 1 });
    const five = scoreAnswer({ correct: true, difficulty: 2, elapsedMs: 20000, combo: 0, cluesUsed: 5 });
    expect(five.points).toBeLessThan(one.points);
  });
});
