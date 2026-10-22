import { SPECIES } from '@/data';

import { createRng } from '../random';
import {
  article,
  buildClues,
  createQuiz,
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

  it('les duels désignent bien l’espèce à la valeur la plus élevée', () => {
    const quiz = createQuiz(SPECIES, { mode: 'duel', seed: 3 });
    for (let i = 0; i < 30; i++) {
      const q = quiz.next(i);
      if (!q) continue;
      const [a, b] = q.choices.map((c) => byId(c.id));
      const metric = q.prompt.includes('lourd')
        ? (s: typeof a) => s.stats.weight?.[1]
        : q.prompt.includes('long ?')
          ? (s: typeof a) => s.stats.length?.[1]
          : q.prompt.includes('longtemps')
            ? (s: typeof a) => s.stats.lifespan?.[1]
            : (s: typeof a) => s.stats.speed;
      const winner = (metric(a) ?? 0) > (metric(b) ?? 0) ? a : b;
      expect(q.answerId).toBe(winner.id);
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
