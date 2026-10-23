/**
 * Défi entre amis : 10 questions tirées d’une même graine, donc identiques
 * pour les deux joueurs. Le défi tient dans un code de 9 caractères qui porte
 * la graine et le score du joueur qui l’envoie ; aucun serveur n’est requis.
 */

export const CHALLENGE_LENGTH = 10;

export interface ChallengeScore {
  correct: number;
  points: number;
}

export interface Challenge {
  /** Graine des questions (18 bits). */
  seed: number;
  /** Score de celui qui envoie le code. */
  score: ChallengeScore;
  /** Empreinte des données de l’app (3 bits) : deux versions différentes peuvent tirer des questions différentes. */
  data: number;
}

export type ChallengeOutcome = 'win' | 'lose' | 'draw';

/** Alphabet de Crockford : sans I, L, O ni U, pour éviter les confusions à la saisie. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SEED_BITS = 18;
const MAX_POINTS = 4095;
export const CODE_LENGTH = 9;

function fnv(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Empreinte (3 bits) des espèces et du moteur de quiz. Augmenter `ENGINE` à
 * chaque changement des générateurs de questions.
 */
const ENGINE = 1;
export function dataVersion(speciesIds: readonly string[]): number {
  return fnv(`${ENGINE}|${speciesIds.join(',')}`) & 7;
}

export function newChallengeSeed(random: () => number): number {
  return Math.floor(random() * 2 ** SEED_BITS);
}

const encode15 = (n: number) => Array.from({ length: 3 }, (_, i) => ALPHABET[(n >>> (10 - i * 5)) & 31]).join('');
const checksum = (seed: number, correct: number, points: number, data: number) => fnv(`${seed}-${correct}-${points}-${data}`) & 255;
/** Masques tirés du premier bloc : les codes d’un même défi commencent pareil, la suite est brouillée. */
const masks = (head: number) => {
  const h = fnv(`defi-${head}`);
  return [h & 0x7fff, (h >>> 15) & 0x7fff];
};

/**
 * Code de 9 caractères (45 bits), à afficher avec `formatCode` :
 * 18 bits de graine, 12 de points, 4 de bonnes réponses, 3 de version et 8 de contrôle.
 */
export function encodeChallenge({ seed, score, data }: Challenge): string {
  const correct = Math.max(0, Math.min(15, Math.round(score.correct)));
  const points = Math.max(0, Math.min(MAX_POINTS, Math.round(score.points)));
  const s = seed & (2 ** SEED_BITS - 1);
  const d = data & 7;
  const head = s >>> 3;
  const [m2, m3] = masks(head);
  const middle = ((s & 7) << 12) | points;
  const tail = (correct << 11) | (d << 8) | checksum(s, correct, points, d);
  return encode15(head) + encode15(middle ^ m2) + encode15(tail ^ m3);
}

/** Lit un code tapé à la main : casse, tirets, espaces et lettres ambiguës tolérés. */
export function decodeChallenge(input: string): Challenge | null {
  const clean = input
    .toUpperCase()
    .replace(/[\s\-–—.]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (clean.length !== CODE_LENGTH) return null;
  const blocks = [0, 0, 0];
  for (let i = 0; i < CODE_LENGTH; i++) {
    const v = ALPHABET.indexOf(clean[i]);
    if (v < 0) return null;
    blocks[Math.floor(i / 3)] = (blocks[Math.floor(i / 3)] << 5) | v;
  }
  const [head, rawMiddle, rawTail] = blocks;
  const [m2, m3] = masks(head);
  const middle = rawMiddle ^ m2;
  const tail = rawTail ^ m3;
  const seed = (head << 3) | (middle >>> 12);
  const points = middle & 0xfff;
  const correct = tail >>> 11;
  const data = (tail >>> 8) & 7;
  if ((tail & 255) !== checksum(seed, correct, points, data)) return null;
  if (!plausible(correct, points)) return null;
  return { seed, score: { correct, points }, data };
}

/** Chaque bonne réponse rapporte entre 100 et 400 points : un code hors de ces bornes est faux. */
function plausible(correct: number, points: number): boolean {
  return correct <= CHALLENGE_LENGTH && points >= correct * 100 && points <= correct * 400;
}

export const formatCode = (code: string) => `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;

/**
 * Retrouve un code de défi valide dans un message collé en entier. Le format
 * « XXX-XXX-XXX » des messages passe en premier ; toutes les positions sont
 * essayées (un mot voisin ne doit pas « manger » un bout du code).
 */
export function findChallengeCode(text: string): string | null {
  const upper = text.toUpperCase();
  const patterns = [
    /(?=(?<![0-9A-Z])([0-9A-Z]{3})-([0-9A-Z]{3})-([0-9A-Z]{3})(?![0-9A-Z]))/g,
    /(?=(?<![0-9A-Z])([0-9A-Z]{3})[\s-]?([0-9A-Z]{3})[\s-]?([0-9A-Z]{3})(?![0-9A-Z]))/g,
  ];
  for (const pattern of patterns) {
    for (const m of upper.matchAll(pattern)) {
      const code = m[1] + m[2] + m[3];
      if (decodeChallenge(code)) return code;
    }
  }
  return null;
}

/** Place parmi les adversaires (1 = premier ; les égalités partagent la place). */
export function challengeRank(mine: ChallengeScore, rivals: readonly ChallengeScore[]): number {
  return 1 + rivals.filter((r) => challengeOutcome(mine, r) === 'lose').length;
}

/** Plus de bonnes réponses gagne ; à égalité, les points (rapidité, séries) départagent. */
export function challengeOutcome(mine: ChallengeScore, rival: ChallengeScore): ChallengeOutcome {
  const diff = mine.correct - rival.correct || mine.points - rival.points;
  return diff > 0 ? 'win' : diff < 0 ? 'lose' : 'draw';
}

const scoreText = (s: ChallengeScore, nbsp = ' ') =>
  `${s.correct}/${CHALLENGE_LENGTH} (${String(s.points).replace(/\B(?=(\d{3})+(?!\d))/g, nbsp)}${nbsp}pts)`;

/** Message envoyé avec le code : un nouveau défi, ou la réponse à celui d’un autre. */
export function challengeMessage({ code, score, rival, url }: { code: string; score: ChallengeScore; rival?: ChallengeScore; url?: string }): string {
  const lines = rival
    ? [
        `🦉 J’ai relevé ton défi Faunapedia : ${scoreText(score)} contre ${scoreText(rival)}. ${
          { win: 'Je gagne !', lose: 'Bien joué, tu gagnes…', draw: 'Égalité parfaite !' }[challengeOutcome(score, rival)]
        }`,
        `Entre le code ${formatCode(code)} dans Faunapedia (Quiz › Défier un ami) pour voir le résultat… et prendre ta revanche.`,
      ]
    : [
        `🦉 Défi Faunapedia : j’ai fait ${scoreText(score)} à ce quiz animalier. Tu fais mieux ? Les mêmes ${CHALLENGE_LENGTH} questions pour nous deux.`,
        `Dans Faunapedia, va dans Quiz › Défier un ami et entre le code : ${formatCode(code)}`,
      ];
  if (url) lines.push(`Pas encore l’appli ? ${url}`);
  return lines.join('\n\n');
}
