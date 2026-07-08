// src/data/horoscoponey.js
// ─────────────────────────────────────────────────────────────────────────
// HOROSCOPONEY — l'horoscope (parodique) des cavaliers.
//
// Modèle HYBRIDE (décidé avec Joseph) :
//   • chaque SIGNE a une personnalité fixe (archétype cavalier) ;
//   • les PRÉDICTIONS sont un grand réservoir PARTAGÉ, distribué par signe ;
//   • le tirage « du jour » est fait CÔTÉ CLIENT par un hash déterministe de
//     (date + slug du signe) → même résultat pour tous les visiteurs un jour
//     donné, change chaque jour, ZÉRO backend, ZÉRO rebuild (SSG pur).
//
// Données versionnées dans le repo (pas Strapi) : contenu généré en masse,
// pas édité à la main au quotidien. Migrable vers Strapi plus tard si besoin.
//
// Prototype : ~60 prédictions. On scalera à 300-1000 une fois la mécanique
// et le ton validés. Les `glyph` (symboles zodiacaux) sont des PLACEHOLDERS
// en attendant les illustrations dédiées de chaque signe.
// ─────────────────────────────────────────────────────────────────────────

/** Les 12 signes, dans l'ordre du zodiaque. */
export const SIGNS = [
  { slug: 'belier',      name: 'Bélier',      glyph: '♈', dates: '21 mars – 19 avril',     archetype: 'Aborde chaque obstacle comme une affaire personnelle.' },
  { slug: 'taureau',     name: 'Taureau',     glyph: '♉', dates: '20 avril – 20 mai',      archetype: 'Ne bougera pas du paddock tant que la ration n’est pas servie.' },
  { slug: 'gemeaux',     name: 'Gémeaux',     glyph: '♊', dates: '21 mai – 20 juin',       archetype: 'Deux mains, deux rênes, quinze idées contradictoires.' },
  { slug: 'cancer',      name: 'Cancer',      glyph: '♋', dates: '21 juin – 22 juillet',   archetype: 'Pleure au démontage comme si c’était un adieu.' },
  { slug: 'lion',        name: 'Lion',        glyph: '♌', dates: '23 juillet – 22 août',   archetype: 'Pose pour la photo avant, pendant et après la chute.' },
  { slug: 'vierge',      name: 'Vierge',      glyph: '♍', dates: '23 août – 22 septembre', archetype: 'Range ses brosses par ordre de dureté.' },
  { slug: 'balance',     name: 'Balance',     glyph: '♎', dates: '23 septembre – 22 octobre', archetype: 'Hésite entre le filet et le mors pendant 45 minutes.' },
  { slug: 'scorpion',    name: 'Scorpion',    glyph: '♏', dates: '23 octobre – 21 novembre', archetype: 'Garde rancune au cheval qui l’a désarçonné en 2019.' },
  { slug: 'sagittaire',  name: 'Sagittaire',  glyph: '♐', dates: '22 novembre – 21 décembre', archetype: 'Part en extérieur “juste 20 minutes”, rentre à la nuit.' },
  { slug: 'capricorne',  name: 'Capricorne',  glyph: '♑', dates: '22 décembre – 19 janvier', archetype: 'Travaille le plat un 1er janvier sous la pluie.' },
  { slug: 'verseau',     name: 'Verseau',     glyph: '♒', dates: '20 janvier – 18 février', archetype: 'A une théorie éthologique pour absolument tout.' },
  { slug: 'poissons',    name: 'Poissons',    glyph: '♓', dates: '19 février – 20 mars',    archetype: 'Parle à son cheval plus qu’à sa famille.' },
];

/** Jauges parodiques affichées par signe (valeurs date-seedées côté client). */
export const GAUGES = [
  { key: 'concours', label: 'Chance en concours' },
  { key: 'humeur',   label: 'Humeur du poney' },
  { key: 'crottin',  label: 'Niveau de crottin' },
];

/**
 * Réservoir PARTAGÉ de prédictions. Volontairement rédigées en « tu / ton
 * cheval » pour s'appliquer à n'importe quel signe. Ton familier/punchy.
 */
