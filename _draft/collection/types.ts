/**
 * Modèle de la Collection — TypeScript pur, zéro dépendance, zéro import Astro.
 *
 * C'est délibéré : la techno du site n'est pas arrêtée. Ce fichier doit survivre
 * à un changement d'Astro vers autre chose. Tout ce qui est spécifique à un
 * framework (schémas Zod, loaders, routage, pipeline d'images) vit ailleurs et
 * se réécrit en une heure ; le modèle, lui, est ce qui coûte cher à changer une
 * fois les données saisies à la main.
 */

import type { IsoDate, PartialDate } from './partial-date';

/* ────────────────────────────────────────────────────────────────────────────
   Identifiants
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Clé primaire, lisible, tapable à la main, et URL publique.
 *
 * Pas d'UUID : illisible dans un fichier édité à la main, une étape de plus
 * pour ajouter une entrée, et ça n'achète rien tant qu'il n'y a pas de second
 * système à joindre. Le jour où ATLAS existe, le pont est `wikidata`, qui est
 * une meilleure clé de jointure qu'un UUID frappé ici.
 *
 * ⚠️ Un slug publié est une URL : traite-le comme IMMUABLE. Renommage
 * nécessaire → ajouter l'ancien dans `aliases` + poser une redirection.
 */
export type Slug = string;

/* ────────────────────────────────────────────────────────────────────────────
   Vocabulaires fermés
   ──────────────────────────────────────────────────────────────────────────── */

export const COLLECTION_TYPES = [
  'citation',
  'livre',
  'vinyl',
  'video',
  'film',
  'article',
] as const;

export type CollectionType = (typeof COLLECTION_TYPES)[number];

/**
 * Le rôle est fermé, et c'est le point : c'est la dérive du vocabulaire
 * (`auteur` / `author` / `Auteur` / `autrice`) qui détruirait le regroupement
 * par nom — c'est-à-dire l'exigence même de la Collection.
 *
 * Fermé n'est pas figé : ajouter un rôle = une ligne ici, zéro migration.
 * Le cas vraiment inclassable passe par `Credit.note`, JAMAIS par une valeur
 * libre : la machine garde un rôle groupable, l'humain garde sa nuance.
 *
 * Clés machine non genrées. « Autrice » est un problème d'affichage, résolu au
 * rendu à partir de `Agent.gender` — pas une valeur stockée dans la donnée.
 */
export const COLLECTION_ROLES = [
  // — écrit
  /** Qui a écrit les mots. Attesté 115 fois sur 123 dans le corpus Notion. */
  'author',
  /** Non attesté dans le corpus de citations, mais inévitable dès le premier livre. */
  'translator',
  'editor',
  // — audiovisuel / musique
  /** Luc Besson pour la scène d'ouverture du Cinquième Élément. */
  'director',
  /**
   * La personne AGIT, et son action EST le contenu.
   * → Dany Bill dans ses combats, Pierre Mondy jouant César, un musicien sur scène.
   */
  'performer',
  /**
   * Qui PRONONCE la phrase, sans l'avoir écrite ni l'incarner.
   * → Jean d'Ormesson récitant Aragon à la télévision ; le personnage César,
   *   dont Astier est l'auteur. Distinct de `performer` : d'Ormesson ne joue pas.
   */
  'speaker',
  /** Non attesté dans le corpus, mais inévitable dès le premier vinyl. */
  'composer',
  // — parole
  /** George Carlin invité chez Bill Maher ; Cousteau répondant à une journaliste. */
  'interviewee',
  'interviewer',
  /**
   * Qui diffuse : une chaîne YouTube, un label, une maison d'édition, un studio.
   * Presque toujours un agent `kind: 'organization'`.
   */
  'publisher',
  /**
   * L'item PARLE D'ELLE, elle n'y a pas contribué.
   * → Simone Weil dans la vidéo « Paroles de philosophes » ; Simone Weil encore,
   *   dans la phrase de Camus sur elle.
   */
  'subject',
] as const;

/* Retirés après lecture du corpus réel : `illustrator`, `photographer`,
   `narrator`. Aucun des 123 items n'en a besoin, et `narrator` faisait doublon
   avec `speaker`. Règle appliquée : tout rôle pour lequel on ne peut pas citer
   un item existant est spéculatif. Les rajouter est une ligne. */

