import { SPECIES } from '@/data';
import { buildTree, groupSectors, layoutTree, type PhyloNode } from '@/lib/phylo';

/** L’arbre des espèces, calculé une fois. */
export const TREE = layoutTree(buildTree(SPECIES));

/** Le plus grand secteur de chaque groupe, pour ses pastilles et son zoom. */
export const SECTORS = groupSectors(TREE);

/** Ordres, nommés sur le pourtour aux zooms intermédiaires. */
export const ORDERS: PhyloNode[] = [];
const collect = (n: PhyloNode) => (n.rank === 'order' ? ORDERS.push(n) : n.children.forEach(collect));
collect(TREE.root);

/** Écart angulaire entre deux espèces voisines. */
export const LEAF_STEP = TREE.leaves[1].angle - TREE.leaves[0].angle;

/** Zooms à partir desquels on nomme les ordres, puis les espèces. */
export const ORDER_ZOOM = 1.4;
/** Au-delà, les pastilles des groupes s’effacent. */
export const BADGE_ZOOM = 1.45;
export const SPECIES_ZOOM = 3.2;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 9;
