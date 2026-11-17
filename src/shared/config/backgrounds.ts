/**
 * Les fonds d'écran disponibles. Un fond est un composant complet de
 * `widgets/decor` ; ce fichier n'en est que le vocabulaire, pour que
 * `shared/config/themes.ts` puisse le nommer sans dépendre d'un widget.
 */
export const DECOR_BACKGROUNDS = ['alley', 'candle'] as const;

export type DecorBackground = (typeof DECOR_BACKGROUNDS)[number];