export type CollectionRole = (typeof COLLECTION_ROLES)[number];

/** Libellés d'affichage. Le pluriel n'existe pas ici : un rôle qualifie un lien. */
export const ROLE_LABELS: Record<CollectionRole, string> = {
  author: 'auteur',
  translator: 'traducteur',
  editor: 'éditeur',
  director: 'réalisateur',
  performer: 'interprète',
  speaker: 'énonciateur',
  composer: 'compositeur',
  interviewee: 'interviewé',
  interviewer: 'intervieweur',
  publisher: 'diffusé par',
  subject: 'sujet',
};

/**
 * Sûreté de l'attribution.
 *
 * Imposé par le corpus : une citation y porte « faussement attribuée à Bruce Lee
 * ou Warren Buffett », une autre « citation modifiée avec le temps » (Hérodote).
 * Sans ce champ, la seule façon de le dire est une note en prose — donc quelque
 * chose que l'affichage ne peut pas traiter, et qu'aucun filtre n'atteint.
 *
 * `attributed` est la valeur par défaut implicite : on ne l'écrit pas.
 */
export type Attribution =
  /** L'attribution courante est fausse, et on garde la citation quand même. */
  | 'misattributed'
  /** Attribution contestée, ou source jamais retrouvée. */
  | 'disputed'
  /** Le texte a dérivé de l'original en circulant. */
  | 'altered';

/* ────────────────────────────────────────────────────────────────────────────
   Agent — celui qu'on peut cliquer
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * ⚠️ DÉCISION OUVERTE — le nom de ce type, et surtout celui de sa collection
 *    (qui devient une URL publique, donc coûteuse à changer plus tard).
 *
 * `Person` ne tient pas dès qu'il y a des vinyls : Massive Attack, Daft Punk,
 * un quatuor à cordes ne sont pas des personnes. Le domaine appelle ça un
 * « agent » (Person / Corporate Body, vocabulaire des bibliothèques), d'où le
 * choix ici — au prix d'une collision de vocabulaire avec les agents IA, qui
 * sont partout ailleurs dans slashome. Alternatives si ça gêne : `Figure`,
 * `Name`, `Contributor` (mais « contributeur » est faux pour un `subject`).
 *
 * `Citizen` est écarté définitivement : la citoyenneté est un statut juridique
 * vis-à-vis d'un État. Aristote n'est citoyen d'aucun État actuel, et Simone
 * Weil ne sera jamais citoyenne d'ATLAS.
 */
export type AgentKind =
  | 'person'
  /** Massive Attack, un quatuor, un collectif. */
  | 'group'
  /**
   * Une chaîne YouTube, un label, une maison d'édition, un studio.
   * Le vocabulaire des bibliothèques dit « corporate body » : ni une personne,
   * ni un groupe de personnes nommées — une entité qui publie.
   */
  | 'organization'
  /**
   * Un personnage de fiction.
   *
   * Imposé par le corpus réel : Ra's al Ghul dans Batman Begins, Tyrell Wellick
   * dans Mr. Robot, César dans Kaamelott. Trois citations sur 123 sont
   * prononcées par quelqu'un qui n'existe pas — et les traiter en `person`
   * mettrait un personnage dans l'index des gens.
   *
   * Un personnage n'est pas l'auteur de sa réplique : Alexandre Astier écrit
   * (`author`), César prononce (`speaker`), Pierre Mondy joue (`performer`).
   */
  | 'character';

/**
 * Les langues du fonds — liste **curée**, étendue délibérément.
 *
 * L'état de l'art pour nommer une langue, c'est **BCP 47** (RFC 5646) : `fr`,
 * `en`, `th`, `pt-BR`, `zh-Hant`. C'est le vocabulaire ; ce n'est pas une
 * validation. BCP 47 accepte des milliers de codes, dont `frr` — qui n'est PAS
 * une faute de frappe pour `fr`, c'est le frison septentrional.
 *
 * D'où le point que ta question soulève : **une regex de forme BCP 47 ne peut
 * pas distinguer une coquille d'une langue que tu n'as pas encore utilisée.**
 * Seule une liste fermée le peut. On ferme donc, et on l'étend d'une ligne le
 * jour où une langue entre vraiment dans le fonds.
 *
 * ⚠️ Une distinction à ne pas perdre : ceci est la langue **d'un contenu** (un
 * surnom thaï existe même si le site n'a pas de version thaïe). Ce n'est PAS la
 * liste des langues d'interface du site — ce serait un autre ensemble, plus
 * petit, et le confondre est l'erreur classique en i18n.
 */
