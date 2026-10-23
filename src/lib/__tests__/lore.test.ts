import { getSpecies, SPECIES } from '@/data';
import { LORE } from '@/data/curated/lore';
import { COLLECTIONS } from '@/data/reference';

import { normalize } from '../format';
import { createQuiz, gender, nameStems } from '../quiz';

describe('histoire et mythologie', () => {
  it('ne concerne que des espèces existantes, en nombre suffisant', () => {
    expect(Object.keys(LORE).filter((id) => !getSpecies(id))).toEqual([]);
    expect(SPECIES.filter((s) => s.lore?.length).length).toBeGreaterThanOrEqual(60);
  });

  it('respecte les règles de rédaction', () => {
    for (const [id, stories] of Object.entries(LORE)) {
      for (const { culture, text } of stories) {
        const where = `${id} : ${text.slice(0, 40)}`;
        expect({ where, culture: culture.length > 2 }).toEqual({ where, culture: true });
        expect({ where, length: text.length >= 40 && text.length <= 320 }).toEqual({ where, length: true });
        expect({ where, apostrophe: !text.includes("'") }).toEqual({ where, apostrophe: true });
        expect({ where, ponctuation: /[.!?»]$/.test(text) }).toEqual({ where, ponctuation: true });
        const s = getSpecies(id)!;
        const wrongPronoun = gender(s) === 'f' ? /^Ils? /.test(text) : /^Elles? /.test(text);
        expect({ where, wrongPronoun }).toEqual({ where, wrongPronoun: false });
      }
    }
  });

  it('alimente une collection dédiée', () => {
    const legends = COLLECTIONS.find((c) => c.id === 'legendes');
    expect(SPECIES.filter((s) => legends?.filter(s)).length).toBe(Object.keys(LORE).length);
  });

  it('pose des questions de quiz qui ne trahissent pas la réponse', () => {
    let count = 0;
    for (const s of SPECIES.filter((x) => x.lore?.length)) {
      const quiz = createQuiz(SPECIES, { mode: 'species', seed: 9, speciesId: s.id });
      for (let i = 0; i < 6; i++) {
        const q = quiz.next(i);
        if (q?.kind !== 'lore') continue;
        count++;
        const masked = normalize(q.subject?.text ?? '');
        expect({ id: s.id, revele: nameStems(s).filter((st) => masked.includes(st)) }).toEqual({ id: s.id, revele: [] });
        expect(q.choices.every((c) => gender(getSpecies(c.id)!) === gender(s))).toBe(true);
      }
    }
    expect(count).toBeGreaterThan(20);
  });
});
