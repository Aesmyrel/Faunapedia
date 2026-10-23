import { SPECIES } from '@/data';
import { type ChallengeScore, dataVersion, encodeChallenge } from '@/lib/challenge';

/** Empreinte des données de cette version de l’app. */
export const DATA_VERSION = dataVersion(SPECIES.map((s) => s.id));

/** Code à envoyer pour un défi joué. */
export const codeFor = (seed: number, score: ChallengeScore) => encodeChallenge({ seed, score, data: DATA_VERSION });
