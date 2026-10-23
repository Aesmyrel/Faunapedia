/**
 * « Ce mois-ci dans la nature » : le calendrier naturel de la France
 * métropolitaine, mois par mois. Les dates varient selon l’altitude, la
 * latitude et la météo de l’année : ce sont des repères, pas des horaires.
 */

export type SeasonKind = 'observer' | 'ecouter' | 'migration' | 'agir';

export interface SeasonEvent {
  title: string;
  text: string;
  kind: SeasonKind;
  /** Espèce de Faunapedia concernée, quand il y en a une. */
  speciesId?: string;
}

/** Index 0 = janvier. */
export const SEASONS: SeasonEvent[][] = [
  // Janvier
  [
    { title: 'Le grand-duc chante', text: 'En fin de journée, le « ou-hou » grave du grand-duc d’Europe résonne dans les falaises : c’est la saison des parades.', kind: 'ecouter', speciesId: 'grand-duc-d-europe' },
    { title: 'Les renards sont en rut', text: 'La nuit, leurs glapissements rauques surprennent souvent les citadins : c’est la période des accouplements.', kind: 'ecouter', speciesId: 'renard-roux' },
    { title: 'Le hérisson hiberne', text: 'Tas de feuilles et de bois au fond du jardin peuvent abriter un hérisson endormi : mieux vaut ne pas y toucher avant le printemps.', kind: 'agir', speciesId: 'herisson-d-europe' },
    { title: 'Mangeoires en fête', text: 'Mésanges, rougegorges et pinsons se pressent aux mangeoires ; c’est le moment idéal pour apprendre à les reconnaître.', kind: 'observer', speciesId: 'mesange-charbonniere' },
    { title: 'Le bouquetin finit son rut', text: 'En montagne, les mâles s’affrontent encore à grands coups de cornes sur les pentes enneigées.', kind: 'observer', speciesId: 'bouquetin-des-alpes' },
  ],
  // Février
  [
    { title: 'Les crapauds se mettent en route', text: 'Par les nuits douces et pluvieuses, ils migrent en masse vers leur mare natale ; des bénévoles les aident à traverser les routes.', kind: 'migration', speciesId: 'crapaud-commun' },
    { title: 'Le pic tambourine', text: 'Le roulement sec du pic épeiche sur une branche morte annonce son territoire bien avant le printemps.', kind: 'ecouter', speciesId: 'pic-epeiche' },
    { title: 'Les grues remontent vers le nord', text: 'Les grues cendrées repassent au-dessus de la France en grands V, en lançant des cris trompetants.', kind: 'migration' },
    { title: 'La salamandre sort sous la pluie', text: 'Les soirs humides, la salamandre tachetée rejoint les ruisseaux forestiers pour y déposer ses larves.', kind: 'observer', speciesId: 'salamandre-tachetee' },
    { title: 'Installer un nichoir', text: 'C’est le bon moment pour poser un nichoir : les mésanges commencent à repérer leur futur site de nidification.', kind: 'agir', speciesId: 'mesange-charbonniere' },
  ],
  // Mars
  [
    { title: 'Les cigognes sont de retour', text: 'Les cigognes blanches retrouvent leurs nids et claquent du bec pour saluer leur partenaire.', kind: 'migration', speciesId: 'cigogne-blanche' },
    { title: 'La huppe revient d’Afrique', text: 'Son « oup-oup-oup » doux se fait entendre dans les vergers et les campagnes du Sud et de l’Ouest.', kind: 'migration', speciesId: 'huppe-fasciee' },
    { title: 'Tritons et grenouilles dans les mares', text: 'Les tritons revêtent leur livrée nuptiale : une lampe de poche suffit pour les observer la nuit, sans les manipuler.', kind: 'observer', speciesId: 'triton-alpestre' },
    { title: 'Les reines de bourdons se réveillent', text: 'Les premières grosses reines butinent les saules et cherchent un trou pour fonder leur colonie.', kind: 'observer', speciesId: 'bourdon-terrestre' },
    { title: 'Le cerf perd ses bois', text: 'Les grands mâles perdent leurs bois à la fin de l’hiver ; ils repousseront couverts de velours pendant l’été.', kind: 'observer', speciesId: 'cerf-elaphe' },
  ],
  // Avril
  [
    { title: 'Le coucou est arrivé', text: 'Son chant si reconnaissable annonce le printemps ; la femelle cherche déjà les nids où pondre ses œufs.', kind: 'ecouter', speciesId: 'coucou-gris' },
    { title: 'Les martinets reviennent', text: 'Fin avril, les premiers martinets noirs regagnent les villes après un hiver passé à voler au-dessus de l’Afrique.', kind: 'migration', speciesId: 'martinet-noir' },
    { title: 'Les belles-dames arrivent', text: 'Les vanesses des chardons remontent d’Afrique du Nord, parfois par millions certaines années.', kind: 'migration', speciesId: 'vanesse-des-chardons' },
    { title: 'Le concert de l’aube', text: 'Levez-vous avant le soleil : rougegorges, merles et mésanges offrent le plus beau concert de l’année.', kind: 'ecouter', speciesId: 'rougegorge' },
    { title: 'Ne pas tailler les haies', text: 'D’avril à juillet, les oiseaux nichent dans les haies : la taille est déconseillée pendant cette période.', kind: 'agir' },
  ],
  // Mai
  [
    { title: 'Les macareux en Bretagne', text: 'Aux Sept-Îles, la seule colonie française de macareux moines est en pleine activité : jumelles indispensables.', kind: 'observer', speciesId: 'macareux-moine' },
    { title: 'Escadrilles de martinets', text: 'Le soir, les martinets filent en criant entre les toits, à une vitesse étourdissante.', kind: 'ecouter', speciesId: 'martinet-noir' },
    { title: 'Premier vol du machaon', text: 'Le plus grand papillon de jour de France plane au-dessus des prairies fleuries et des jardins.', kind: 'observer', speciesId: 'machaon' },
    { title: 'Le martin-pêcheur nourrit ses petits', text: 'Un éclair bleu le long des rivières : les parents enchaînent les allers-retours entre l’eau et le terrier.', kind: 'observer', speciesId: 'martin-pecheur' },
    { title: 'Laisser pousser un coin de prairie', text: 'Ne pas tondre une partie du jardin offre fleurs et abri aux abeilles, aux papillons et aux sauterelles.', kind: 'agir', speciesId: 'abeille-domestique' },
  ],
  // Juin
  [
    { title: 'Les vers luisants s’allument', text: 'Par les nuits chaudes, les femelles de lampyre brillent dans l’herbe pour attirer les mâles.', kind: 'observer', speciesId: 'ver-luisant' },
    { title: 'Le lucane prend son envol', text: 'Au crépuscule, le plus grand coléoptère d’Europe vole lourdement autour des vieux chênes.', kind: 'observer', speciesId: 'lucane-cerf-volant' },
    { title: 'Les bébés hérissons', text: 'Les petits naissent au début de l’été ; une coupelle d’eau au jardin les aide pendant les fortes chaleurs.', kind: 'agir', speciesId: 'herisson-d-europe' },
    { title: 'L’anax patrouille les mares', text: 'La plus grande libellule de France défend son territoire au-dessus de l’eau, en vol stationnaire.', kind: 'observer', speciesId: 'anax-empereur' },
    { title: 'Éteindre les lumières', text: 'L’éclairage nocturne désoriente insectes, chauves-souris et vers luisants : chaque lampe éteinte compte.', kind: 'agir', speciesId: 'ver-luisant' },
  ],
  // Juillet
  [
    { title: 'Les dauphins en mer d’Iroise', text: 'Au large du Finistère vivent des groupes résidents de grands dauphins, parfois visibles depuis les bateaux.', kind: 'observer', speciesId: 'grand-dauphin' },
    { title: 'Les martinets s’en vont déjà', text: 'Dès la fin juillet, les martinets repartent vers l’Afrique : ils n’auront passé que trois mois chez nous.', kind: 'migration', speciesId: 'martinet-noir' },
    { title: 'Le chant des cigales', text: 'Dans le Midi, les cigales mâles chantent aux heures chaudes ; leurs larves ont passé plusieurs années sous terre.', kind: 'ecouter' },
    { title: 'Libellules au bord de l’eau', text: 'Étangs et rivières bourdonnent de libellules : c’est le pic de leur saison.', kind: 'observer', speciesId: 'anax-empereur' },
    { title: 'Un abreuvoir pour la faune', text: 'Une coupelle d’eau peu profonde, avec une pierre pour se poser, aide oiseaux et insectes en pleine canicule.', kind: 'agir' },
  ],
  // Août
  [
    { title: 'Les cigognes partent', text: 'Les jeunes cigognes blanches prennent les premières le chemin de l’Afrique, sans attendre leurs parents.', kind: 'migration', speciesId: 'cigogne-blanche' },
    { title: 'La mante religieuse est adulte', text: 'Fin d’été, la mante se tient immobile dans les herbes hautes, prête à capturer criquets et sauterelles.', kind: 'observer', speciesId: 'mante-religieuse' },
    { title: 'Les toiles de l’épeire', text: 'Au petit matin, les grandes toiles circulaires de l’épeire diadème, perlées de rosée, décorent les jardins.', kind: 'observer', speciesId: 'epeire-diademe' },
    { title: 'Le sphinx tête-de-mort de passage', text: 'Ce grand papillon migrateur venu du Sud peut s’introduire dans les ruches pour y voler du miel.', kind: 'migration', speciesId: 'sphinx-tete-de-mort' },
    { title: 'Nuits des chauves-souris', text: 'Fin août, de nombreuses animations font découvrir les chauves-souris à la tombée de la nuit.', kind: 'agir' },
  ],
  // Septembre
  [
    { title: 'Le brame du cerf', text: 'De mi-septembre à mi-octobre, les cerfs élaphes brament en forêt au crépuscule pour défendre leurs biches.', kind: 'ecouter', speciesId: 'cerf-elaphe' },
    { title: 'Les hirondelles se rassemblent', text: 'Alignées sur les fils, elles se préparent à traverser la Méditerranée et le Sahara.', kind: 'migration' },
    { title: 'Les rapaces passent les Pyrénées', text: 'Aux cols basques, des milliers de rapaces et de cigognes défilent : un spectacle unique en Europe.', kind: 'migration' },
    { title: 'L’écureuil fait ses réserves', text: 'Il enterre noisettes et glands un peu partout ; ceux qu’il oublie donneront de nouveaux arbres.', kind: 'observer', speciesId: 'ecureuil-roux' },
    { title: 'La mante pond son oothèque', text: 'La femelle colle sa ponte mousseuse sur une tige : elle passera l’hiver avant d’éclore au printemps.', kind: 'observer', speciesId: 'mante-religieuse' },
  ],
  // Octobre
  [
    { title: 'Les grues filent vers le sud', text: 'Des dizaines de milliers de grues cendrées font halte au lac du Der, en Champagne : un rendez-vous mythique.', kind: 'migration' },
    { title: 'Fin du brame', text: 'Les derniers combats de cerfs résonnent encore dans les grandes forêts de plaine.', kind: 'ecouter', speciesId: 'cerf-elaphe' },
    { title: 'Les sangliers fouillent les sous-bois', text: 'Glands et châtaignes attirent les compagnies de sangliers : prudence en lisière au crépuscule.', kind: 'observer', speciesId: 'sanglier' },
    { title: 'Le passage des pigeons ramiers', text: 'Au-dessus du Sud-Ouest, d’immenses vols de palombes descendent vers l’Espagne.', kind: 'migration' },
    { title: 'Un tas de feuilles pour l’hiver', text: 'Laisser un coin de feuilles mortes offre un abri au hérisson et aux insectes pour l’hiver.', kind: 'agir', speciesId: 'herisson-d-europe' },
  ],
  // Novembre
  [
    { title: 'Le rut du chamois', text: 'En montagne, les mâles poursuivent les femelles sur les pentes, avant les grandes neiges.', kind: 'observer', speciesId: 'chamois' },
    { title: 'Le saumon fraie', text: 'Les saumons atlantiques qui ont remonté les rivières pondent dans les graviers des cours d’eau, comme sur l’Allier.', kind: 'observer', speciesId: 'saumon-atlantique' },
    { title: 'Le hérisson s’endort', text: 'Dès les premiers froids, le hérisson entre en hibernation jusqu’au printemps.', kind: 'observer', speciesId: 'herisson-d-europe' },
    { title: 'Ouvrir les mangeoires', text: 'Avec le froid, on peut commencer à nourrir les oiseaux, en gardant mangeoires et abreuvoirs bien propres.', kind: 'agir', speciesId: 'mesange-charbonniere' },
    { title: 'Le grand passage des grues', text: 'Les dernières grues cendrées traversent la France vers l’Espagne et l’Afrique du Nord.', kind: 'migration' },
  ],
  // Décembre
  [
    { title: 'Le rut du bouquetin', text: 'Dans les Alpes, les vieux mâles aux longues cornes s’affrontent pour les femelles.', kind: 'observer', speciesId: 'bouquetin-des-alpes' },
    { title: 'Le rougegorge chante en hiver', text: 'Mâles et femelles chantent chacun pour défendre leur territoire, même par temps de gel.', kind: 'ecouter', speciesId: 'rougegorge' },
    { title: 'Le lagopède en blanc', text: 'En haute montagne, le lagopède alpin a revêtu son plumage blanc et se creuse des abris dans la neige.', kind: 'observer', speciesId: 'lagopede-alpin' },
    { title: 'Les renards commencent leur rut', text: 'Les nuits d’hiver résonnent des cris des renards, qui s’accouplent de décembre à février.', kind: 'ecouter', speciesId: 'renard-roux' },
    { title: 'Compter les oiseaux', text: 'Les comptages participatifs d’oiseaux des jardins font de chacun un naturaliste : il suffit d’une heure.', kind: 'agir' },
  ],
];

export const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
