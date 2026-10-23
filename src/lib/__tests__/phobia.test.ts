import { SPECIES } from '@/data';

import { createQuiz, type QuizMode } from '../quiz';
import { ARACHNIDA_ID, cuteFor, hidesArachnidPhoto, isArachnid } from '../phobia';

describe('mode arachnophobie', () => {
  it('reconnaît toutes les araignées des fiches', () => {
    const spiders = SPECIES.filter((s) => s.taxonomy.some((t) => t.name === 'Araneae'));
    expect(spiders.length).toBeGreaterThan(5);
    expect(spiders.every(isArachnid)).toBe(true);
  });

  it('masque les taxons arachnides et les couvertures montrant une araignée', () => {
    expect(hidesArachnidPhoto({ id: ARACHNIDA_ID })).toBe(true);
    expect(hidesArachnidPhoto({ id: 47118, ancestor_ids: [48460, 1, 47120, 245097, 47119, 47118] })).toBe(true);
    expect(hidesArachnidPhoto({ id: 1 })).toBe(true);
    expect(hidesArachnidPhoto({ id: 47158, ancestor_ids: [48460, 1, 47120, 372739, 47158] })).toBe(false);
  });

  it('choisit une image douce stable pour un même sujet', () => {
    expect(cuteFor('mygale-goliath')).toEqual(cuteFor('mygale-goliath'));
    expect(cuteFor('a').icon).toBeTruthy();
  });

  it('écarte les arachnides des quiz, même comme leurres', () => {
    for (const mode of ['quick', 'expert', 'duel', 'whoami', 'daily'] as QuizMode[]) {
      for (const seed of [1, 2, 3]) {
        const quiz = createQuiz(SPECIES, { mode, seed, hidden: isArachnid });
        for (let i = 0; i < 12; i++) {
          const q = quiz.next(i, i);
          if (!q) break;
          const ids = [...q.choices.map((c) => c.speciesId), ...q.learnIds, q.media?.speciesId].filter(Boolean);
          expect(ids.some((id) => isArachnid(SPECIES.find((s) => s.id === id)!))).toBe(false);
        }
      }
    }
  });

  it('« Me tester » sur une araignée ne pose que des questions sans image', () => {
    const quiz = createQuiz(SPECIES, { mode: 'species', seed: 4, speciesId: 'mygale-goliath', hidden: isArachnid });
    const questions = Array.from({ length: 5 }, (_, i) => quiz.next(i)).filter((q) => q !== null);
    expect(questions.length).toBeGreaterThanOrEqual(3);
    for (const q of questions) {
      expect(q.media?.type ?? 'aucune').not.toMatch(/photo|silhouette/);
      expect(['grid', 'duel']).not.toContain(q.layout);
    }
  });
});
