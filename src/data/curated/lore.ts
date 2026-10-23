import type { Lore } from '../types';

/**
 * Histoire, mythes et symboles des espèces emblématiques.
 *
 * Règles de rédaction : des récits établis et vérifiables, la culture
 * d’origine en tête, 1 à 2 phrases chacun ; signaler les doutes plutôt que
 * de les taire (« selon la légende », « probablement »).
 */
export const LORE: Record<string, readonly Lore[]> = {
  // ─── Mammifères ───
  lion: [
    { culture: 'Égypte ancienne', text: 'Sekhmet, déesse guerrière à tête de lionne, incarnait la force brûlante du soleil ; selon le mythe, son souffle aurait créé le désert.' },
    { culture: 'Grèce antique', text: 'Le premier des douze travaux d’Héraclès fut d’étouffer le lion de Némée, dont la peau résistait à toutes les armes ; le héros s’en fit une armure.' },
    { culture: 'Héraldique', text: 'Roi des animaux dans les bestiaires médiévaux, c’est la figure la plus fréquente des blasons européens.' },
  ],
  tigre: [
    { culture: 'Chine', text: 'Le Tigre blanc garde l’Ouest parmi les quatre animaux symboles du ciel chinois ; le tigre est aussi le troisième signe du zodiaque.' },
    { culture: 'Inde', text: 'Monture de la déesse Durga, qui le chevauche pour combattre le démon-buffle Mahishasura.' },
  ],
  jaguar: [
    { culture: 'Mayas', text: 'Maître de la nuit, le dieu jaguar accompagnait le soleil dans son voyage à travers le monde souterrain ; les rois portaient sa peau en signe de pouvoir.' },
  ],
  guepard: [
    { culture: 'Inde moghole', text: 'Dressé pour la chasse par les pharaons comme par les princes moghols, il comptait parmi les trésors de l’empereur Akbar, qui en aurait possédé un millier.' },
  ],
  'lynx-boreal': [
    { culture: 'Grèce antique', text: 'L’expression « œil de lynx » doit beaucoup à Lyncée, Argonaute capable de voir à travers les murs, dont le nom évoque l’animal.' },
  ],
  'loup-gris': [
    { culture: 'Rome antique', text: 'Selon la légende, Romulus et Rémus, fondateurs de Rome, furent allaités par une louve : la Louve capitoline en est devenue l’emblème.' },
    { culture: 'Mythologie nordique', text: 'Le loup géant Fenrir, enchaîné par les dieux, doit se libérer au Ragnarök et engloutir Odin.' },
    { culture: 'France, XVIIIᵉ siècle', text: 'La Bête du Gévaudan, qui fit une centaine de victimes entre 1764 et 1767, fut attribuée selon les hypothèses à un ou plusieurs grands loups.' },
  ],
  'renard-roux': [
    { culture: 'Japon', text: 'Le kitsune, messager du dieu Inari, gagnerait une queue tous les cent ans, jusqu’à neuf, et le pouvoir de prendre forme humaine.' },
    { culture: 'France médiévale', text: 'Le Roman de Renart (XIIᵉ–XIIIᵉ siècle) rendit son héros si célèbre que « renard » a remplacé l’ancien nom de l’animal, le goupil.' },
  ],
  'hyene-tachetee': [
    { culture: 'Bestiaires médiévaux', text: 'On la disait capable de changer de sexe et d’imiter la voix humaine pour attirer ses victimes, croyances héritées de Pline l’Ancien.' },
    { culture: 'Afrique de l’Est', text: 'Dans de nombreux contes, la hyène est le personnage glouton et maladroit, toujours dupé par le lièvre rusé.' },
  ],
  'ours-brun': [
    { culture: 'Grèce antique', text: 'Selon une version du mythe, la nymphe Callisto fut changée en ourse, puis placée dans le ciel par Zeus : c’est la Grande Ourse.' },
    { culture: 'Celtes', text: 'Longtemps roi des animaux en Europe avant le lion, l’ours était vénéré par les Celtes, comme la déesse Artio, représentée près d’un ours sur une statuette trouvée près de Berne.' },
  ],
  'ours-polaire': [
    { culture: 'Inuits', text: 'Nanuq, l’ours blanc, est un animal puissant et respecté ; selon la tradition, son esprit devait être honoré par le chasseur qui l’avait tué.' },
  ],
  'elephant-d-asie': [
    { culture: 'Hindouisme', text: 'Ganesh, dieu à tête d’éléphant, lève les obstacles : on l’invoque au début de toute entreprise.' },
    { culture: 'Bouddhisme', text: 'Avant la naissance du Bouddha, sa mère, la reine Maya, aurait rêvé qu’un éléphant blanc à six défenses entrait en elle.' },
  ],
  'elephant-de-savane': [
    { culture: 'Antiquité', text: 'En 218 av. J.-C., Hannibal franchit les Alpes avec 37 éléphants de guerre — sans doute des éléphants d’Afrique du Nord, des cousins aujourd’hui disparus.' },
  ],
  hippopotame: [
    { culture: 'Égypte ancienne', text: 'Taouret, déesse au corps d’hippopotame femelle, protégeait les femmes enceintes et les nouveau-nés.' },
    { culture: 'Égypte ancienne', text: 'Le mâle, lui, incarnait le chaos : le dieu Seth en prenait parfois la forme pour affronter Horus.' },
  ],
  girafe: [
    { culture: 'Chine des Ming', text: 'En 1414, une girafe offerte à l’empereur Yongle fut saluée comme un qilin, créature fabuleuse annonçant un règne vertueux.' },
    { culture: 'France, 1827', text: 'Zarafa, offerte au roi Charles X, gagna Paris à pied depuis Marseille et déclencha une véritable « girafomanie ».' },
  ],
  'cerf-elaphe': [
    { culture: 'Gaule', text: 'Le dieu gaulois Cernunnos porte des bois de cerf, comme sur le célèbre chaudron de Gundestrup.' },
    { culture: 'Chrétienté', text: 'Saint Hubert, patron des chasseurs, se serait converti après avoir vu un crucifix lumineux entre les bois d’un cerf.' },
  ],
  renne: [
    { culture: 'Sames', text: 'Pour les Sames de Laponie, l’élevage du renne règle depuis des siècles la vie, les migrations et le calendrier.' },
    { culture: 'Folklore de Noël', text: 'Les rennes du père Noël naissent d’un poème américain de 1823, « A Visit from St. Nicholas », qui en nomme huit ; Rudolph s’y ajouta en 1939.' },
  ],
  'bison-d-europe': [
    { culture: 'Préhistoire', text: 'Ses proches parents de l’âge glaciaire, les bisons des steppes, comptent parmi les animaux les plus peints à Altamira et à Lascaux.' },
    { culture: 'XXᵉ siècle', text: 'Éteint à l’état sauvage dans les années 1920, il fut sauvé grâce à une cinquantaine d’animaux de zoos, puis réintroduit dans la forêt de Białowieża.' },
  ],
  sanglier: [
    { culture: 'Gaule', text: 'Emblème des Gaulois, il figurait sur leurs enseignes militaires et leurs monnaies.' },
    { culture: 'Grèce antique', text: 'Héraclès dut capturer vivant le sanglier d’Érymanthe : c’est le quatrième de ses douze travaux.' },
  ],
  dromadaire: [
    { culture: 'Arabie', text: 'Surnommé le « vaisseau du désert », il rendit possibles les grandes routes caravanières de l’encens et des épices.' },
    { culture: 'Islam', text: 'La tradition rapporte que le prophète Mahomet laissa sa chamelle, Qaswa, choisir l’emplacement de sa mosquée à Médine.' },
  ],
  'gorille-de-l-ouest': [
    { culture: 'Carthage', text: 'Son nom vient du récit du navigateur Hannon (Vᵉ siècle av. J.-C.), qui décrit des êtres velus appelés « gorillai » sur la côte africaine.' },
  ],
  cachalot: [
    { culture: 'Littérature', text: 'Moby Dick, d’Herman Melville (1851), s’inspire du naufrage du baleinier Essex, coulé par un cachalot en 1820.' },
    { culture: 'Parfumerie', text: 'L’ambre gris, concrétion formée dans son intestin, valait autrefois plus que son poids d’or.' },
  ],
  'baleine-a-bosse': [
    { culture: 'Conquête spatiale', text: 'En 1977, les sondes Voyager emportèrent hors du système solaire un disque doré contenant des chants de baleine à bosse.' },
  ],
  orque: [
    { culture: 'Côte Nord-Ouest', text: 'Pour les Haïdas et les Tlingits, l’épaulard est un esprit marin puissant, sculpté sur de nombreux mâts totémiques.' },
    { culture: 'Rome antique', text: 'Son nom scientifique, Orcinus, évoque Orcus, dieu romain du royaume des morts.' },
  ],
  'grand-dauphin': [
    { culture: 'Grèce antique', text: 'Le poète Arion, jeté à la mer par des pirates, aurait été ramené à terre par un dauphin charmé par son chant.' },
    { culture: 'Grèce antique', text: 'Apollon serait arrivé à Delphes sous la forme d’un dauphin, d’où son surnom d’Apollon Delphinios.' },
  ],
  narval: [
    { culture: 'Moyen Âge', text: 'Sa défense, vendue comme corne de licorne, valait des fortunes ; le trône des rois du Danemark en est fait.' },
  ],
  dugong: [
    { culture: 'Marins', text: 'Les navigateurs auraient pris dugongs et lamantins pour des sirènes : leur ordre s’appelle d’ailleurs les siréniens.' },
  ],
  'kangourou-roux': [
    { culture: 'Australie', text: 'La légende veut que « kangourou » signifie « je ne comprends pas » : c’est faux, le mot vient de gangurru, en langue guugu yimithirr.' },
  ],
  ornithorynque: [
    { culture: 'Angleterre, 1799', text: 'Le premier spécimen envoyé à Londres fut pris pour un canular : le naturaliste George Shaw chercha les coutures du bec.' },
  ],
  thylacine: [
    { culture: 'Australie, 1936', text: 'Le dernier tigre de Tasmanie connu mourut au zoo de Hobart en septembre 1936 ; le 7 septembre est devenu la journée nationale des espèces menacées en Australie.' },
  ],
  'herisson-d-europe': [
    { culture: 'Bestiaires médiévaux', text: 'Selon Pline et les bestiaires, il roulait sur les fruits tombés pour les emporter piqués sur son dos.' },
  ],
  'castor-d-europe': [
    { culture: 'Bestiaires médiévaux', text: 'On racontait qu’il se mutilait pour échapper aux chasseurs qui convoitaient son castoréum, une sécrétion utilisée en médecine.' },
  ],
  'vampire-commun': [
    { culture: 'Europe', text: 'C’est la chauve-souris qui doit son nom aux légendes de vampires d’Europe de l’Est, et non l’inverse.' },
  ],
  'tapir-de-malaisie': [
    { culture: 'Japon', text: 'Le baku, créature qui dévore les cauchemars, a fini par donner son nom japonais au tapir.' },
  ],
  'ecureuil-roux': [
    { culture: 'Mythologie nordique', text: 'Ratatosk, l’écureuil de l’arbre-monde Yggdrasil, colportait les insultes entre l’aigle du sommet et le dragon des racines.' },
  ],

  // ─── Oiseaux ───
  'aigle-royal': [
    { culture: 'Grèce et Rome', text: 'Oiseau de Zeus et emblème des légions romaines, l’aigle est resté le symbole des empires, de Charlemagne à Napoléon.' },
  ],
  'pygargue-a-tete-blanche': [
    { culture: 'États-Unis', text: 'Emblème national depuis 1782, il figure sur le grand sceau des États-Unis.' },
  ],
  'faucon-pelerin': [
    { culture: 'Égypte ancienne', text: 'Horus, dieu du ciel, a une tête de faucon ; ses yeux étaient le soleil et la lune.' },
    { culture: 'Patrimoine', text: 'La fauconnerie, pratiquée depuis plus de 3 000 ans, est inscrite au patrimoine culturel immatériel de l’UNESCO.' },
  ],
  'effraie-des-clochers': [
    { culture: 'Campagnes d’Europe', text: 'Ses cris et sa silhouette blanche dans les clochers lui valurent une réputation d’oiseau de malheur, au point d’être clouée aux portes des granges.' },
  ],
  'harfang-des-neiges': [
    { culture: 'Littérature', text: 'Hedwige, la chouette de Harry Potter, est un harfang des neiges.' },
  ],
  'grand-corbeau': [
    { culture: 'Mythologie nordique', text: 'Odin possédait deux corbeaux, Hugin (« pensée ») et Munin (« mémoire »), qui parcouraient le monde pour lui rapporter les nouvelles.' },
    { culture: 'Angleterre', text: 'Si les corbeaux quittaient la tour de Londres, dit la légende, le royaume s’effondrerait : on y en garde toujours au moins six.' },
    { culture: 'Côte Nord-Ouest', text: 'Chez les Haïdas, Corbeau le rusé aurait libéré le soleil, la lune et les étoiles enfermés dans une boîte.' },
  ],
  'pie-bavarde': [
    { culture: 'Opéra', text: 'Réputée voleuse d’objets brillants, comme dans La Pie voleuse de Rossini (1817) — une réputation que les études n’ont pas confirmée.' },
  ],
  'paon-bleu': [
    { culture: 'Grèce antique', text: 'Héra plaça sur sa queue les cent yeux du géant Argus, tué par Hermès.' },
    { culture: 'Inde', text: 'Oiseau national de l’Inde, il est la monture de Kartikeya, dieu de la guerre.' },
  ],
  'cigogne-blanche': [
    { culture: 'Alsace', text: 'La légende veut qu’elle apporte les bébés ; elle est devenue l’emblème de l’Alsace.' },
  ],
  'grue-du-japon': [
    { culture: 'Japon', text: 'Plier mille grues en papier (senbazuru) permettrait d’exaucer un vœu ; Sadako Sasaki en fit un symbole de paix après Hiroshima.' },
  ],
  'quetzal-resplendissant': [
    { culture: 'Mésoamérique', text: 'Mayas et Aztèques réservaient ses plumes aux souverains ; le serpent à plumes Quetzalcoatl lui doit son nom.' },
    { culture: 'Guatemala', text: 'Oiseau national, il a donné son nom à la monnaie du pays.' },
  ],
  'colibri-d-elena': [
    { culture: 'Aztèques', text: 'Le nom de Huitzilopochtli, dieu du soleil et de la guerre, signifie « colibri du sud » ; les guerriers morts renaissaient en colibris.' },
  ],
  'flamant-rose': [
    { culture: 'Égypte ancienne', text: 'Le hiéroglyphe représentant un flamant servait à écrire le mot « rouge ».' },
  ],
  'martin-pecheur': [
    { culture: 'Grèce antique', text: 'Alcyone, changée en martin-pêcheur, obtint des dieux des jours de mer calme pour couver : ce sont les « jours alcyoniens ».' },
  ],
  rougegorge: [
    { culture: 'Légende chrétienne', text: 'Il se serait taché la gorge de sang en arrachant une épine de la couronne du Christ.' },
  ],
  'coucou-gris': [
    { culture: 'Langue française', text: 'Le mot « cocu » vient de son nom, en souvenir de ses mœurs : la femelle pond dans le nid des autres.' },
  ],
  'huppe-fasciee': [
    { culture: 'Coran', text: 'La huppe sert de messagère entre le roi Salomon et la reine de Saba ; dans La Conférence des oiseaux d’Attar, elle guide les oiseaux en quête de leur roi.' },
  ],
  autruche: [
    { culture: 'Égypte ancienne', text: 'Maât, déesse de la vérité, portait une plume d’autruche ; le cœur des défunts était pesé contre elle.' },
    { culture: 'Idée reçue', text: 'Elle ne se cache pas la tête dans le sable : ce mythe, déjà chez Pline l’Ancien, vient de ce qu’elle retourne ses œufs ou se plaque au sol.' },
  ],
  'kiwi-de-mantell': [
    { culture: 'Nouvelle-Zélande', text: 'Emblème du pays, il a donné son surnom aux Néo-Zélandais… puis au fruit, rebaptisé ainsi pour l’exportation.' },
  ],
  'manchot-empereur': [
    { culture: 'Cinéma', text: 'La Marche de l’empereur (2005), de Luc Jacquet, a reçu l’Oscar du meilleur documentaire.' },
  ],
  'albatros-hurleur': [
    { culture: 'Littérature', text: 'Dans La Complainte du vieux marin de Coleridge, tuer un albatros attire la malédiction ; Baudelaire en fit le symbole du poète.' },
  ],
  dodo: [
    { culture: 'Littérature', text: 'Disparu vers la fin du XVIIᵉ siècle, il revit dans Alice au pays des merveilles (1865), où Lewis Carroll l’aurait choisi en clin d’œil à son propre bégaiement : « Do-Do-Dodgson ».' },
    { culture: 'Langue anglaise', text: 'L’expression « dead as a dodo » désigne ce qui a définitivement disparu.' },
  ],

  // ─── Reptiles et amphibiens ───
  'crocodile-du-nil': [
    { culture: 'Égypte ancienne', text: 'Sobek, dieu à tête de crocodile, régnait sur le Nil ; à Crocodilopolis, on choyait des crocodiles sacrés, momifiés à leur mort.' },
    { culture: 'Expression', text: 'Les « larmes de crocodile » viennent d’une croyance médiévale : il pleurerait en dévorant ses proies.' },
  ],
  'cobra-royal': [
    { culture: 'Inde', text: 'Les nagas, divinités-serpents de l’hindouisme et du bouddhisme, ont l’apparence de cobras ; Shiva en porte un enroulé autour du cou.' },
  ],
  'vipere-aspic': [
    { culture: 'Antiquité', text: 'Cléopâtre se serait donné la mort par la morsure d’un « aspic » en 30 av. J.-C. — sans doute un cobra égyptien plutôt que cette vipère européenne.' },
  ],
  'python-reticule': [
    { culture: 'Grèce antique', text: 'Le mot « python » vient du serpent monstrueux qu’Apollon tua à Delphes pour y fonder son oracle.' },
  ],
  'dragon-de-komodo': [
    { culture: 'Indonésie', text: 'Les pêcheurs parlaient d’un « buaya darat », un crocodile terrestre ; la science ne le décrivit qu’en 1912.' },
  ],
  'cameleon-panthere': [
    { culture: 'Antiquité', text: 'On croyait qu’il se nourrissait d’air, faute de le voir manger : sa langue est trop rapide pour l’œil.' },
  ],
  'tortue-des-galapagos': [
    { culture: 'Histoire', text: 'L’archipel lui doit son nom : « galápago » désignait en vieil espagnol une tortue, ou une selle à laquelle sa carapace fait penser.' },
  ],
  'salamandre-tachetee': [
    { culture: 'Renaissance', text: 'On la croyait capable de vivre dans le feu : François Iᵉʳ en fit son emblème, avec la devise « Je m’en nourris et je l’éteins ».' },
  ],
  axolotl: [
    { culture: 'Aztèques', text: 'Son nom vient de Xolotl, dieu qui, pour échapper au sacrifice, se serait changé en axolotl.' },
  ],
  'crapaud-commun': [
    { culture: 'Europe médiévale', text: 'Compagnon supposé des sorcières, il passait pour cacher dans sa tête une pierre aux vertus magiques, la crapaudine.' },
  ],

  // ─── Poissons ───
  'saumon-atlantique': [
    { culture: 'Irlande', text: 'Le héros Fionn mac Cumhaill acquit toute la sagesse du monde en goûtant le saumon de la connaissance.' },
  ],
  'grand-requin-blanc': [
    { culture: 'Cinéma', text: 'Les Dents de la mer (1975) en fit un monstre ; l’auteur du roman, Peter Benchley, consacra ensuite sa vie à défendre les requins.' },
  ],
  'poisson-clown': [
    { culture: 'Cinéma', text: 'Le Monde de Nemo (2003) a rendu célèbres les poissons-clowns, au point d’en faire augmenter les captures pour les aquariums.' },
  ],
  fugu: [
    { culture: 'Japon', text: 'Seuls des cuisiniers titulaires d’une licence spéciale ont le droit de le préparer ; il fut longtemps interdit à l’empereur.' },
  ],
  'anguille-europeenne': [
    { culture: 'Sciences', text: 'Le mystère de sa reproduction, qui intriguait déjà Aristote, ne fut levé qu’au XXᵉ siècle : en 1922, Johannes Schmidt situa sa ponte dans la mer des Sargasses.' },
  ],
  'hippocampe-mouchete': [
    { culture: 'Grèce antique', text: 'Les hippocampes, chevaux marins à queue de poisson, tiraient le char de Poséidon.' },
  ],

  // ─── Invertébrés ───
  'bousier-sacre': [
    { culture: 'Égypte ancienne', text: 'Le scarabée qui roule sa boule évoquait Khépri, le dieu qui pousse le soleil chaque matin ; ses amulettes accompagnaient vivants et défunts.' },
  ],
  'abeille-domestique': [
    { culture: 'Égypte ancienne', text: 'Les abeilles seraient nées des larmes du dieu soleil Râ.' },
    { culture: 'France', text: 'Napoléon choisit l’abeille comme emblème impérial, en référence aux abeilles d’or trouvées dans la tombe du roi franc Childéric.' },
  ],
  'mante-religieuse': [
    { culture: 'Grèce antique', text: 'Son nom vient du grec mantis, « devin » : sa posture de prière intriguait déjà les Anciens.' },
    { culture: 'Chine', text: 'La boxe de la mante religieuse, un style de kung-fu, imite ses attaques fulgurantes.' },
  ],
  'coccinelle-a-sept-points': [
    { culture: 'France', text: 'Une légende du Xᵉ siècle raconte qu’elle sauva un condamné en se posant sur sa nuque : le roi y vit un signe divin, d’où son surnom de « bête à bon Dieu ».' },
  ],
  monarque: [
    { culture: 'Mexique', text: 'Son arrivée coïncide avec le Jour des morts : on y voit les âmes des défunts qui reviennent visiter les vivants.' },
  ],
  machaon: [
    { culture: 'Grèce antique', text: 'Linné lui donna le nom de Machaon, médecin grec de la guerre de Troie et fils d’Asclépios.' },
    { culture: 'Grèce antique', text: 'Le mot grec psyché désignait à la fois l’âme et le papillon.' },
  ],
  'sphinx-tete-de-mort': [
    { culture: 'Cinéma', text: 'La tache en forme de crâne de son thorax en a fait un présage de mort ; il orne l’affiche du Silence des agneaux (1991).' },
  ],
  'cigale-periodique': [
    { culture: 'Amérique coloniale', text: 'Ses émergences massives furent prises par les premiers colons pour des nuées de sauterelles bibliques ; on l’appelle encore « locust » aux États-Unis.' },
  ],
  'criquet-pelerin': [
    { culture: 'Bible', text: 'La huitième plaie d’Égypte est une nuée de sauterelles qui dévore toutes les récoltes.' },
  ],
  'lucane-cerf-volant': [
    { culture: 'Folklore européen', text: 'Une croyance populaire l’accusait de transporter des braises dans ses mandibules et d’allumer des incendies.' },
  ],
  'epeire-diademe': [
    { culture: 'Grèce antique', text: 'Arachné, tisserande qui osa défier Athéna, fut changée en araignée et condamnée à tisser pour l’éternité ; elle a donné son nom aux arachnides.' },
  ],
  'scorpion-empereur': [
    { culture: 'Grèce antique', text: 'Un scorpion envoyé par Gaïa tua le chasseur Orion ; les deux devinrent des constellations, placées pour ne jamais se croiser dans le ciel.' },
  ],
  'calmar-geant': [
    { culture: 'Scandinavie', text: 'Le Kraken, monstre capable d’engloutir des navires, s’inspirerait des rares calmars géants observés par les marins.' },
    { culture: 'Littérature', text: 'Dans Vingt mille lieues sous les mers (1870), le Nautilus affronte des « poulpes » géants inspirés des calmars géants.' },
  ],
  'pieuvre-commune': [
    { culture: 'Littérature', text: 'Victor Hugo popularisa le mot « pieuvre », emprunté au parler des îles Anglo-Normandes, dans Les Travailleurs de la mer (1866).' },
  ],
  nautile: [
    { culture: 'Renaissance', text: 'Sa coquille, montée en coupe d’orfèvrerie, était un joyau des cabinets de curiosités.' },
    { culture: 'Littérature', text: 'Jules Verne baptisa Nautilus le sous-marin du capitaine Nemo.' },
  ],
  'sangsue-medicinale': [
    { culture: 'France, XIXᵉ siècle', text: 'La mode des saignées était telle que la France en importa des dizaines de millions par an, au point de presque les faire disparaître.' },
  ],
  'hydre-d-eau-douce': [
    { culture: 'Grèce antique', text: 'Linné la baptisa d’après l’hydre de Lerne, dont les têtes repoussaient : elle aussi régénère son corps entier.' },
  ],
  physalie: [
    { culture: 'Marine', text: 'Son nom anglais, Portuguese man o’ war, la compare à une caravelle portugaise toutes voiles dehors.' },
  ],
};