export const LANGUAGES = [
  // attestées dans le fonds aujourd'hui
  'fr',
  'en',
  'th',
  // langues d'origine d'auteurs déjà présents — à activer quand un texte arrive
  'grc', // grec ancien : Eschyle, Hérodote
  'la', // latin : Marc Aurèle
  'ar', // arabe : Ali ibn Abi Talib
  'ja', // japonais : Haruki Murakami
  'de',
  'es',
  'it',
] as const;

export type Language = (typeof LANGUAGES)[number];

/** Un texte et sa langue — un surnom thaï n'est pas un surnom anglais. */
export interface LocalizedText {
  lang: Language;
  text: string;
}

/**
 * Un surnom, dans SA langue d'origine, avec ses traductions.
 *
 * Pas de slug, et pas d'entité : un surnom n'a pas de page, rien ne pointe
 * vers lui, on ne navigue jamais dessus. C'est un attribut d'affichage — lui
 * donner une identité serait payer une table pour du texte.
 *
 * La structure répond à la vraie question : « ไอ้ดำพระกาฬ » et « Black Monk »
 * ne sont pas deux surnoms, c'est UN surnom et sa traduction. Les mettre côte
 * à côte dans une liste plate perdrait ce lien, et afficherait cinq surnoms
 * à quelqu'un qui en a trois.
 */
export interface Nickname {
  /**
   * La langue dans laquelle le surnom a été donné — **optionnelle**.
   *
   * Un surnom donné dans une langue en a une (« Black Monk », « ไอ้ดำพระกาฬ »).
   * Un pseudonyme n'en a pas : `alucard`, `majin`, `theneoshaman` ne sont dans
   * aucune langue, ce sont des identités choisies. Forcer un `lang` sur eux
   * obligerait à mentir (`fr` ? `en` ?). D'où l'optionnalité, plutôt qu'un
   * second champ `handles` qui dupliquerait la structure.
   */
  lang?: Language;
  text: string;
  /** Pour comprendre un surnom qu'on ne sait pas lire. */
  translations?: LocalizedText[];
  /**
   * Provenance, sens littéral, réserve sur la traduction.
   *
   * Champ ajouté parce qu'un surnom a une histoire que ni son texte ni sa
   * traduction ne portent : « l'Extraterrestre du Muay Thaï » a été forgé par
   * un journaliste nommé, en 1993, après un titre précis. Et « ไอ้ดำพระกาฬ »
   * est traduit « Black Monk » un peu partout alors que พระกาฬ désigne le
   * seigneur de la Mort — la réserve doit tenir à côté de la donnée, pas
   * ailleurs.
   */
  note?: string;
}

export interface Link {
  label: string;
  url: string;
}

/**
 * La traduction d'un texte — **jamais à la place de l'original.**
 *
 * Le texte d'une citation EST la citation : le remplacer par sa traduction en
 * ferait une autre chose. D'où un tableau à côté de `text`, exactement comme
 * les surnoms portent leurs traductions à côté du surnom thaï.
 */
export interface Translation {
  lang: Language;
  text: string;

  /**
   * Qui a traduit. Un agent, donc une page, donc créditable comme n'importe
   * quel contributeur.
   *
   * ⚠️ Pourquoi ici plutôt que dans `credits` avec `role: 'translator'` : une
   * citation peut porter deux traductions par deux personnes différentes, et
   * `credits` ne saurait pas dire qui a traduit quoi. Le rôle `translator`
   * reste utile pour une ŒUVRE traduite en entier — un livre, un film.
   */
  translator?: Slug;

  /**
   * Ce que cette traduction rend, ce qu'elle perd, pourquoi ce mot-là.
   *
   * Ce sont les mots du TRADUCTEUR, pas ceux du propriétaire du fonds — d'où un
   * champ distinct de `note`, qui lui reste fermé aux contributions. C'est ce
   * qui permet à quelqu'un de proposer une traduction plus juste en expliquant
   * pourquoi, et de garder l'explication à côté de la donnée.
   */
  translatorNote?: string;

