import { SPECIES } from '@/data';
import { isArachnid } from '@/lib/phobia';

import {
  challengeMessage,
  challengeOutcome,
  challengeRank,
  dataVersion,
  decodeChallenge,
  encodeChallenge,
  findChallengeCode,
  formatCode,
  newChallengeSeed,
} from '../challenge';
import { createQuiz } from '../quiz';
import { createRng } from '../random';

describe('défi entre amis', () => {
  it('code et décode la graine, le score et la version', () => {
    const rng = createRng(42);
    for (let i = 0; i < 300; i++) {
      const correct = i % 11;
      const points = Math.round(correct * (100 + rng() * 300));
      const c = { seed: newChallengeSeed(rng), score: { correct, points }, data: i % 8 };
      const code = encodeChallenge(c);
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{9}$/);
      expect(decodeChallenge(code)).toEqual(c);
    }
  });

  it('tolère la saisie à la main et repère les fautes de frappe', () => {
    const c = { seed: 12345, score: { correct: 8, points: 1240 }, data: 5 };
    const code = encodeChallenge(c);
    expect(decodeChallenge(formatCode(code).toLowerCase())).toEqual(c);
    expect(decodeChallenge(` ${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)} `)).toEqual(c);
    // Une seule lettre changée : refusé dans la très grande majorité des cas.
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let accepted = 0;
    let total = 0;
    for (let i = 0; i < 9; i++) {
      for (const ch of alphabet) {
        if (ch === code[i]) continue;
        total++;
        if (decodeChallenge(code.slice(0, i) + ch + code.slice(i + 1))) accepted++;
      }
    }
    expect(accepted / total).toBeLessThan(0.005);
    expect(decodeChallenge('ABC')).toBeNull();
  });

  it('retrouve le code dans le message reçu', () => {
    const code = encodeChallenge({ seed: 777, score: { correct: 6, points: 905 }, data: 1 });
    const message = challengeMessage({ code, score: { correct: 6, points: 905 }, url: 'https://exemple.org' });
    expect(message).toContain(formatCode(code));
    expect(findChallengeCode(message)).toBe(code);
    expect(findChallengeCode('Rien à voir ici, MERCI BEAUCOUP')).toBeNull();
    // Le mot qui précède le code ne doit pas le masquer.
    expect(findChallengeCode(`Entre le code ${formatCode(code)} dans Faunapedia`)).toBe(code);
    expect(findChallengeCode(`code ${code.toLowerCase()} merci`)).toBe(code);
    expect(findChallengeCode(`le code ${code.slice(0, 3)} ${code.slice(3, 6)} ${code.slice(6)}`)).toBe(code);
  });

  it('rejette les mots ordinaires pris pour des codes', () => {
    const words = 'ENTRE CODE DANS FAUNAPEDIA RELEVE DEFI QUESTIONS REVANCHE RESULTAT POUR VOIR MEMES APPLI BIENJOUE GAGNE PERDU'.split(' ');
    let false_ = 0;
    for (const a of words) for (const b of words) if (decodeChallenge(`${a.slice(0, 5)}${b.slice(0, 4)}`) || decodeChallenge(`${a.slice(0, 3)}${b.slice(0, 6)}`)) false_++;
    expect(false_).toBe(0);
  });

  it('départage par les bonnes réponses, puis par les points', () => {
    expect(challengeOutcome({ correct: 8, points: 900 }, { correct: 7, points: 2000 })).toBe('win');
    expect(challengeOutcome({ correct: 8, points: 900 }, { correct: 8, points: 1000 })).toBe('lose');
    expect(challengeOutcome({ correct: 8, points: 900 }, { correct: 8, points: 900 })).toBe('draw');
    expect(challengeRank({ correct: 8, points: 900 }, [{ correct: 9, points: 0 }, { correct: 5, points: 0 }, { correct: 8, points: 900 }])).toBe(2);
  });

  it('les codes d’un même défi commencent pareil', () => {
    const a = encodeChallenge({ seed: 4242, score: { correct: 5, points: 700 }, data: 2 });
    const b = encodeChallenge({ seed: 4242, score: { correct: 7, points: 1500 }, data: 2 });
    expect(a.slice(0, 3)).toBe(b.slice(0, 3));
    expect(a).not.toBe(b);
  });

  it('les deux joueurs reçoivent exactement les mêmes questions, sans araignées', () => {
    const questions = () => {
      const quiz = createQuiz(SPECIES, { mode: 'challenge', seed: 98765, hidden: isArachnid });
      return Array.from({ length: 10 }, (_, i) => quiz.next(i, 0));
    };
    const a = questions();
    const b = questions();
    expect(a.every(Boolean)).toBe(true);
    expect(a.map((q) => [q?.prompt, q?.answerId, q?.choices.map((c) => c.id)])).toEqual(b.map((q) => [q?.prompt, q?.answerId, q?.choices.map((c) => c.id)]));
    const spiders = new Set(SPECIES.filter(isArachnid).map((s) => s.id));
    expect(a.flatMap((q) => q?.learnIds ?? []).some((id) => spiders.has(id))).toBe(false);
    expect(a.some((q) => q?.kind === 'sound')).toBe(false);
  });

  it('change d’empreinte quand les espèces changent', () => {
    const ids = SPECIES.map((s) => s.id);
    const versions = new Set([dataVersion(ids), dataVersion([...ids, 'nouvelle']), dataVersion(ids.slice(1)), dataVersion([...ids].reverse())]);
    expect(versions.size).toBeGreaterThan(1);
  });
});

describe('codes au hasard', () => {
  it('presque aucune suite de caractères prise au hasard ne passe pour un défi', () => {
    const rng = createRng(7);
    const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let ok = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const code = Array.from({ length: 9 }, () => alphabet[Math.floor(rng() * 32)]).join('');
      if (decodeChallenge(code)) ok++;
    }
    expect(ok / n).toBeLessThan(0.002);
  });
});
