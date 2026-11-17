import type { Item, Translation } from '../../shared/lib/content';
import { SITE_LANG } from '../../shared/lib/language';

export interface QuoteReading {
  original: { text: string; lang?: string };
  beside?: Translation;
  others: Translation[];
}

/**
 * L'original d'abord, toujours. La traduction dans la langue du site se lit à
 * côté, sans clic, dès que l'original est dans une autre langue ; les autres
 * attendent dans un dépliant.
 */
export function quoteReading(item: Pick<Item, 'text' | 'lang' | 'translations'>): QuoteReading | undefined {
  if (!item.text) return undefined;
  const translations = (item.translations ?? []).filter((t) => t.lang !== item.lang);
  const beside =
    item.lang === SITE_LANG ? undefined : translations.find((t) => t.lang === SITE_LANG);
  return {
    original: { text: item.text, lang: item.lang },
    beside,
    others: translations.filter((t) => t !== beside),
  };
}
