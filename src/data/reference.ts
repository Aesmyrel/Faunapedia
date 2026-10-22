import type { Activity, Diet, GroupId, Habitat, IucnStatus, Region, Social, Species, Tag } from './types';

export type IconSet = 'mci' | 'fa6' | 'ion';
export interface IconRef {
  set: IconSet;
  name: string;
}

export interface GroupInfo {
  id: GroupId;
  label: string;
  singular: string;
  /** Taxon de référence sur iNaturalist (pour l’arbre du vivant). */
  inatId: number;
  latin: string;
  color: string;
  icon: IconRef;
  /** Nombre approximatif d’espèces décrites. */
  described: string;
  blurb: string;
}

export const GROUPS: Record<GroupId, GroupInfo> = {
  mammals: {
    id: 'mammals',
    label: 'Mammifères',
    singular: 'Mammifère',
    inatId: 40151,
    latin: 'Mammalia',
    color: '#F5A524',
    icon: { set: 'fa6', name: 'paw' },
    described: '≈ 6 700',
    blurb:
      'Vertébrés à poils qui allaitent leurs petits. Des monotrèmes ovipares aux baleines géantes, ils occupent tous les milieux de la planète.',
  },
  birds: {
    id: 'birds',
    label: 'Oiseaux',
    singular: 'Oiseau',
    inatId: 3,
    latin: 'Aves',
    color: '#38BDF8',
    icon: { set: 'fa6', name: 'crow' },
    described: '≈ 11 000',
    blurb:
      'Seuls survivants des dinosaures, les oiseaux sont des reptiles à plumes. Leur diversité de formes, de chants et de migrations est sans égale.',
  },
  reptiles: {
    id: 'reptiles',
    label: 'Reptiles',
    singular: 'Reptile',
    inatId: 26036,
    latin: 'Reptilia',
    color: '#84CC16',
    icon: { set: 'mci', name: 'snake' },
    described: '≈ 12 000',
    blurb:
      'Lézards, serpents, tortues, crocodiles et sphénodon. Au sens classique, ce groupe est paraphylétique : les oiseaux en font partie dans l’arbre de l’évolution.',
  },
  amphibians: {
    id: 'amphibians',
    label: 'Amphibiens',
    singular: 'Amphibien',
    inatId: 20978,
    latin: 'Amphibia',
    color: '#2DD4BF',
    icon: { set: 'fa6', name: 'frog' },
    described: '≈ 9 000',
    blurb:
      'Grenouilles, salamandres et cécilies vivent entre eau et terre. Leur peau perméable en fait des sentinelles de la santé des écosystèmes — et le groupe de vertébrés le plus menacé.',
  },
  fishes: {
    id: 'fishes',
    label: 'Poissons',
    singular: 'Poisson',
    inatId: 47178,
    latin: 'Actinopterygii, Chondrichthyes…',
    color: '#3B82F6',
    icon: { set: 'fa6', name: 'fish' },
    described: '≈ 36 000',
    blurb:
      'Plus de la moitié des vertébrés ! « Poisson » n’est pas un groupe naturel : un cœlacanthe est plus proche de nous que d’un requin.',
  },
  insects: {
    id: 'insects',
    label: 'Insectes',
    singular: 'Insecte',
    inatId: 47158,
    latin: 'Insecta',
    color: '#FACC15',
    icon: { set: 'mci', name: 'ladybug' },
    described: '≈ 1 000 000',
    blurb:
      'Six pattes, trois parties du corps et une diversité vertigineuse : près d’une espèce animale décrite sur deux est un insecte.',
  },
  arachnids: {
    id: 'arachnids',
    label: 'Arachnides',
    singular: 'Arachnide',
    inatId: 47119,
    latin: 'Arachnida',
    color: '#F87171',
    icon: { set: 'fa6', name: 'spider' },
    described: '≈ 110 000',
    blurb: 'Araignées, scorpions, acariens et opilions : huit pattes et des stratégies de chasse d’une ingéniosité redoutable.',
  },
  crustaceans: {
    id: 'crustaceans',
    label: 'Crustacés',
    singular: 'Crustacé',
    inatId: 85493,
    latin: 'Crustacea',
    color: '#FB923C',
    icon: { set: 'fa6', name: 'shrimp' },
    described: '≈ 67 000',
    blurb: 'Du krill microscopique au crabe-araignée géant, les « insectes de la mer » dominent les océans… et même nos jardins, avec les cloportes.',
  },
  molluscs: {
    id: 'molluscs',
    label: 'Mollusques',
    singular: 'Mollusque',
    inatId: 47115,
    latin: 'Mollusca',
    color: '#C084FC',
    icon: { set: 'mci', name: 'snail' },
    described: '≈ 85 000',
    blurb: 'Escargots, bivalves et céphalopodes : un même plan d’organisation qui a produit aussi bien la moule que la pieuvre, championne d’intelligence.',
  },
  cnidarians: {
    id: 'cnidarians',
    label: 'Cnidaires',
    singular: 'Cnidaire',
    inatId: 47534,
    latin: 'Cnidaria',
    color: '#F472B6',
    icon: { set: 'mci', name: 'jellyfish' },
    described: '≈ 11 000',
    blurb: 'Méduses, coraux et anémones partagent des cellules urticantes uniques, les cnidocytes. Certains sont potentiellement immortels.',
  },
  echinoderms: {
    id: 'echinoderms',
    label: 'Échinodermes',
    singular: 'Échinoderme',
    inatId: 47549,
    latin: 'Echinodermata',
    color: '#FB7185',
    icon: { set: 'fa6', name: 'star' },
    described: '≈ 7 000',
    blurb: 'Étoiles de mer, oursins, holothuries : une symétrie d’ordre cinq et, surprise, ce sont nos plus proches parents parmi les invertébrés.',
  },
  others: {
    id: 'others',
    label: 'Autres invertébrés',
    singular: 'Invertébré',
    inatId: 1,
    latin: 'Animalia',
    color: '#A78BFA',
    icon: { set: 'fa6', name: 'worm' },
    described: '≈ 150 000',
    blurb: 'Vers, éponges, tardigrades, mille-pattes, limules, cténophores… la face cachée et fascinante de l’arbre du vivant.',
  },
};

