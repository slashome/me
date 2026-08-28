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
  'author',
  'translator',
  'editor',
  'illustrator',
  'photographer',
  // — audiovisuel / musique
  'director',
  /**
   * La personne AGIT, et son action EST le contenu.
   * → Dany Bill dans les vidéos de ses combats. Idem : musicien sur scène, danseur.
   */
  'performer',
  'composer',
  'narrator',
  // — parole
  'interviewee',
  'interviewer',
  /**
   * L'item PARLE D'ELLE, elle n'y a pas contribué.
   * → Simone Weil dans la vidéo « Paroles de philosophes ».
   */
  'subject',
] as const;

export type CollectionRole = (typeof COLLECTION_ROLES)[number];

/** Libellés d'affichage. Le pluriel n'existe pas ici : un rôle qualifie un lien. */
export const ROLE_LABELS: Record<CollectionRole, string> = {
  author: 'auteur',
  translator: 'traducteur',
  editor: 'éditeur',
  illustrator: 'illustrateur',
  photographer: 'photographe',
  director: 'réalisateur',
  performer: 'interprète',
  composer: 'compositeur',
  narrator: 'narrateur',
  interviewee: 'interviewé',
  interviewer: 'intervieweur',
  subject: 'sujet',
};

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
export type AgentKind = 'person' | 'group';

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

  /** Pour le tri : « Weil, Simone ». Absent pour un groupe ou un mononyme. */
  sortName?: string;

  born?: PartialDate;
  died?: PartialDate;

  /** Une phrase de désambiguïsation, pas une biographie. */
  bio?: string;

  /**
   * Le pont externe, optionnel. Wikidata est gratuit, stable, couvre les
   * personnes historiques, et VIAF / BnF / IMDb / Discogs — et un jour ATLAS —
   * sont tous atteignables depuis lui. Coût aujourd'hui : zéro.
   */
  wikidata?: `Q${number}`;

  /** Anciens slugs, pour ne pas casser une URL déjà publiée. */
  aliases?: Slug[];

  /** Sert à l'accord des libellés au rendu (« autrice »), pas au stockage. */
  gender?: 'f' | 'm' | 'other';
}

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
  slug: Slug;
  type: CollectionType;
  title: string;

  /** Tous les liens vers des agents, tous rôles confondus. */
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
   * TES mots à toi. Distinct de `text` : c'est ce champ qui transforme une
   * liste de titres en « ce qui m'a formé ». Sans lui, la Collection est un
   * Goodreads de plus. Séparé de `text` pour pouvoir citer sans commenter.
   */
  note?: string;

  link?: string;

  /* ── Dates ────────────────────────────────────────────────────────────── */

  /** Date de l'ŒUVRE. Partielle, et souvent absente sur une citation. */
  published?: PartialDate;

  /**
   * Date d'AJOUT à la collection. Toujours connue et exacte : c'est le jour où
   * tu écris la ligne. C'est elle qui alimente « derniers ajouts » — la page
   * d'accueil naturelle d'une collection — et c'est le seul tri qui fonctionne
   * quand `published` manque.
   */
  added: IsoDate;

  /* Pas de `history: Event[]`. Sur un site à fichiers versionnés, ajouter un
     champ OPTIONNEL est une migration gratuite : pas de base, pas d'ALTER
     TABLE, pas de backfill. Donc rien à préparer — `revisited?: PartialDate[]`
     s'ajoutera le jour où les relectures compteront.
     Ce qui ne serait PAS gratuit, c'est de changer le TYPE d'un champ déjà
     rempli à la main. D'où le soin porté à `published`, et l'indifférence à
     `history`. */

  /**
   * Chaînes libres, délibérément. Règle du modèle : on ne normalise QUE les
   * entités qui ont leur propre page. Aucune exigence ne porte sur les tags —
   * ils seront regroupés au build avec une normalisation (minuscules +
   * accents). Ils deviendront une entité le jour où ça fera mal, pas avant.
   */
  tags?: string[];
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
