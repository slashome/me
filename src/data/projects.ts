export type ProjectStatus = 'actif' | 'dormant';

export interface Project {
  /** Nom du dépôt sous github.com/slashome */
  name: string;
  /** Une phrase, à la première personne ou descriptive — pas une accroche commerciale */
  description: string;
  repo: string;
  tags: string[];
  language?: string;
  status: ProjectStatus;
  /** Remonté en tête de liste */
  featured?: boolean;
}

/**
 * Les descriptions reprennent celles des dépôts GitHub.
 * `status` est un jugement éditorial, pas une donnée GitHub : à ajuster à la main.
 */
export const projects: Project[] = [
  {
    name: 'ariane',
    description:
      'Une méthode de gestion de projet assistée par IA, en fichiers, hiérarchique — le fil qui traverse tous les autres projets.',
    repo: 'https://github.com/slashome/ariane',
    tags: ['méthode', 'agents', 'CLI'],
    status: 'actif',
    featured: true,
  },
  {
    name: 'dotflies',
    description:
      'Gestionnaire de configuration : versionner la conf de vos logiciels et la réinstaller en une commande.',
    repo: 'https://github.com/slashome/dotflies',
    tags: ['dotfiles', 'poste de travail'],
    language: 'Rust',
    status: 'actif',
    featured: true,
  },
  {
    name: 'knossos',
    description:
      'La cité du labyrinthe — une carte vivante et hiérarchique des pages de votre front-end.',
    repo: 'https://github.com/slashome/knossos',
    tags: ['front-end', 'visualisation'],
    language: 'JavaScript',
    status: 'actif',
    featured: true,
  },
  {
    name: 'redlight',
    description:
      "Daemon de sync USB multi-périphériques (macOS + Linux). Pas de cloud, pas d'app sur le téléphone, ça sync au branchement.",
    repo: 'https://github.com/slashome/redlight',
    tags: ['sync', 'daemon', 'sans cloud'],
    language: 'Rust',
    status: 'dormant',
  },
  {
    name: 'karaokay',
    description: 'Les paroles synchronisées dans le terminal, branchées sur MPD.',
    repo: 'https://github.com/slashome/karaokay',
    tags: ['terminal', 'musique'],
    language: 'Python',
    status: 'dormant',
  },
  {
    name: 'kosmos',
    description: 'Un design system open source.',
    repo: 'https://github.com/slashome/kosmos',
    tags: ['design system', 'UI'],
    language: 'TypeScript',
    status: 'dormant',
  },
  {
    name: 'daedalus',
    description: "Mon terrain de jeu pour l'architecture front-end.",
    repo: 'https://github.com/slashome/daedalus',
    tags: ['architecture', 'front-end'],
    language: 'Vue',
    status: 'dormant',
  },
  {
    name: 'userscripts',
    description: 'Ma collection de userscripts.',
    repo: 'https://github.com/slashome/userscripts',
    tags: ['navigateur', 'bricolage'],
    language: 'JavaScript',
    status: 'actif',
  },
  {
    name: 'homebrew-tap',
    description: 'Le tap Homebrew des projets slashome.',
    repo: 'https://github.com/slashome/homebrew-tap',
    tags: ['distribution'],
    language: 'Ruby',
    status: 'actif',
  },
  {
    name: 'ortograf',
    description:
      "Un algorithme orthographique simple, écrit pour apprendre Rust et comprendre la distance de Levenshtein.",
    repo: 'https://github.com/slashome/ortograf',
    tags: ['algorithme', 'apprentissage'],
    status: 'dormant',
  },
  {
    name: 'dreamcatchr',
    description: 'The best app for all your dreams.',
    repo: 'https://github.com/slashome/dreamcatchr',
    tags: ['idée'],
    status: 'dormant',
  },
];