export const PREDICTIONS = [
  'Cette semaine, ton cheval fera semblant de ne pas te reconnaître au pré. Ne le prends pas personnellement.',
  'Un astre contrarié t’annonce un refus à l’obstacle n°3. Comme la semaine dernière. Comme toujours.',
  'Mercure rétrograde : ton cheval roulera dans la boue exactement quatre minutes après le pansage.',
  'Les étoiles sont formelles : ta selle sera propre. Pendant douze minutes.',
  'Belle énergie cette semaine. Ton cheval la dépensera entièrement à fuir le van.',
  'Vénus t’encourage à tenter le galop à faux. Vénus n’a jamais monté.',
  'Un imprévu financier approche. Il s’appelle « le maréchal-ferrant ».',
  'Ton thème astral révèle une grande compatibilité avec le foin. Réciproque non garantie.',
  'Jupiter t’invite à la patience. Ton cheval, lui, t’invite à courir après lui dans le pré.',
  'Cette semaine, tu diras « juste une dernière reprise » trois fois. Tu mens.',
  'Les planètes s’alignent pour un parcours sans-faute. Les planètes se trompent souvent.',
  'Saturne t’annonce une facture vétérinaire pile le jour de ta paie.',
  'Ton cheval te fixe depuis le fond du box. Il sait quelque chose que tu ignores.',
  'Énergie lunaire intense : ton poney aura peur d’un sac plastique qu’il croise tous les jours depuis trois ans.',
  'Un astre bienveillant t’offre une magnifique détente. Suivie d’un magnifique écart.',
  'Cette semaine, tu achèteras encore un tapis « parce qu’il manquait cette couleur ».',
  'Les étoiles te conseillent de vérifier la sangle. Les étoiles ont déjà vu la suite.',
  'Mars en force : ton cheval décidera que la flaque d’eau est, en réalité, un gouffre.',
  'Ton horoscope t’annonce de l’amour. Avec un quadrupède qui te mord quand tu le brosses.',
  'Bonne nouvelle des astres : ta botte droite sèche enfin. Mauvaise nouvelle : c’est la gauche, maintenant.',
  'Pluton t’invite à lâcher prise. Ton cheval a lâché prise depuis longtemps.',
  'Cette semaine, le mors propre de lundi sera une légende racontée le dimanche.',
  'Les astres détectent une forte présence de poils sur tes vêtements. Tous tes vêtements.',
  'Neptune annonce un moment de grâce : ton cheval se tiendra immobile au montoir. Profites-en, c’est rare.',
  'Énergie de feu : ton poney transformera une balade tranquille en championnat de cross improvisé.',
  'Ton thème du jour : « foin partout, argent nulle part ».',
  'Un transit planétaire t’annonce que la longe finira, encore, enroulée autour de tes chevilles.',
  'Les étoiles sont catégoriques : il fera beau le jour de ton repos, et il pleuvra à ton concours.',
  'Cette semaine, tu expliqueras à quelqu’un, très sérieusement, ce qu’est un « pas espagnol ».',
  'Vénus favorise les rapprochements. Ton cheval se rapprochera surtout de ta poche à friandises.',
  'Astres taquins : ton cheval sera parfait toute la séance, sauf à l’instant exact où ta monitrice regarde.',
  'Mercure t’annonce une révélation : tu as encore oublié ta cravache à la maison.',
  'Cette semaine, ton cheval éternuera précisément sur ton visage. Considère-le comme une bénédiction.',
  'Les planètes t’invitent à la détente. Ton dos, lui, t’invite chez l’ostéopathe.',
  'Un astre généreux t’offrira un licol neuf. Ton cheval l’offrira au premier buisson.',
  'Énergie d’eau cette semaine : essentiellement dans tes bottes.',
  'Ton horoscope annonce une rentrée d’argent. Annulée par l’achat d’un nouveau filet « en promo ».',
  'Saturne te rappelle que « juste regarder » au sellier n’existe pas.',
  'Cette semaine, ton cheval bâillera pendant ta plus belle figure. Le public, c’est lui.',
  'Les astres prédisent un grand calme. Puis un oiseau s’envolera, et ce sera fini.',
  'Jupiter t’annonce une victoire. Sur le nœud de ta longe, mais une victoire quand même.',
  'Ton thème astral signale une forte odeur de cheval. Tu ne la sens plus. Les autres, si.',
  'Cette semaine, tu diras « il est gentil d’habitude » à au moins une personne terrifiée.',
  'Les planètes annoncent une éclaircie. Ton cheval annonce un dérobé.',
  'Un astre malicieux fera tomber ta bombe dans le crottin. Pile dedans.',
  'Mercure rétrograde : tu retrouveras la brosse perdue le mois dernier. Dans la mauvaise sacoche.',
  'Cette semaine, ton cheval testera la clôture. Spoiler : elle marche.',
  'Vénus t’invite à l’introspection pendant que tu cures le huitième sabot de la soirée.',
  'Les étoiles t’annoncent un cavalier épanoui. Et un compte en banque qui ne l’est pas.',
  'Énergie ascendante : celle de ton cheval qui se cabre pour un papillon.',
  'Ton horoscope prévoit un imprévu. En équitation, ça s’appelle « mardi ».',
  'Cette semaine, tu choisiras entre dormir et aller à l’écurie. Tu iras à l’écurie.',
  'Neptune t’annonce des rêves profonds. Principalement de carrières et de van qui démarre du premier coup.',
  'Les astres détectent un nouveau bleu sur ta jambe. Tu ne sauras jamais d’où il vient.',
  'Un transit favorable : ton cheval mangera sa ration. Toute. Surtout la part du voisin.',
  'Cette semaine, le galop sera parfait dans ta tête et discutable dans la carrière.',
  'Mars t’invite au courage : ouvrir la facture de la pension.',
  'Ton thème du jour annonce « encore un peu de foin dans le col ». Les astres compatissent.',
  'Les planètes promettent une belle complicité. Scellée par un coup de tête affectueux qui te décoiffe.',
  'Cette semaine, ton cheval sera d’humeur. Laquelle ? Mystère, comme chaque jour.',
];
