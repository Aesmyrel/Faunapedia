import type { CuratedSpecies } from '../types';
import { amphibians } from './amphibians';
import { birds } from './birds';
import { fishes } from './fishes';
import { insects } from './insects';
import { arachnids, cnidarians, crustaceans, echinoderms, molluscs, others } from './invertebrates';
import { mammals } from './mammals';
import { reptiles } from './reptiles';

/** Toutes les fiches rédigées à la main, dans l’ordre des groupes. */
export const curatedSpecies: CuratedSpecies[] = [
  ...mammals,
  ...birds,
  ...reptiles,
  ...amphibians,
  ...fishes,
  ...insects,
  ...arachnids,
  ...crustaceans,
  ...molluscs,
  ...cnidarians,
  ...echinoderms,
  ...others,
];
