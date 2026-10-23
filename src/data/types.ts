/**
 * Modèle de données de Faunapedia.
 *
 * Les fiches « curées » sont rédigées à la main (src/data/curated/*) puis
 * enrichies par `npm run data:build` (iNaturalist, Wikipédia, Wikidata,
 * GBIF, PhyloPic) dans src/data/generated/species.json.
 */

export type GroupId =
  | 'mammals'
  | 'birds'
  | 'reptiles'
  | 'amphibians'
  | 'fishes'
  | 'insects'
  | 'arachnids'
  | 'crustaceans'
  | 'molluscs'
  | 'cnidarians'
  | 'echinoderms'
  | 'others';

/** Catégories de la Liste rouge de l'UICN. */
export type IucnStatus = 'EX' | 'EW' | 'CR' | 'EN' | 'VU' | 'NT' | 'LC' | 'DD' | 'NE';

export type Diet =
  | 'carnivore'
  | 'piscivore'
  | 'insectivore'
  | 'herbivore'
  | 'folivore'
  | 'frugivore'
  | 'granivore'
  | 'nectarivore'
  | 'omnivore'
  | 'charognard'
  | 'filtreur'
  | 'detritivore'
  | 'hematophage'
  | 'myrmecophage'
  | 'parasite'
  | 'symbiotique';

export type Activity = 'diurne' | 'nocturne' | 'crepusculaire' | 'cathemeral';

export type Social = 'solitaire' | 'couple' | 'groupe' | 'colonie' | 'banc';

export type Habitat =
  | 'savane'
  | 'foret-tropicale'
  | 'foret-temperee'
  | 'taiga'
  | 'toundra'
  | 'desert'
  | 'montagne'
  | 'prairie'
  | 'zones-humides'
  | 'eau-douce'
  | 'littoral'
  | 'recifs'
  | 'ocean'
  | 'abysses'
  | 'banquise'
  | 'mangrove'
  | 'grottes'
  | 'urbain';

export type Region =
  | 'europe'
  | 'afrique'
  | 'asie'
  | 'amerique-nord'
  | 'amerique-sud'
  | 'oceanie'
  | 'antarctique'
  | 'arctique'
  | 'oceans';

/** Intervalle [min, max] ; une valeur unique s'écrit [v, v]. */
export type Range = readonly [number, number];

export interface Stats {
  /** Longueur du corps (cm). Pour les serpents/poissons : longueur totale. */
  length?: Range;
  /** Hauteur (cm) — au garrot pour les quadrupèdes, debout pour les oiseaux. */
  height?: Range;
  /** Envergure (cm) — oiseaux, chauves-souris, papillons ; pattes étendues pour les araignées et les crabes. */
  wingspan?: Range;
  /** Masse (kg). */
  weight?: Range;
  /** Longévité dans la nature (années). */
  lifespan?: Range;
  /** Vitesse de pointe (km/h). */
  speed?: number;
}

export type Tag =
  | 'record'
  | 'venimeux'
  | 'abysses'
  | 'france'
  | 'camouflage'
  | 'fossile-vivant'
  | 'migrateur'
  | 'eteint'
  | 'intelligence'
  | 'geant'
  | 'minuscule'
  | 'bioluminescent'
  | 'endemique'
  | 'longevite';

/** Fiche rédigée à la main. */
export interface CuratedSpecies {
  id: string;
  /** Nom scientifique (binôme). */
  sci: string;
  /** Nom vernaculaire français principal. */
  name: string;
  /** Autres noms français. */
  aka?: string[];
  group: GroupId;
  /** Statut UICN de secours (remplacé par la source officielle si disponible). */
  status: IucnStatus;
  /** Précision sur le statut (évaluation régionale, sous-espèce, complexe d’espèces…). */
  statusNote?: string;
  stats: Stats;
  diet: Diet[];
  activity: Activity;
  social: Social;
  habitats: Habitat[];
  regions: Region[];
  /** Record ou superlatif marquant. */
  record?: string;
  /** « Le saviez-vous ? » */
  facts: string[];
  tags?: Tag[];
  /** Origine du nom scientifique. */
  etymology?: string;
  /** Article Wikipédia à utiliser quand ni le nom scientifique ni le nom français n’y mènent (genre…). */
  wiki?: string;
}

/** Récit historique, mythe ou symbole associé à une espèce. */
export interface Lore {
  /** Culture ou époque d’origine (« Égypte ancienne », « Mythologie nordique »…). */
  culture: string;
  text: string;
}

export interface Photo {
  url: string;
  /** Dimensions d'origine (pour le ratio). */
  w?: number;
  h?: number;
  attribution: string;
  license: string;
}

export interface TaxonNode {
  id: number;
  rank: string;
  name: string;
  fr?: string;
}

export interface Silhouette {
  url: string;
  /** Ratio largeur / hauteur. */
  ratio: number;
  attribution?: string;
  license?: string;
  /** Vrai si la silhouette représente l'espèce elle-même. */
  exact: boolean;
}

/** Fiche complète : rédactionnel + données enrichies. */
export interface Species extends CuratedSpecies {
  inatId?: number;
  gbifKey?: number;
  wikidata?: string;
  wikiTitle?: string;
  authority?: string;
  summary?: string;
  photos: Photo[];
  taxonomy: TaxonNode[];
  silhouette?: Silhouette;
  observations?: number;
  /** Histoire, mythes et symboles (src/data/curated/lore.ts). */
  lore?: readonly Lore[];
  /** Source du statut : 'iucn' (iNaturalist/UICN), 'wikidata' ou 'curated'. */
  statusSource?: 'iucn' | 'wikidata' | 'curated';
}
