/**
 * Frise de l’évolution animale : périodes géologiques (dates de la Commission
 * internationale de stratigraphie, couleurs de son échelle) et grands jalons.
 * Les âges sont des ordres de grandeur, en millions d’années (Ma).
 */

export interface Period {
  id: string;
  name: string;
  era: 'Paléozoïque' | 'Mésozoïque' | 'Cénozoïque';
  /** Début et fin, en millions d’années. */
  start: number;
  end: number;
  color: string;
  summary: string;
}

export type EvoKind = 'apparition' | 'extinction' | 'jalon' | 'humain';

export interface EvoEvent {
  ma: number;
  /** Date affichée à la place de l’âge (événements historiques). */
  date?: string;
  title: string;
  text: string;
  kind: EvoKind;
  /** Espèces de l’app héritières de cette lignée ou concernées. */
  speciesIds?: string[];
}

export const PERIODS: Period[] = [
  { id: 'cambrien', name: 'Cambrien', era: 'Paléozoïque', start: 538.8, end: 485.4, color: '#7FA056', summary: 'L’explosion de la vie animale : en quelques dizaines de millions d’années apparaissent presque tous les grands plans d’organisation actuels.' },
  { id: 'ordovicien', name: 'Ordovicien', era: 'Paléozoïque', start: 485.4, end: 443.8, color: '#009270', summary: 'Les mers grouillent d’invertébrés, et les premières plantes s’installent sur la terre ferme.' },
  { id: 'silurien', name: 'Silurien', era: 'Paléozoïque', start: 443.8, end: 419.2, color: '#B3E1B6', summary: 'Les récifs prospèrent et les premiers animaux sortent de l’eau.' },
  { id: 'devonien', name: 'Dévonien', era: 'Paléozoïque', start: 419.2, end: 358.9, color: '#CB8C37', summary: 'L’« âge des poissons » : les vertébrés à mâchoires se diversifient, puis certains s’aventurent sur terre.' },
  { id: 'carbonifere', name: 'Carbonifère', era: 'Paléozoïque', start: 358.9, end: 298.9, color: '#67A599', summary: 'D’immenses forêts marécageuses et un air très riche en oxygène, propice aux insectes géants.' },
  { id: 'permien', name: 'Permien', era: 'Paléozoïque', start: 298.9, end: 251.9, color: '#F04028', summary: 'Reptiles et ancêtres des mammifères dominent… jusqu’à la plus grande extinction de l’histoire.' },
  { id: 'trias', name: 'Trias', era: 'Mésozoïque', start: 251.9, end: 201.4, color: '#812B92', summary: 'La vie se reconstruit : premiers dinosaures, premiers mammifères, premières tortues.' },
  { id: 'jurassique', name: 'Jurassique', era: 'Mésozoïque', start: 201.4, end: 145, color: '#34B2C9', summary: 'Dinosaures géants sur terre, reptiles marins dans les océans, et les premiers oiseaux.' },
  { id: 'cretace', name: 'Crétacé', era: 'Mésozoïque', start: 145, end: 66, color: '#7FC64E', summary: 'Fleurs, abeilles et fourmis se répandent ; la période s’achève par la chute d’un astéroïde.' },
  { id: 'paleogene', name: 'Paléogène', era: 'Cénozoïque', start: 66, end: 23.03, color: '#FD9A52', summary: 'Les mammifères héritent de la planète : baleines, primates et chevaux apparaissent.' },
  { id: 'neogene', name: 'Néogène', era: 'Cénozoïque', start: 23.03, end: 2.58, color: '#FFE619', summary: 'Les paysages modernes se mettent en place ; la lignée humaine se sépare de celle des chimpanzés.' },
  { id: 'quaternaire', name: 'Quaternaire', era: 'Cénozoïque', start: 2.58, end: 0, color: '#F9F97F', summary: 'Glaciations, grands mammifères… et l’expansion de notre espèce.' },
];