  /** L'édition d'où vient la traduction, quand elle est publiée. */
  source?: Link;
}

export interface Agent {
  slug: Slug;
  kind: AgentKind;

  /**
   * Nom d'affichage, en UN champ.
   *
   * Pas de `firstname` / `lastname` : ça casse sur Colette, Stromae, Aristote,
   * Massive Attack, Homère — c'est-à-dire sur une bonne part de ce que tu vas
   * collectionner. Le seul service que rendait la découpe était le tri
   * alphabétique, et `sortName` le rend mieux (convention bibliothéconomique).
   */
  name: string;

  /**
   * Forme inversée, pour l'affichage d'un index alphabétique : « Weil, Simone ».
   *
   * ⚠️ La virgule et l'espace ne servent PAS au tri — `Intl.Collator` compare
   * les caractères, « Weil Simone » se trierait pareil. Ils servent à l'œil :
   * dans une liste de noms, la virgule signale « nom de famille d'abord »,
   * c'est la convention des index de bibliothèque. C'est donc un champ
   * d'AFFICHAGE, dont le tri profite parce que la bonne clé de tri commence
   * par le nom de famille. Voir `compareAgents()` dans `index-builder.ts`.
   *
   * Absent pour un mononyme, un groupe, une organisation.
   */
  sortName?: string;

  /**
   * Le nom d'état civil, quand le nom d'usage est un pseudonyme.
   * Colette → « Sidonie-Gabrielle Colette ».
   * (En anglais : *legal name* ; le nom d'auteur est un *pen name* ; le second
   * prénom est un *middle name*.)
   */
  legalName?: string;

  /**
   * Surnoms, alias de ring, noms de scène. Localisés, parce qu'ils le sont
   * réellement : Dany Bill est « Black Monk » en anglais et « ไอ้ดำพระกาฬ » en thaï.
   *
   * ⚠️ Ne pas confondre avec `formerSlugs` : ceci est fait pour être LU, ça n'a
   * aucun rôle d'identifiant. C'est la collision qui existait dans `aliases`.
   */
  nicknames?: Nickname[];

  born?: PartialDate;
  died?: PartialDate;

  /**
   * UNE phrase de désambiguïsation, affichée dans les listes et sous le nom.
   * La biographie longue n'a pas sa place ici : si elle existe un jour, c'est
   * un corps Markdown (un fichier `.md` par agent — données en frontmatter,
   * texte dans le corps), pas une chaîne dans un JSON.
   */
  bio?: string;

  /**
   * Les membres, pour un `group` — par slug, jamais par nom.
   *
   * Slug pour la raison que tu donnes : il reste lisible et résolvable quel que
   * soit l'export. Un id opaque obligerait à trimballer la table pour relire la
   * donnée.
   *
   * ⚠️ Volontairement SANS dates d'entrée/sortie ni instrument : une composition
   * de groupe est temporelle, et c'est un terrier à lapin. Tant qu'aucune page
   * n'en a besoin, une liste plate suffit — l'enrichir plus tard est additif,
   * donc gratuit.
   */
  members?: Slug[];

  /**
   * Le pont externe, optionnel. Wikidata est gratuit, stable, couvre les
   * personnes historiques, et VIAF / BnF / IMDb / Discogs — et un jour ATLAS —
   * sont tous atteignables depuis lui. Coût aujourd'hui : zéro.
   */
  wikidata?: `Q${number}`;

  /** Wikipédia, site officiel, Discogs… ce qui n'est pas dérivable de Wikidata. */
  links?: Link[];

  /**
   * Anciens slugs, pour ne pas casser une URL déjà publiée. Purement machine,
   * jamais affiché. (S'appelait `aliases` — renommé parce qu'« alias » évoque
   * un surnom, et que les deux sens se télescopaient.)
   */
  formerSlugs?: Slug[];

  /** Sert à l'accord des libellés au rendu (« autrice »), pas au stockage. */
  gender?: 'f' | 'm' | 'other';

