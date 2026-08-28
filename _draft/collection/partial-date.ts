/**
 * Dates partielles — ISO 8601 tronqué.
 *
 * Pourquoi pas un timestamp : « La Pesanteur et la Grâce », 1947, posthume.
 * On connaît l'année. Un `number` force à inventer un mois, un jour, une heure
 * et un fuseau — et six mois plus tard le regroupement « publié en janvier »
 * est un mensonge qu'on a écrit soi-même. La précision inventée est une
 * corruption de données, silencieuse et irréversible.
 *
 * Trois propriétés qui font d'ISO 8601 tronqué le bon format :
 *   1. la LONGUEUR porte la précision réellement détenue ;
 *   2. le tri lexicographique est correct (année en tête, largeur fixe) ;
 *   3. c'est lisible dans un diff git — donc relisible par l'humain qui édite.
 *
 * Limite assumée : avant l'an 1000 et avant J.-C., le tri lexicographique
 * casse. Si un jour il faut cataloguer Aristote, on triera à l'année à la main.
 * Ne pas anticiper.
 */

/** `"1947"` | `"1947-04"` | `"1947-04-12"` */
export type PartialDate = string;

/** Date complète, toujours connue : `"2026-08-28"` */
export type IsoDate = string;

const PARTIAL_DATE_RE = /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/;
const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export type DatePrecision = 'year' | 'month' | 'day';

export function isPartialDate(value: string): value is PartialDate {
  return PARTIAL_DATE_RE.test(value);
}

export function isIsoDate(value: string): value is IsoDate {
  return ISO_DATE_RE.test(value);
}

/** La longueur de la chaîne EST l'information de précision. */
export function precisionOf(date: PartialDate): DatePrecision {
  if (date.length === 4) return 'year';
  if (date.length === 7) return 'month';
  return 'day';
}

export function yearOf(date: PartialDate): string {
  return date.slice(0, 4);
}

/**
 * Tri chronologique. Le tri lexicographique est correct par construction :
 * `"1943" < "1947-04" < "1948"`. C'est la raison d'être d'ISO 8601.
 */
export function comparePartialDate(a: PartialDate, b: PartialDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const;

/**
 * Affiche exactement la précision détenue, jamais plus.
 * `"1947"` → « 1947 », `"1947-04"` → « avril 1947 », `"1947-04-12"` → « 12 avril 1947 ».
 */
export function formatPartialDate(date: PartialDate): string {
  const [year, month, day] = date.split('-');
  if (!month) return year!;
  const nomDuMois = MOIS_FR[Number(month) - 1]!;
  if (!day) return `${nomDuMois} ${year}`;
  return `${Number(day)} ${nomDuMois} ${year}`;
}
