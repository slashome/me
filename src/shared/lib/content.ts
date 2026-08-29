import { readFileSync, existsSync } from 'node:fs';

const ROOT = 'content/data';

function read<T>(file: string): Record<string, T> {
  const path = `${ROOT}/${file}`;
  if (!existsSync(path)) {
    throw new Error(
      `Contenu absent : ${path}. Lance \`npm run content\` pour cloner slashome/_me.`,
    );
  }
  const { _comment, ...rest } = JSON.parse(readFileSync(path, 'utf-8'));
  return rest as Record<string, T>;
}

function keyed<T>(file: string): (T & { slug: string })[] {
  return Object.entries(read<T>(file)).map(([slug, value]) => ({ ...value, slug }));
}

export interface Credit {
  agent: string;
  roles: string[];
  note?: string;
}

export interface Item {
  slug: string;
  type: string;
  title: string;
  credits: Credit[];
  text?: string;
  lang?: string;
  context?: string;
  note?: string;
  attribution?: string;
  published?: string;
  added: string;
  concepts?: string[];
  suggestedBy?: string;
}

export interface Agent {
  slug: string;
  kind: string;
  name: string;
  sortName?: string;
  bio?: string;
  pantheon?: boolean;
}

export interface Concept {
  slug: string;
  name: string;
  related?: string[];
}

export const items = () => keyed<Item>('items/citations.json');
export const agents = () => keyed<Agent>('agents.json');
export const concepts = () => keyed<Concept>('concepts.json');

export function agentsBySlug(): Map<string, Agent> {
  return new Map(agents().map((a) => [a.slug, a]));
}

export function conceptsBySlug(): Map<string, Concept> {
  return new Map(concepts().map((c) => [c.slug, c]));
}

export const TYPE_LABELS: Record<string, string> = {
  citation: 'Citations',
  livre: 'Livres',
  vinyl: 'Vinyls',
  video: 'Vidéos',
  film: 'Films',
  article: 'Articles',
};

export const TYPE_ORDER = ['citation', 'livre', 'vinyl', 'video', 'film', 'article'];