  /**
   * Résident du Panthéon — **opt-in, curé à la main, jamais dérivé**.
   *
   * C'est le point de conception, et il est délibéré : le Panthéon n'est pas
   * une conséquence du `kind`, ni du nombre d'items, ni de quoi que ce soit
   * d'automatique. C'est un jugement, et il doit s'écrire.
   *
   * Conséquence voulue : le jour où une conversation devient un item et où
   * `claude-opus-5` devient un agent, il est un agent — et il n'entre pas au
   * Panthéon, parce que personne ne l'aura écrit. Aucune règle à modifier,
   * aucune exception à coder. Une émission de télévision et un personnage de
   * fiction sont dans le même cas.
   */
  pantheon?: boolean;
}

/**
 * Noms réservés sous `/agents/` : aucun agent ne peut porter ces slugs, sinon
 * sa page entrerait en collision avec une page du site.
 *
 * `pantheon` en fait partie : `/agents/pantheon/` est la page curée, pas
 * quelqu'un qui s'appellerait « Pantheon ».
 */
export const RESERVED_AGENT_SLUGS = ['pantheon', 'index', 'tous'] as const;

/* ────────────────────────────────────────────────────────────────────────────
   Credit — l'arête entre un agent et un item
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * LE point du modèle : le rôle n'appartient ni à l'agent ni à l'item, il
 * appartient au LIEN. Simone Weil est `author` d'une citation ET `subject`
 * d'une vidéo — même personne, même mécanisme, deux liens.
 *
 * UNE seule liste plate sur l'item (et non des champs `subject:` / `performer:`
 * séparés) : c'est ce qui rend triviale la question « tout ce qui concerne X,
 * tous rôles confondus ». Des champs par rôle obligeraient à rouvrir le type
 * à chaque nouveau rôle, et à parcourir douze champs pour répondre.
 */
export interface Credit {
  /**
   * Référence vers `Agent.slug`. Pas l'objet `Agent` par valeur : comparer
   * « Simone Weil » à « S. Weil » à « Simone WEIL » ne marche pas, et une clé
   * permet de vérifier au build que la cible existe.
   */
  agent: Slug;

  /**
   * 1..n rôles pour CE lien.
   *
   * Un tableau, et pas un rôle unique, parce que c'est ce que demande
   * l'interface de saisie : on choisit un nom, puis on coche `subject`,
   * `performer`, ou les deux. Un rôle unique obligerait à créer deux liens
   * pour le même agent sur le même item — donc à dédupliquer à l'affichage
   * pour ne pas montrer l'item deux fois sur sa page.
   *
   * Invariant : non vide, sans doublon. Voir `validate.ts`.
   */
  roles: CollectionRole[];

  /**
   * La nuance que l'enum ne peut pas porter — EN PLUS du rôle, jamais à la
   * place. Ex. `roles: ['performer'], note: 'combat contre Ramon Dekkers'`.
   */
  note?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
   Item
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Référence à une image. Volontairement minimale et sans magie : le pipeline
 * d'images est le seul point où le framework compte vraiment, et il ne doit pas
 * contaminer le modèle. `src` est un chemin relatif au dépôt.
 */
export interface ImageRef {
  src: string;
  /** Vide si l'image est purement décorative à côté d'un titre déjà lisible. */
  alt?: string;
}

export interface CollectionItem {
  /**
   * Unique **dans son type**, pas globalement — l'URL est
   * `/inventaire/<type>/<slug>/`.
   *
   * Pourquoi pas un id opaque, alors que les items sont nombreux et souvent
   * importés : parce que l'URL d'une citation se partage. `/inventaire/
   * citations/weil-attention-generosite/` se lit et se retient,
   * `/inventaire/citations/c-7f3a2/` non.
   *
   * La difficulté est réelle pour les citations : dans le corpus Notion, le
   * « titre » d'une citation EST son texte, donc un slug dérivé ferait
   * soixante caractères. La règle retenue : **auteur + thème, court**
   * (`weil-attention-generosite`). L'import en génère une première passe, à
   * raffiner à la main sur les items qui comptent.
   */
  slug: Slug;
  type: CollectionType;
  title: string;

  /**
   * Tous les liens vers des agents, tous rôles confondus.
   *
   * ⚠️ **L'ordre est signifiant** : c'est le « billing » du générique de film.
   * Dans une vidéo de combat, les deux boxeurs sont `performer` — celui dont
   * c'est la vidéo est cité en premier. Ça évite d'inventer un rôle
   * `main-subject` qui mentirait (dans un combat, personne n'est le *sujet* :
   * les deux agissent, donc les deux sont des interprètes).
   */
  credits: Credit[];

