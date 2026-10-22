/** Emprise d’une espèce pour les comparaisons d’échelle. */
import type { GroupId, Species } from '@/data/types';

import { formatLength } from './format';

export interface AnimalBox {
  /** Emprise dessinée (cm), une fois la silhouette éventuellement couchée. */
  width: number;
  height: number;
  /** Mesure qui fonde l’échelle, pour la légende. */
  basis: string;
  /** Silhouette verticale vue de dessus (crocodile, requin…), couchée pour suivre la longueur. */
  rotated: boolean;
  /** Animal serpentiforme : dessiné étiré sur toute sa longueur plutôt qu’enroulé. */
  stretched: boolean;
}

/** Taxons serpentiformes : leur silhouette enroulée ne dit rien de leur longueur. */
const ELONGATED_TAXA = new Set(['Serpentes', 'Anguilliformes', 'Gymnophiona']);

/** Groupes dont une silhouette verticale correspond à une posture réelle (debout, perché, suspendu). */
const UPRIGHT_GROUPS: readonly GroupId[] = ['mammals', 'birds', 'cnidarians'];

/** Autres espèces réellement verticales. */
const UPRIGHT_SPECIES = new Set(['hippocampe-mouchete', 'ver-tubicole-geant', 'corbeille-de-venus']);

/** Épaisseur du corps d’un serpent étiré, rapportée à sa longueur. */
export const STRETCHED_THICKNESS = 0.035;

/**
 * La plus grande mesure (longueur ou hauteur) est reportée sur le plus grand
 * côté de la silhouette : l’animal n’est jamais dessiné plus grand que ses
 * mensurations, quelle que soit sa pose.
 */
export function animalBox(s: Species): AnimalBox | null {
  const { length, height, wingspan } = s.stats;
  const len = length?.[1] ?? 0;
  const tall = height?.[1] ?? 0;

  if (len && s.taxonomy.some((t) => ELONGATED_TAXA.has(t.name))) {
    return { width: len, height: len * STRETCHED_THICKNESS * 3, basis: `longueur ${formatLength(len)}`, rotated: false, stretched: true };
  }

  const ratio = s.silhouette?.ratio ?? 1.6;
  const measure = Math.max(len, tall) || (wingspan?.[1] ?? 0);
  if (!measure) return null;
  const basis =
    len && len >= tall ? `longueur ${formatLength(len)}` : tall ? `hauteur ${formatLength(tall)}` : `envergure ${formatLength(measure)}`;

  if (ratio >= 1) return { width: measure, height: measure / ratio, basis, rotated: false, stretched: false };
  const lieFlat = ratio < 0.7 && measure >= 30 && !UPRIGHT_GROUPS.includes(s.group) && !UPRIGHT_SPECIES.has(s.id);
  if (lieFlat) return { width: measure, height: measure * ratio, basis, rotated: true, stretched: false };
  return { width: measure * ratio, height: measure, basis, rotated: false, stretched: false };
}

/**
 * Corps de serpent ondulant, effilé vers la queue (à gauche), tête à droite.
 * Tracé dans une boîte `width` × `height` (unités quelconques).
 */
export function stretchedBodyPath(width: number, height: number): string {
  const thick = height / 3;
  const amp = (height - thick) / 2;
  const mid = height / 2;
  const steps = 48;
  const upper: string[] = [];
  const lower: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * width * 0.94;
    const y = mid + amp * Math.sin(t * Math.PI * 3) * (0.35 + 0.65 * t);
    const half = (thick / 2) * (0.12 + 0.88 * Math.sqrt(t));
    upper.push(`${x.toFixed(2)} ${(y - half).toFixed(2)}`);
    lower.push(`${x.toFixed(2)} ${(y + half).toFixed(2)}`);
  }
  // Tête : ellipse prolongeant le cou.
  const neckY = mid + amp * Math.sin(Math.PI * 3);
  const headRx = width * 0.035;
  const headRy = thick * 0.62;
  const headX = width * 0.94 + headRx * 0.6;
  const head = `M${(headX - headRx).toFixed(2)} ${neckY.toFixed(2)}a${headRx.toFixed(2)} ${headRy.toFixed(2)} 0 1 0 ${(headRx * 2).toFixed(2)} 0a${headRx.toFixed(2)} ${headRy.toFixed(2)} 0 1 0 ${(-headRx * 2).toFixed(2)} 0z`;
  return `M${upper.join('L')}L${lower.reverse().join('L')}z${head}`;
}