export const GROUP_ORDER: GroupId[] = [
  'mammals',
  'birds',
  'reptiles',
  'amphibians',
  'fishes',
  'insects',
  'arachnids',
  'crustaceans',
  'molluscs',
  'cnidarians',
  'echinoderms',
  'others',
];

export interface IucnInfo {
  code: IucnStatus;
  label: string;
  color: string;
  /** 0 = non évalué … 8 = éteint ; sert au tri et aux jauges. */
  level: number;
  description: string;
}

export const IUCN: Record<IucnStatus, IucnInfo> = {
  NE: { code: 'NE', label: 'Non évalué', color: '#64748B', level: 0, description: 'Pas encore évalué par l’UICN.' },
  DD: { code: 'DD', label: 'Données insuffisantes', color: '#94A3B8', level: 1, description: 'Les données manquent pour évaluer le risque.' },
  LC: { code: 'LC', label: 'Préoccupation mineure', color: '#22C55E', level: 2, description: 'Espèce répandue et abondante.' },
  NT: { code: 'NT', label: 'Quasi menacé', color: '#A3E635', level: 3, description: 'Proche des seuils de menace.' },
  VU: { code: 'VU', label: 'Vulnérable', color: '#EAB308', level: 4, description: 'Risque élevé d’extinction à l’état sauvage.' },
  EN: { code: 'EN', label: 'En danger', color: '#F97316', level: 5, description: 'Risque très élevé d’extinction à l’état sauvage.' },
  CR: { code: 'CR', label: 'En danger critique', color: '#EF4444', level: 6, description: 'Risque extrêmement élevé d’extinction à l’état sauvage.' },
  EW: { code: 'EW', label: 'Éteint à l’état sauvage', color: '#A855F7', level: 7, description: 'Ne survit qu’en captivité.' },
  EX: { code: 'EX', label: 'Éteint', color: '#71717A', level: 8, description: 'Aucun individu ne survit.' },
};

/** Échelle affichée sur la jauge, de la moins à la plus menacée. */
export const IUCN_SCALE: IucnStatus[] = ['LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'];

