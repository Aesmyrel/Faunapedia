import { getSpecies } from '@/data';
import { MONTH_NAMES, SEASONS } from '@/data/seasons';

describe('ce mois-ci dans la nature', () => {
  it('couvre les douze mois', () => {
    expect(SEASONS).toHaveLength(12);
    expect(MONTH_NAMES).toHaveLength(12);
    for (const month of SEASONS) expect(month.length).toBeGreaterThanOrEqual(4);
  });

  it('ne cite que des espèces de l’application', () => {
    const missing = SEASONS.flat()
      .map((e) => e.speciesId)
      .filter((id) => id && !getSpecies(id));
    expect(missing).toEqual([]);
  });

  it('respecte les règles de rédaction', () => {
    for (const e of SEASONS.flat()) {
      expect({ titre: e.title, ok: e.text.length >= 40 && e.text.length <= 240 && !e.text.includes("'") && /[.!»]$/.test(e.text) }).toEqual({ titre: e.title, ok: true });
    }
  });
});
