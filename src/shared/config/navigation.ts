export interface NavItem {
  href: string;
  label: string;
}

export const CONTENT: NavItem[] = [
  { href: '/projects/', label: 'Projets' },
  { href: '/journal/', label: 'Journal' },
  { href: '/inventory/quotes/', label: 'Inventaire' },
  { href: '/agents/', label: 'Agents' },
];

export const SETTINGS: NavItem[] = [
  { href: '/profile/', label: 'Profil' },
  { href: '/options/', label: 'Options' },
];

export const ALL: NavItem[] = [...CONTENT, ...SETTINGS];

export const GROUPS: NavItem[][] = [CONTENT, SETTINGS];