export const DIETS: Record<Diet, { label: string; icon: IconRef }> = {
  carnivore: { label: 'Carnivore', icon: { set: 'mci', name: 'food-steak' } },
  piscivore: { label: 'Piscivore', icon: { set: 'mci', name: 'fish' } },
  insectivore: { label: 'Insectivore', icon: { set: 'mci', name: 'bug' } },
  herbivore: { label: 'Herbivore', icon: { set: 'mci', name: 'leaf' } },
  folivore: { label: 'Folivore', icon: { set: 'mci', name: 'leaf-maple' } },
  frugivore: { label: 'Frugivore', icon: { set: 'mci', name: 'fruit-cherries' } },
  granivore: { label: 'Granivore', icon: { set: 'mci', name: 'seed' } },
  nectarivore: { label: 'Nectarivore', icon: { set: 'mci', name: 'flower' } },
  omnivore: { label: 'Omnivore', icon: { set: 'mci', name: 'silverware-fork-knife' } },
  charognard: { label: 'Charognard', icon: { set: 'mci', name: 'bone' } },
  filtreur: { label: 'Filtreur', icon: { set: 'mci', name: 'filter' } },
  detritivore: { label: 'Détritivore', icon: { set: 'mci', name: 'recycle' } },
  hematophage: { label: 'Hématophage', icon: { set: 'mci', name: 'water' } },
  myrmecophage: { label: 'Myrmécophage', icon: { set: 'mci', name: 'bug-outline' } },
  parasite: { label: 'Parasite', icon: { set: 'mci', name: 'virus' } },
  symbiotique: { label: 'Symbiose', icon: { set: 'mci', name: 'handshake' } },
};

export const ACTIVITIES: Record<Activity, { label: string; icon: IconRef }> = {
  diurne: { label: 'Diurne', icon: { set: 'mci', name: 'white-balance-sunny' } },
  nocturne: { label: 'Nocturne', icon: { set: 'mci', name: 'weather-night' } },
  crepusculaire: { label: 'Crépusculaire', icon: { set: 'mci', name: 'weather-sunset' } },
  cathemeral: { label: 'Jour et nuit', icon: { set: 'mci', name: 'theme-light-dark' } },
};

export const SOCIALS: Record<Social, { label: string; icon: IconRef }> = {
  solitaire: { label: 'Solitaire', icon: { set: 'mci', name: 'account' } },
  couple: { label: 'En couple', icon: { set: 'mci', name: 'account-heart' } },
  groupe: { label: 'En groupe', icon: { set: 'mci', name: 'account-group' } },
  colonie: { label: 'En colonie', icon: { set: 'mci', name: 'hexagon-multiple' } },
  banc: { label: 'En banc', icon: { set: 'mci', name: 'fish' } },
};

export const HABITATS: Record<Habitat, { label: string; icon: IconRef }> = {
  savane: { label: 'Savane', icon: { set: 'mci', name: 'grass' } },
  'foret-tropicale': { label: 'Forêt tropicale', icon: { set: 'mci', name: 'palm-tree' } },
  'foret-temperee': { label: 'Forêt tempérée', icon: { set: 'mci', name: 'tree' } },
  taiga: { label: 'Taïga', icon: { set: 'mci', name: 'pine-tree' } },
  toundra: { label: 'Toundra', icon: { set: 'mci', name: 'snowflake' } },
  desert: { label: 'Désert', icon: { set: 'mci', name: 'cactus' } },
  montagne: { label: 'Montagne', icon: { set: 'mci', name: 'image-filter-hdr' } },
  prairie: { label: 'Prairie', icon: { set: 'mci', name: 'flower-tulip' } },
  'zones-humides': { label: 'Zones humides', icon: { set: 'mci', name: 'water-outline' } },
  'eau-douce': { label: 'Eau douce', icon: { set: 'mci', name: 'waves' } },
  littoral: { label: 'Littoral', icon: { set: 'mci', name: 'beach' } },
  recifs: { label: 'Récifs', icon: { set: 'mci', name: 'fishbowl-outline' } },
  ocean: { label: 'Haute mer', icon: { set: 'mci', name: 'sail-boat' } },
  abysses: { label: 'Abysses', icon: { set: 'mci', name: 'arrow-collapse-down' } },
  banquise: { label: 'Banquise', icon: { set: 'mci', name: 'snowflake-variant' } },
  mangrove: { label: 'Mangrove', icon: { set: 'mci', name: 'sprout' } },
  grottes: { label: 'Grottes', icon: { set: 'mci', name: 'tunnel' } },
  urbain: { label: 'Milieu urbain', icon: { set: 'mci', name: 'city-variant' } },
};

