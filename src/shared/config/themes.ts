import type { DecorBackground } from './backgrounds';

export interface Theme {
  /** Identifiant interne : dossier, `data-theme`, sélecteur CSS. */
  id: string;
  /** Libellé public, affiché dans `/options/`. */
  label: string;
  /** Le fond d'écran du thème, rendu par `widgets/decor`. */
  background: DecorBackground;
  /**
   * Les sections que ce thème renomme, indexées par la `key` de `navigation.ts`.
   * Une entrée absente garde le libellé neutre.
   *
   * ⚠️ Le renommage a un prix, et il est structurel : la bascule de thème étant
   * runtime, **tous les libellés sont servis dans le DOM** et le CSS n'en montre
   * qu'un. C'est tenable pour des mots courts ; ça cesse de l'être si un thème
   * doit réécrire des phrases. Ce sera alors l'argument décisif pour un thème
   * résolu au build.
   */
  labels?: Record<string, string>;
}

/**
 * Le registre des thèmes. Un thème n'existe que s'il figure ici.
 *
 * Un thème déclare son fond ; il ne déclare pas sa géométrie ni ses couleurs —
 * celles-ci vivent dans le CSS de chaque tranche, sous `[data-theme='<id>']`.
 * Le DOM reste identique d'un thème à l'autre : c'est ce qui permet la bascule
 * sans JavaScript de rendu, et c'est ce qui évite qu'un widget ait à connaître
 * la notion de thème.
 */
export const THEMES: Theme[] = [
  { id: 'zomboid', label: 'Zomboid', background: 'alley' },
  {
    id: 'existence',
    label: 'Existence',
    background: 'candle',
    /*
     * Les noms de `existence` mélangent les cultures à dessein : chaque section
     * prend la figure qui fait ce qu'elle fait, d'où qu'elle vienne. Deux des
     * six viennent du projet tatouage lui-même, pas d'un panthéon emprunté.
     */
    labels: {
      /* Grec, le forgeron : ce qui est fabriqué. */
      projects: 'Héphaïstos',
      /* Égyptien, le scribe, l'écriture même. Odin reste l'alternative : il a
         gagné les runes pendu à Yggdrasil, ce qui relierait le journal au
         fonds — mais Thoth *est* l'écriture, là où Odin l'a conquise. */
      journal: 'Thoth',
      /* Norrois, et déjà dans la pièce 1 du tatouage : « Yggdrasil […] les mots
         ne sont pas posés *sur* l'arbre : ils **forment** l'arbre ». Un fonds de
         citations porte donc ce nom littéralement. */
      inventory: 'Yggdrasil',
      /* Grecques : celles qui inspirent. La section tient les gens qui
         inspirent, et le panthéon en est la crème — les Muses nomment donc
         l'ensemble sans écraser la distinction. (Atlas, d'abord proposé ici,
         était faux : il porte, il ne rassemble pas. Le mot reste libre pour le
         projet ATLAS du modèle du fonds.) */
      agents: 'Muses',
      /* Du tatouage, pièce 4 : le centre, « le sujet, pas un couple », décrit
         comme « Toi, ta vie, ton réel, ton existence ». Une fiche de personnage
         n'a pas de meilleur nom. Équivalent mythologique : Janus. */
      profile: 'Siamois',
      /* Norroises, à la racine du même arbre que le fonds : elles fixent les
         termes. C'est ce que fait une page de réglages. */
      options: 'Nornes',
    },
  },
];

export const DEFAULT_THEME = 'zomboid';

export const THEME_IDS: string[] = THEMES.map((theme) => theme.id);

/** Clé de persistance du choix du visiteur. */
export const THEME_STORAGE_KEY = 'slashome:theme';
