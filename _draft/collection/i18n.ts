/**
 * Résolution de la langue d'affichage.
 *
 * Le fonds est multilingue par nature : des citations françaises, anglaises,
 * des surnoms thaïs. Le site, lui, s'affiche dans UNE langue à la fois. Ce
 * fichier dit lequel des textes disponibles montrer, et surtout **quand
 * signaler qu'on montre une traduction** — parce qu'une citation lue en
 * traduction n'est pas la même chose qu'une citation lue dans sa langue.
 */

import type { CollectionItem, Language, Slug, Translation } from './types';

/**
 * La langue de repli, quand ni la langue demandée ni l'original ne conviennent.
 *
 * L'anglais, décidé le 2026-08-29 : c'est la langue que le plus de visiteurs
 * ont en commun, et celle des citations déjà présentes dans le fonds qui ne
 * sont pas en français.
 */
export const FALLBACK_LANG: Language = 'en';

export interface ResolvedText {
  text: string;
  /** La langue réellement affichée — pas celle demandée. */
  lang?: Language;
  /** Vrai si ce n'est pas l'original : à signaler au lecteur. */
  translated: boolean;
  translator?: Slug;
  translatorNote?: string;
}

/**
 * Ordre de résolution : **langue demandée → anglais → original.**
 *
 * L'original est le dernier recours et non le premier, parce qu'un visiteur qui
 * lit l'anglais préfère une traduction anglaise à un texte thaï. Mais il n'est
 * jamais écarté : mieux vaut montrer un texte qu'on ne comprend pas que ne rien
 * montrer — et pour une citation, l'original a une valeur propre.
 */
export function resolveText(
  item: Pick<CollectionItem, 'text' | 'lang' | 'translations'>,
  preferred: Language,
): ResolvedText | undefined {
  if (!item.text) return undefined;

  const original: ResolvedText = { text: item.text, lang: item.lang, translated: false };

  /* La langue demandée EST celle de l'original : rien à traduire. */
  if (item.lang === preferred) return original;

  const pick = (lang: Language): Translation | undefined =>
    item.translations?.find((t) => t.lang === lang);

  const chosen = pick(preferred) ?? (preferred === FALLBACK_LANG ? undefined : pick(FALLBACK_LANG));
  if (!chosen) return original;

  return {
    text: chosen.text,
    lang: chosen.lang,
    translated: true,
    translator: chosen.translator,
    translatorNote: chosen.translatorNote,
  };
}

/** Les langues dans lesquelles cet item est lisible, original compris. */
export function availableLanguages(
  item: Pick<CollectionItem, 'lang' | 'translations'>,
): Language[] {
  const langs = new Set<Language>();
  if (item.lang) langs.add(item.lang);
  for (const t of item.translations ?? []) langs.add(t.lang);
  return [...langs];
}