export const REGIONS: Record<Region, { label: string; short: string }> = {
  europe: { label: 'Europe', short: 'EU' },
  afrique: { label: 'Afrique', short: 'AF' },
  asie: { label: 'Asie', short: 'AS' },
  'amerique-nord': { label: 'Amérique du Nord', short: 'AN' },
  'amerique-sud': { label: 'Amérique du Sud', short: 'AS' },
  oceanie: { label: 'Océanie', short: 'OC' },
  antarctique: { label: 'Antarctique', short: 'AN' },
  arctique: { label: 'Arctique', short: 'AR' },
  oceans: { label: 'Océans du monde', short: 'OM' },
};

/** Noms français des rangs taxonomiques. */
export const RANKS: Record<string, string> = {
  stateofmatter: 'Vivant',
  kingdom: 'Règne',
  phylum: 'Embranchement',
  subphylum: 'Sous-embranchement',
  superclass: 'Super-classe',
  class: 'Classe',
  subclass: 'Sous-classe',
  infraclass: 'Infra-classe',
  superorder: 'Super-ordre',
  order: 'Ordre',
  suborder: 'Sous-ordre',
  infraorder: 'Infra-ordre',
  parvorder: 'Parvordre',
  zoosection: 'Zoosection',
  zoosubsection: 'Zoosous-section',
  superfamily: 'Super-famille',
  epifamily: 'Épifamille',
  family: 'Famille',
  subfamily: 'Sous-famille',
  supertribe: 'Super-tribu',
  tribe: 'Tribu',
  subtribe: 'Sous-tribu',
  genus: 'Genre',
  genushybrid: 'Hybride',
  subgenus: 'Sous-genre',
  section: 'Section',
  subsection: 'Sous-section',
  complex: 'Complexe',
  species: 'Espèce',
  hybrid: 'Hybride',
  subspecies: 'Sous-espèce',
  variety: 'Variété',
  form: 'Forme',
};

/** Rangs « principaux » mis en valeur dans la classification. */
export const MAJOR_RANKS = new Set(['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species']);

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: IconRef;
  color: string;
  filter: (s: Species) => boolean;
}

const tag = (t: Tag) => (s: Species) => s.tags?.includes(t) ?? false;