export const EVO_EVENTS: EvoEvent[] = [
  // Cambrien (et juste avant)
  { ma: 560, title: 'Les tout premiers animaux', text: 'Avant même le Cambrien, éponges et cnidaires comptent parmi les plus anciens animaux connus.', kind: 'apparition', speciesIds: ['corbeille-de-venus', 'meduse-criniere-de-lion'] },
  { ma: 538, title: 'L’explosion cambrienne', text: 'Arthropodes, mollusques, échinodermes, chordés : la plupart des grands groupes animaux actuels apparaissent en un temps record.', kind: 'jalon', speciesIds: ['etoile-de-mer-commune'] },
  { ma: 518, title: 'Premiers vertébrés', text: 'Haikouichthys, un petit poisson sans mâchoires découvert en Chine, est l’un des plus anciens vertébrés connus.', kind: 'apparition' },
  { ma: 508, title: 'La faune de Burgess', text: 'Ce gisement canadien a figé une faune étrange, dont Anomalocaris, un prédateur qui pouvait approcher le mètre.', kind: 'jalon' },
  { ma: 500, title: 'Premiers céphalopodes', text: 'Les premiers céphalopodes, protégés par une coquille comme le nautile, apparaissent à la fin du Cambrien.', kind: 'apparition', speciesIds: ['nautile'] },
  // Ordovicien
  { ma: 470, title: 'Les plantes gagnent la terre', text: 'De petites plantes proches des mousses colonisent les terres émergées, préparant le terrain aux animaux.', kind: 'jalon' },
  { ma: 450, title: 'Premiers requins', text: 'Des écailles fossiles montrent que les requins existent déjà : ils traverseront les cinq grandes extinctions.', kind: 'apparition', speciesIds: ['grand-requin-blanc', 'requin-baleine'] },
  { ma: 445, title: 'Les limules', text: 'Les ancêtres des limules apparaissent ; leur silhouette a très peu changé depuis.', kind: 'apparition', speciesIds: ['limule'] },
  { ma: 443, title: '1ʳᵉ extinction massive', text: 'Une glaciation brutale fait disparaître environ 85 % des espèces marines.', kind: 'extinction' },
  // Silurien
  { ma: 435, title: 'Les scorpions', text: 'Apparus dans la mer, les scorpions comptent parmi les premiers arthropodes à conquérir la terre ferme.', kind: 'apparition', speciesIds: ['scorpion-empereur'] },
  { ma: 428, title: 'Premier animal terrestre connu', text: 'Pneumodesmus, un petit mille-pattes fossile d’Écosse, respirait déjà l’air libre.', kind: 'jalon', speciesIds: ['scolopendre-geante'] },
  // Dévonien
  { ma: 410, title: 'Poissons à nageoires charnues', text: 'Les sarcoptérygiens apparaissent : le cœlacanthe et les dipneustes, comme le protoptère, en sont les derniers représentants.', kind: 'apparition', speciesIds: ['coelacanthe', 'protoptere'] },
  { ma: 400, title: 'Premiers insectes', text: 'Rhyniognatha, connu par ses seules mandibules, passe pour le plus ancien insecte.', kind: 'apparition' },
  { ma: 375, title: 'Tiktaalik', text: 'Ce poisson au cou mobile et aux nageoires robustes illustre le passage de l’eau à la terre.', kind: 'jalon' },
  { ma: 372, title: '2ᵉ extinction massive', text: 'La crise du Dévonien supérieur frappe surtout les récifs et les mers chaudes.', kind: 'extinction' },
  { ma: 365, title: 'Premiers tétrapodes', text: 'Ichthyostega et Acanthostega, aux pattes de plus de cinq doigts, ouvrent la voie aux amphibiens.', kind: 'apparition', speciesIds: ['salamandre-geante-de-chine', 'axolotl'] },
  { ma: 360, title: 'Les lamproies', text: 'Priscomyzon, une lamproie fossile d’Afrique du Sud, ressemble déjà beaucoup aux lamproies actuelles.', kind: 'apparition', speciesIds: ['lamproie-marine'] },
  // Carbonifère
  { ma: 325, title: 'Premiers animaux volants', text: 'Les insectes conquièrent les airs, plus de 100 millions d’années avant les ptérosaures.', kind: 'jalon' },
  { ma: 312, title: 'L’œuf à coquille', text: 'Hylonomus, un petit reptile de Nouvelle-Écosse, compte parmi les premiers amniotes : leurs œufs affranchissent la vie de l’eau.', kind: 'apparition', speciesIds: ['lezard-des-murailles'] },
  { ma: 300, title: 'Insectes géants', text: 'Meganeura, cousine des libellules, atteint 70 cm d’envergure à la faveur d’un air riche en oxygène.', kind: 'jalon', speciesIds: ['anax-empereur'] },
  // Permien
  { ma: 270, title: 'Ancêtres des mammifères', text: 'Les thérapsides, aux dents différenciées, dominent la terre ferme.', kind: 'apparition' },
  { ma: 252, title: 'La Grande Extinction', text: 'La pire crise de l’histoire : plus de 80 % des espèces marines et environ 70 % des vertébrés terrestres disparaissent, probablement à cause d’éruptions géantes en Sibérie.', kind: 'extinction' },
  // Trias
  { ma: 240, title: 'Les sphénodons', text: 'Les rhynchocéphales apparaissent ; le sphénodon de Nouvelle-Zélande est leur dernier survivant.', kind: 'apparition', speciesIds: ['sphenodon'] },
  { ma: 231, title: 'Premiers dinosaures', text: 'Eoraptor et ses contemporains, en Argentine, comptent parmi les plus anciens dinosaures connus.', kind: 'apparition' },
  { ma: 225, title: 'Premiers mammifères', text: 'De petits animaux nocturnes, proches des musaraignes, annoncent les mammifères.', kind: 'apparition', speciesIds: ['musaraigne-etrusque'] },
  { ma: 220, title: 'Les tortues', text: 'Odontochelys, une tortue à demi-carapace, montre comment la carapace s’est formée.', kind: 'apparition', speciesIds: ['tortue-luth', 'tortue-des-galapagos'] },
  { ma: 201, title: '4ᵉ extinction massive', text: 'La fin du Trias élimine de nombreux concurrents et ouvre la voie à la domination des dinosaures.', kind: 'extinction' },
  // Jurassique
  { ma: 200, title: 'Les esturgeons', text: 'Les esturgeons, cuirassés de plaques osseuses, apparaissent au début du Jurassique.', kind: 'apparition', speciesIds: ['grand-esturgeon'] },
  { ma: 200, title: 'Les papillons', text: 'Des écailles fossiles montrent que les papillons volaient déjà, bien avant l’apparition des fleurs.', kind: 'apparition', speciesIds: ['monarque', 'machaon'] },
  { ma: 150, title: 'Archaeopteryx', text: 'Ce dinosaure à plumes de Bavière est le plus célèbre maillon entre reptiles et oiseaux.', kind: 'apparition', speciesIds: ['aigle-royal', 'autruche'] },
  // Crétacé
  { ma: 130, title: 'Les fleurs', text: 'Les plantes à fleurs se répandent et nouent avec les insectes une alliance qui dure encore.', kind: 'jalon' },
  { ma: 120, title: 'Les fourmis', text: 'Les fourmis apparaissent au Crétacé ; les plus anciennes nous sont parvenues piégées dans l’ambre.', kind: 'apparition', speciesIds: ['fourmi-legionnaire', 'fourmi-champignonniste'] },
  { ma: 110, title: 'Mammifères pondeurs', text: 'Les plus anciens fossiles de monotrèmes, en Australie, ont environ 110 millions d’années : l’ornithorynque et l’échidné en sont les héritiers.', kind: 'apparition', speciesIds: ['ornithorynque', 'echidne-a-nez-court'] },
  { ma: 100, title: 'Les abeilles', text: 'La plus ancienne abeille connue, conservée dans l’ambre de Birmanie, a environ 100 millions d’années.', kind: 'apparition', speciesIds: ['abeille-domestique', 'bourdon-terrestre'] },
  { ma: 95, title: 'Crocodiliens modernes', text: 'Les crocodiliens actuels apparaissent, héritiers de lignées qui côtoyaient déjà les premiers dinosaures.', kind: 'apparition', speciesIds: ['crocodile-du-nil', 'alligator-d-amerique'] },
  { ma: 66, title: 'L’astéroïde', text: 'Un astéroïde d’une dizaine de kilomètres frappe le Yucatán : les dinosaures non aviens disparaissent, avec environ trois quarts des espèces.', kind: 'extinction' },
  // Paléogène
  { ma: 60, title: 'Ancêtres des éléphants', text: 'Les premiers proboscidiens, pas plus grands qu’un renard, vivent en Afrique du Nord.', kind: 'apparition', speciesIds: ['elephant-de-savane', 'elephant-d-asie'] },
  { ma: 56, title: 'Premiers primates modernes', text: 'De petits primates arboricoles se répandent dans des forêts chaudes qui couvrent jusqu’aux pôles.', kind: 'apparition', speciesIds: ['maki-catta', 'tarsier-des-philippines'] },
  { ma: 55, title: 'Ancêtres des chevaux', text: 'Hyracotherium, pas plus grand qu’un renard, est l’ancêtre lointain des chevaux et des zèbres.', kind: 'apparition', speciesIds: ['zebre-des-plaines'] },
  { ma: 50, title: 'Retour à la mer', text: 'Pakicetus, un mammifère terrestre au crâne de baleine, ouvre la lignée des cétacés.', kind: 'apparition', speciesIds: ['baleine-bleue', 'orque'] },
  { ma: 25, title: 'Premiers félins', text: 'Proailurus, considéré comme le premier félin, chasse dans les forêts d’Europe.', kind: 'apparition', speciesIds: ['lion', 'tigre'] },
  // Néogène
  { ma: 10, title: 'Le temps des savanes', text: 'Les prairies et les savanes s’étendent, favorisant les grands herbivores coureurs et leurs prédateurs.', kind: 'jalon', speciesIds: ['gnou-bleu', 'girafe'] },
  { ma: 7, title: 'Humains et chimpanzés', text: 'La lignée humaine se sépare de celle des chimpanzés et des bonobos, il y a 7 à 6 millions d’années.', kind: 'humain', speciesIds: ['chimpanze', 'bonobo'] },
  { ma: 3.2, title: 'Lucy', text: 'Cette australopithèque découverte en Éthiopie en 1974 marchait déjà debout.', kind: 'humain' },
  // Quaternaire
  { ma: 2.5, title: 'Les âges glaciaires', text: 'Les glaciations se succèdent : mammouths, rhinocéros laineux et rennes parcourent l’Europe.', kind: 'jalon', speciesIds: ['renne', 'bison-d-europe'] },
  { ma: 0.3, title: 'Homo sapiens', text: 'Les plus anciens fossiles de notre espèce, au Maroc, ont environ 300 000 ans.', kind: 'humain' },
  { ma: 0.004, title: 'Les derniers mammouths', text: 'Ils s’éteignent sur l’île Wrangel il y a environ 4 000 ans, alors que les pyramides de Gizeh étaient déjà construites.', kind: 'extinction' },
  { ma: 0.00033, date: 'Vers 1690', title: 'La fin du dodo', text: 'Moins d’un siècle après sa découverte, le dodo de l’île Maurice disparaît : l’une des premières extinctions documentées causées par l’homme.', kind: 'extinction', speciesIds: ['dodo'] },
  { ma: 0.00009, date: '1936', title: 'Le dernier thylacine', text: 'Le dernier tigre de Tasmanie connu meurt au zoo de Hobart.', kind: 'extinction', speciesIds: ['thylacine'] },
];

/** Début de l’histoire racontée (≈ 540 Ma). */
export const EVO_START = 540;