  /* ── Représentation vs contenu ───────────────────────────────────────────
     Deux champs séparés, PAS un `content: image | text` en union discriminée :

     1. une union dit « l'un OU l'autre » — or un livre a une couverture ET un
        extrait relevé. On perdrait de la donnée dès le deuxième item ;
     2. `blob` n'a pas de sens ici : il n'y a pas de base. Une image est un
        fichier versionné, référencé par chemin ;
     3. les deux varient indépendamment : `cover` est une préoccupation de mise
        en page, identique pour les 6 types ; le texte varie selon le type ;
     4. le discriminant ferait doublon avec `type`, donc une seconde source de
        vérité capable de contredire la première — `{ type: 'citation',
        content: { type: 'image' } }` serait représentable et absurde.
     ─────────────────────────────────────────────────────────────────────── */

  /** Pochette, couverture, miniature, photo, tableau. */
  cover?: ImageRef;

  /**
   * Le contenu de l'item lui-même — les mots de l'auteur.
   * Pour une `citation`, ce champ EST l'item (invariant vérifié).
   * Pour un vinyl, souvent vide : la musique n'est pas embarquable.
   */
  text?: string;

  /**
   * La langue de `text`.
   *
   * Optionnelle par tolérance, mais **obligatoire dès qu'il y a une
   * traduction** : traduire depuis une langue inconnue n'a pas de sens.
   */
  lang?: Language;

  /**
   * Traductions de `text`. L'original ne bouge jamais.
   *
   * Ouvert aux contributions : c'est l'endroit où quelqu'un peut proposer une
   * traduction plus juste, avec son explication dans `translatorNote` et son
   * nom dans `translator`.
   */
  translations?: Translation[];

  /**
   * TES mots à toi. Distinct de `text` : c'est ce champ qui transforme une
   * liste de titres en « ce qui m'a formé ». Sans lui, la Collection est un
   * Goodreads de plus. Séparé de `text` pour pouvoir citer sans commenter.
   */
  note?: string;

  /**
   * Les CIRCONSTANCES de l'énonciation — pas tes mots, pas ceux de l'auteur.
   *
   * Champ imposé par le corpus, où il est rempli 17 fois sur 123 :
   * « Réponse à la question d'une journaliste américaine : … »,
   * « Récité par Jean d'Ormesson à la télévision »,
   * « Politically Incorrect with Bill Maher, épisode du 16 mai 2001 ».
   *
   * Distinct de `note` : celui-ci répond à « dans quel cadre est-ce dit ? »,
   * `note` répond à « pourquoi je le garde ? ». Les fusionner obligerait à
   * choisir entre les deux, et le corpus montre qu'ils coexistent.
   */
  context?: string;

  /**
   * Absent = attribution tenue pour sûre. Voir `Attribution`.
   * Une citation dont l'attribution est fausse reste une citation qu'on garde —
   * elle mérite d'être affichée comme telle, pas cachée.
   */
  attribution?: Attribution;

  /** Ce qui étaie (ou démonte) l'attribution : quoteinvestigator, une édition… */
  sources?: Link[];

  link?: string;

  /* ── Dates ────────────────────────────────────────────────────────────── */

  /** Date de l'ŒUVRE. Partielle, et souvent absente sur une citation. */
  published?: PartialDate;

  /**
   * Date d'AJOUT à la collection. Toujours connue et exacte : c'est le jour où
   * tu écris la ligne. C'est elle qui alimente « derniers ajouts » — la page
   * d'accueil naturelle d'une collection — et c'est le seul tri qui fonctionne
   * quand `published` manque.
   *
   * Pour une proposition adoptée, c'est le jour de l'ADOPTION, pas celui de la
   * proposition : le fonds dit ce qui t'a formé, et rien ne t'a formé avant que
   * tu le lises.
   */
  added: IsoDate;

  /**
   * L'agent qui t'a fait découvrir cet item.
   *
   * Obligatoire sur une proposition (`propositions.json`), conservé quand elle
   * est adoptée — c'est ce qui donne à celui qui t'a montré quelque chose une
   * trace nominative sur sa propre page, et pas une ligne dans un changelog.
   *
   * Pour un fonds qui dit « ce qui m'a formé », les gens qui t'ont montré des
   * choses en font partie de plein droit.
   */
  suggestedBy?: Slug;

