/** Mode arachnophobie : repère les espèces et taxons dont les images sont à masquer. */
import type { Species } from '@/data/types';

/** Classe des arachnides sur iNaturalist (araignées, scorpions, solifuges, opilions…). */
export const ARACHNIDA_ID = 47119;

/**
 * Taxons non arachnides dont la photo de présentation iNaturalist montre une
 * araignée : la mosaïque du règne animal et les chélicérates.
 */
const SPIDER_COVER_TAXA = new Set([1, 245097]);

/** Les arachnides entiers sont masqués : solifuges et opilions ressemblent trop aux araignées. */
export const isArachnid = (s: Species) => s.group === 'arachnids';

/** Faut-il masquer la photo de ce taxon iNaturalist (arbre du vivant, recherche, autour de moi) ? */
export function hidesArachnidPhoto(t: { id: number; ancestor_ids?: number[] }): boolean {
  return t.id === ARACHNIDA_ID || SPIDER_COVER_TAXA.has(t.id) || (t.ancestor_ids ?? []).includes(ARACHNIDA_ID);
}

const CUTE_ICONS = ['panda', 'penguin', 'owl', 'rabbit', 'koala', 'duck', 'cat', 'turtle', 'dolphin', 'teddy-bear'] as const;
const PASTELS = ['#F9A8D4', '#93C5FD', '#86EFAC', '#FCD34D', '#C4B5FD', '#FDBA74', '#67E8F9'] as const;

/** Image douce de remplacement, toujours la même pour un même sujet. */
export function cuteFor(seed: string): { icon: (typeof CUTE_ICONS)[number]; color: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return { icon: CUTE_ICONS[h % CUTE_ICONS.length], color: PASTELS[(h >>> 4) % PASTELS.length] };
}