export const COLLECTIONS: Collection[] = [
  {
    id: 'records',
    title: 'Records du vivant',
    subtitle: 'Les plus grands, rapides, lourds…',
    description: 'Les champions toutes catégories du règne animal, du plus grand animal ayant jamais existé au plus petit vertébré.',
    icon: { set: 'mci', name: 'trophy' },
    color: '#F5A524',
    filter: (s) => Boolean(s.record) && (s.tags?.includes('record') ?? false),
  },
  {
    id: 'critique',
    title: 'Au bord de l’extinction',
    subtitle: 'En danger critique',
    description: 'Ces espèces sont classées « En danger critique » par l’UICN. Chacune raconte une histoire de déclin… et parfois d’espoir.',
    icon: { set: 'mci', name: 'alert-octagon' },
    color: '#EF4444',
    filter: (s) => s.status === 'CR',
  },
  {
    id: 'abysses',
    title: 'Créatures des abysses',
    subtitle: 'Là où la lumière s’éteint',
    description: 'Pression écrasante, froid, obscurité totale : les profondeurs abritent des formes de vie parmi les plus étranges de la planète.',
    icon: { set: 'mci', name: 'submarine' },
    color: '#6366F1',
    filter: tag('abysses'),
  },
  {
    id: 'france',
    title: 'Faune de France',
    subtitle: 'Métropole et outre-mer',
    description: 'Des Alpes à la Guyane, de la Bretagne à la Nouvelle-Calédonie : un aperçu de la richesse animale française.',
    icon: { set: 'mci', name: 'map-marker-radius' },
    color: '#3B82F6',
    filter: tag('france'),
  },
  {
    id: 'venimeux',
    title: 'Venimeux & vénéneux',
    subtitle: 'Toxines en tout genre',
    description: 'Un animal venimeux injecte son venin (morsure, piqûre) ; un animal vénéneux est toxique quand on le touche ou le mange.',
    icon: { set: 'mci', name: 'skull-crossbones' },
    color: '#A3E635',
    filter: tag('venimeux'),
  },
  {
    id: 'camouflage',
    title: 'Maîtres du camouflage',
    subtitle: 'L’art de disparaître',
    description: 'Homochromie, mimétisme, déguisements : ces animaux ont fait de l’invisibilité une stratégie de survie.',
    icon: { set: 'mci', name: 'eye-off' },
    color: '#22C55E',
    filter: tag('camouflage'),
  },
  {
    id: 'intelligence',
    title: 'Génies du règne animal',
    subtitle: 'Outils, mémoire, culture',
    description: 'Fabrication d’outils, reconnaissance de soi, transmission culturelle : l’intelligence n’est pas l’apanage des primates.',
    icon: { set: 'mci', name: 'brain' },
    color: '#C084FC',
    filter: tag('intelligence'),
  },
  {
    id: 'fossiles-vivants',
    title: 'Fossiles vivants',
    subtitle: 'Des lignées très anciennes',
    description: 'Des lignées qui ont traversé des centaines de millions d’années en changeant peu d’apparence.',
    icon: { set: 'mci', name: 'bone' },
    color: '#D6A55C',
    filter: tag('fossile-vivant'),
  },
  {
    id: 'migrateurs',
    title: 'Grands voyageurs',
    subtitle: 'Migrations extraordinaires',
    description: 'Des milliers de kilomètres à travers océans et continents, guidés par le soleil, les étoiles ou le champ magnétique.',
    icon: { set: 'mci', name: 'airplane' },
    color: '#38BDF8',
    filter: tag('migrateur'),
  },
  {
    id: 'geants',
    title: 'Géants',
    subtitle: 'Hors normes',
    description: 'Le gigantisme sous toutes ses formes, sur terre, dans les airs et au fond des mers.',
    icon: { set: 'mci', name: 'arrow-expand-all' },
    color: '#FB923C',
    filter: tag('geant'),
  },
  {
    id: 'miniatures',
    title: 'Miniatures',
    subtitle: 'Petits mais remarquables',
    description: 'Les plus petits représentants de leur groupe, souvent découverts très récemment.',
    icon: { set: 'mci', name: 'magnify-scan' },
    color: '#2DD4BF',
    filter: tag('minuscule'),
  },
  {
    id: 'longevite',
    title: 'Champions de longévité',
    subtitle: 'Le temps n’a pas de prise',
    description: 'Des siècles de vie, des cycles de 17 ans, voire une forme d’immortalité biologique.',
    icon: { set: 'mci', name: 'infinity' },
    color: '#FACC15',
    filter: tag('longevite'),
  },
  {
    id: 'lumieres',
    title: 'Lumières vivantes',
    subtitle: 'Bioluminescence',
    description: 'Produire sa propre lumière pour séduire, chasser ou se cacher : un talent apparu indépendamment des dizaines de fois.',
    icon: { set: 'mci', name: 'lightbulb-on' },
    color: '#67E8F9',
    filter: tag('bioluminescent'),
  },
  {
    id: 'endemiques',
    title: 'Trésors endémiques',
    subtitle: 'Nulle part ailleurs',
    description: 'Ces espèces ne vivent que dans une région, une île ou même un seul lac au monde.',
    icon: { set: 'mci', name: 'island' },
    color: '#F472B6',
    filter: tag('endemique'),
  },
  {
    id: 'nuit',
    title: 'Créatures de la nuit',
    subtitle: 'Quand le soleil se couche',
    description: 'Ouïe surdéveloppée, vision nocturne, écholocation : la nuit a ses propres maîtres.',
    icon: { set: 'mci', name: 'weather-night' },
    color: '#818CF8',
    filter: (s) => s.activity === 'nocturne',
  },
  {
    id: 'disparus',
    title: 'Disparus',
    subtitle: 'Ils ont existé',
    description: 'Des espèces éteintes à l’époque moderne, souvent du fait de l’homme. Se souvenir d’eux, c’est mieux protéger les autres.',
    icon: { set: 'mci', name: 'grave-stone' },
    color: '#A1A1AA',
    filter: (s) => s.status === 'EX' || s.status === 'EW',
  },
];