  /* Pas de `history: Event[]`. Sur un site à fichiers versionnés, ajouter un
     champ OPTIONNEL est une migration gratuite : pas de base, pas d'ALTER
     TABLE, pas de backfill. Donc rien à préparer — `revisited?: PartialDate[]`
     s'ajoutera le jour où les relectures compteront.
     Ce qui ne serait PAS gratuit, c'est de changer le TYPE d'un champ déjà
     rempli à la main. D'où le soin porté à `published`, et l'indifférence à
     `history`. */

  /**
   * Références vers `Concept.slug`. **Plus des chaînes libres.**
   *
   * Le corpus a tranché : les 27 concepts existent déjà comme des pages dans
   * Notion, donc ils ont déjà une identité. La règle du modèle s'applique —
   * on normalise ce qui a sa propre page — et elle s'applique dans les deux
   * sens : ce qui a une identité ne doit pas être une chaîne libre.
   *
   * Gain concret : la fonction de normalisation (minuscules + accents) qui
   * existait pour rabattre « Écologie » sur « ecologie » **disparaît**. Une
   * faute de frappe devient une référence morte, donc une erreur de build, au
   * lieu d'un 28ᵉ concept silencieux.
   *
   * ⚠️ Le rendu, lui, reste un tag : petit, cliquable, sans cérémonie. Une
   * entité dans la donnée n'oblige à rien dans l'interface.
   */
  concepts?: Slug[];
}

/* ────────────────────────────────────────────────────────────────────────────
   Concept — le troisième nœud
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Un thème du fonds : Éducation, Guerre, Empathie, Bêtise…
 *
 * Troisième entité après `Agent` et `CollectionItem`, et la dernière — le
 * critère reste le même : **ce qui a sa propre page mérite une identité.**
 * Éditeurs, labels et collections n'en ont pas, ils resteront des chaînes.
 */
export interface Concept {
  slug: Slug;
  /** Tel qu'il s'affiche : « Éducation », majuscule et accent compris. */
  name: string;
  /** Une phrase, si elle apporte quelque chose. Pas un article. */
  description?: string;
  /**
   * Concepts voisins — un graphe plat, sans hiérarchie.
   *
   * Pas de parent/enfant délibérément : une taxonomie arborescente oblige à
   * trancher si « Barbarie » est sous « Guerre » ou sous « Société », et la
   * réponse est « les deux ». Un voisinage symétrique ne pose pas la question.
   */
  related?: Slug[];
}

/* ────────────────────────────────────────────────────────────────────────────
   Vues dérivées — calculées, jamais saisies
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Ce qu'affiche la page d'un agent : un item, et les rôles qu'il y tient.
 * `roles` est agrégé sur tous ses `Credit` — donc un item n'apparaît jamais
 * deux fois sur la page de quelqu'un.
 */
export interface Appearance {
  item: CollectionItem;
  roles: CollectionRole[];
}

/* Pas de `CollectionList`. Un `total` n'a de sens que si un client voit une
   FENÊTRE sur des données qu'il n'a pas — c'est un artefact d'API REST, et il
   n'y a pas d'API ici : le build possède tout. Un filtre, lui, est une
   intention utilisateur, transitoire : il vit dans l'URL (`?type=vinyl`), pas
   dans un type de domaine. Un domaine qui change selon qui regarde est un view
   model. */

/* ────────────────────────────────────────────────────────────────────────────
   Chargement des fixtures
   ──────────────────────────────────────────────────────────────────────────── */

/**
 * Les fichiers de données sont des OBJETS indexés par slug, pas des tableaux.
 *
 * Raison : en forme tableau, l'id est un champ comme un autre — on peut
 * l'oublier, ou le dupliquer. En forme objet, la clé EST l'id : l'oubli devient
 * structurellement impossible et le doublon aussi. Le prix est ce helper, qui
 * réinjecte la clé dans l'objet.
 */
export type Keyed<T> = Record<Slug, Omit<T, 'slug'>>;

export function fromKeyed<T extends { slug: Slug }>(record: Keyed<T>): T[] {
  return Object.entries(record).map(([slug, value]) => ({ ...value, slug }) as T);
}
