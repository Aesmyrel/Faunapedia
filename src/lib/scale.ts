/** Emprise d’une espèce pour les comparaisons d’échelle. */
import type { GroupId, Species } from '@/data/types';

import { formatLength } from './format';

export interface AnimalBox {
  /** Emprise dessinée (cm), une fois la silhouette éventuellement couchée. */
  width: number;
  height: number;
  /** Mesure qui fonde l’échelle, pour la légende (« ≈ 84 cm de long »). */
  basis: string;
  /** Silhouette verticale vue de dessus (crocodile, requin…), couchée pour suivre la longueur. */
  rotated: boolean;
  /** Silhouette vue de dessus, à signaler dans la légende. */
  topView: boolean;
  /** Animal serpentiforme : dessiné étiré sur toute sa longueur plutôt qu’enroulé. */
  stretched: boolean;
}

/** Taxons serpentiformes : leur silhouette enroulée ne dit rien de leur longueur. */
const ELONGATED_TAXA = new Set(['Serpentes', 'Anguilliformes', 'Gymnophiona']);

/** Groupes dont une silhouette verticale correspond à une posture réelle (debout, perché, suspendu). */
const UPRIGHT_GROUPS: readonly GroupId[] = ['mammals', 'birds', 'cnidarians'];

/** Autres espèces réellement verticales. */
const UPRIGHT_SPECIES = new Set(['hippocampe-mouchete', 'ver-tubicole-geant', 'corbeille-de-venus']);

/** Silhouettes vues de dessus qui ne sont pas verticales (repérées à l’œil). */
const TOP_VIEW_SPECIES = new Set(['dragon-de-komodo', 'raie-manta']);

/** Épaisseur du corps d’un serpent étiré, rapportée à sa longueur. */
export const STRETCHED_THICKNESS = 0.035;

/** Taille d’un adulte moyen : milieu de l’intervalle, pour ne pas dessiner que des records. */
const typical = (r?: readonly [number, number]) => (r ? (r[0] + r[1]) / 2 : 0);

/**
 * Emprise de l’animal à l’échelle, à partir de sa silhouette et de ses mensurations.
 *
 * - La longueur se reporte sur le plus grand côté de la silhouette (largeur pour
 *   un animal de profil, hauteur pour un oiseau perché ou un ours debout).
 * - Si la hauteur au garrot est connue, elle borne le dessin : selon la pose,
 *   la queue ou le cou faussent la longueur, rarement la hauteur.
 * - Oiseau ou chauve-souris en vol : l’envergure fait la largeur ; de même pour
 *   les pattes étendues d’un crabe-araignée ou d’une mygale.
 * - Silhouette vue de dessus (crocodile, requin…) : couchée pour suivre la longueur.
 * - Serpents et anguilles : dessinés étirés.
 */
export function animalBox(s: Species): AnimalBox | null {
  const len = typical(s.stats.length);
  const tall = typical(s.stats.height);
  const span = typical(s.stats.wingspan);
  const box = (width: number, height: number, basis: string, rotated = false): AnimalBox => ({
    width,
    height,
    basis,
    rotated,
    topView: rotated || TOP_VIEW_SPECIES.has(s.id),
    stretched: false,
  });

  if (len && s.taxonomy.some((t) => ELONGATED_TAXA.has(t.name))) {
    return { width: len, height: len * STRETCHED_THICKNESS * 3, basis: `≈ ${formatLength(len)} de long`, rotated: false, topView: false, stretched: true };
  }

  const ratio = s.silhouette?.ratio ?? 1.6;
  const flier = s.group === 'birds' || s.taxonomy.some((t) => t.name === 'Chiroptera');
  if (span && flier && ratio >= 1.8) return box(span, span / ratio, `≈ ${formatLength(span)} d’envergure`);
  // Crabe-araignée, mygale : la silhouette pattes étendues se mesure à l’envergure.
  if (span && !flier && len && span > len * 2) {
    return ratio >= 1 ? box(span, span / ratio, `≈ ${formatLength(span)} pattes étendues`) : box(span * ratio, span, `≈ ${formatLength(span)} pattes étendues`);
  }

  if (len) {
    const lieFlat = ratio < 0.7 && len >= 30 && !UPRIGHT_GROUPS.includes(s.group) && !UPRIGHT_SPECIES.has(s.id);
    if (lieFlat) return box(len, len * ratio, `≈ ${formatLength(len)} de long`, true);
    const fromLength = ratio >= 1 ? len / ratio : len;
    if (!tall || fromLength <= tall) return box(fromLength * ratio, fromLength, `≈ ${formatLength(len)} de long`);
  }
  if (tall) return box(tall * ratio, tall, `≈ ${formatLength(tall)} de haut`);
  if (span) return ratio >= 1 ? box(span, span / ratio, `≈ ${formatLength(span)} d’envergure`) : box(span * ratio, span, `≈ ${formatLength(span)} d’envergure`);
  return null;
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
