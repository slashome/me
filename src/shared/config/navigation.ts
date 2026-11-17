export interface NavItem {
  /** Identifiant stable de l'entrée. Sert de clé aux thèmes : c'est lui, et non
   *  le libellé ni l'URL, qui porte la position dans le graphe du thème
   *  `existence`. Un renommage de libellé ou d'URL ne doit pas le changer. */
  key: string;
  href: string;
  label: string;
}

export const CONTENT: NavItem[] = [
  { key: 'projects', href: '/projects/', label: 'Projets' },
  { key: 'journal', href: '/journal/', label: 'Journal' },
  { key: 'inventory', href: '/inventory/quotes/', label: 'Inventaire' },
  { key: 'agents', href: '/agents/', label: 'Agents' },
];

export const SETTINGS: NavItem[] = [
  { key: 'profile', href: '/profile/', label: 'Profil' },
  { key: 'options', href: '/options/', label: 'Options' },
];

export const ALL: NavItem[] = [...CONTENT, ...SETTINGS];

export const GROUPS: NavItem[][] = [CONTENT, SETTINGS];
