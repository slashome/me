/**
 * Index dérivés — des fonctions pures, calculées une fois, jamais saisies.
 *
 * Tout ce qui est ici est une conséquence des données ; rien n'y est une
 * source. C'est la frontière : le domaine vit dans les fichiers, le dérivé vit
 * ici, la vue (pagination, filtre actif, tri courant) vit dans les pages.
 */

import type {
  Agent,
  Appearance,
  CollectionItem,
  CollectionRole,
  CollectionType,
  Concept,
  Slug,
} from './types';

export interface CollectionIndex {
  agents: Map<Slug, Agent>;
  items: CollectionItem[];

  /**
   * ⭐ L'index qui justifie tout le modèle.
   *
   * « Je clique sur Simone Weil sans filtrer par type, je vois la citation dont
   * elle est l'autrice ET la vidéo dont elle est le sujet. »
   */
  byAgent: Map<Slug, Appearance[]>;

  concepts: Map<Slug, Concept>;

  byType: Map<CollectionType, CollectionItem[]>;
  byConcept: Map<Slug, CollectionItem[]>;
  /** Seau `'sans-date'` explicite : ne jamais perdre un item en silence. */
  byYear: Map<string, CollectionItem[]>;
  /** Tri décroissant sur `added`. */
  latest: CollectionItem[];
}

/**
 * L'identité d'un item est le couple (type, slug) : les slugs d'items ne sont
 * uniques que dans leur type, parce que l'URL les porte tous les deux.
 */
export function itemKey(item: CollectionItem): string {
  return `${item.type}/${item.slug}`;
}

/* `normalizeTag()` a disparu avec les tags libres : quand un concept est une
   entité référencée par slug, il n'y a plus rien à rabattre. Une faute de
   frappe est une référence morte, donc une erreur — pas un 28ᵉ concept. */

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(value);
  else map.set(key, [value]);
}

export function buildIndex(
  agents: Agent[],
  items: CollectionItem[],
  concepts: Concept[] = [],
): CollectionIndex {
  const agentsBySlug = new Map(agents.map((a) => [a.slug, a]));
  const conceptsBySlug = new Map(concepts.map((c) => [c.slug, c]));

  const byAgent = new Map<Slug, Appearance[]>();
  const byType = new Map<CollectionType, CollectionItem[]>();
  const byConcept = new Map<Slug, CollectionItem[]>();
  const byYear = new Map<string, CollectionItem[]>();

  for (const item of items) {
    push(byType, item.type, item);
    push(byYear, item.published?.slice(0, 4) ?? 'sans-date', item);
    for (const slug of item.concepts ?? []) {
      if (concepts.length && !conceptsBySlug.has(slug)) {
        throw new Error(`Référence morte : items/${item.slug} → concepts/${slug}`);
      }
      push(byConcept, slug, item);
    }

    for (const credit of item.credits) {
      /**
       * Barrière d'intégrité référentielle.
       *
       * ⚠️ Si le site reste sur Astro : `reference()` NE VÉRIFIE PAS l'existence.
       * Astro détecte bien la référence morte, logge une erreur très précise…
       * puis sort en code 0 et publie une page contenant « UNDEFINED ». Sur
       * GitHub Actions : log rouge, déploiement vert, invisible. Vérifié en
       * construisant un projet Astro 7.2.9.
       *
       * Comme toutes les pages passent par cet index, ce `throw` suffit à
       * transformer le diagnostic en vraie barrière (build en code 1). Gratuit.
       */
      const agent = agentsBySlug.get(credit.agent);
      if (!agent) {
        throw new Error(
          `Référence morte : items/${item.slug} → agents/${credit.agent} ` +
            `(rôles : ${credit.roles.join(', ')})`,
        );
      }

      const appearances = byAgent.get(agent.slug);
      const existing = appearances?.find((a) => itemKey(a.item) === itemKey(item));
      if (existing) {
        // Filet : deux `Credit` pour le même agent sur le même item. `validate`
        // l'interdit, mais on fusionne plutôt que d'afficher l'item deux fois.
        for (const role of credit.roles) {
          if (!existing.roles.includes(role)) existing.roles.push(role);
        }
      } else {
        push(byAgent, agent.slug, { item, roles: [...credit.roles] });
      }
    }
  }

  return {
    agents: agentsBySlug,
    concepts: conceptsBySlug,
    items,
    byAgent,
    byType,
    byConcept,
    byYear,
    latest: [...items].sort((a, b) => (a.added < b.added ? 1 : a.added > b.added ? -1 : 0)),
  };
}

/**
 * Tri alphabétique des noms.
 *
 * `Intl.Collator('fr')` et pas `<` : le tri lexicographique brut place « Zola »
 * avant « Éluard » (É vaut U+00C9, après Z), et ne sait pas que « œ » se range
 * comme « oe ». Le collateur, lui, applique les règles de la langue. C'est aussi
 * pour ça que `sortName` n'a pas besoin d'être « normalisé » à la saisie : la
 * virgule et l'espace n'influencent pas le résultat, ils ne servent qu'à l'œil.
 */
const collator = new Intl.Collator('fr', { sensitivity: 'base', ignorePunctuation: true });

export function compareAgents(a: Agent, b: Agent): number {
  return collator.compare(a.sortName ?? a.name, b.sortName ?? b.name);
}

/** Les groupes auxquels appartient un agent — index inverse de `Agent.members`. */
export function groupsOfAgent(index: CollectionIndex, slug: Slug): Agent[] {
  return [...index.agents.values()].filter((a) => a.members?.includes(slug));
}

/**
 * Les rôles qu'un agent tient dans toute la collection — sert à proposer les
 * filtres de sa page : « autrice (12) · sujet (3) », et à n'afficher le filtre
 * que quand il a plus d'un rôle.
 */
export function rolesOfAgent(index: CollectionIndex, slug: Slug): CollectionRole[] {
  const roles = new Set<CollectionRole>();
  for (const appearance of index.byAgent.get(slug) ?? []) {
    for (const role of appearance.roles) roles.add(role);
  }
  return [...roles];
}

/**
 * La page d'un agent, filtrable par rôle ET par type — indépendamment.
 * Sans argument : tout ce qui le concerne, ce qui est le comportement par défaut
 * demandé.
 */
export function appearancesOfAgent(
  index: CollectionIndex,
  slug: Slug,
  filters: { roles?: CollectionRole[]; types?: CollectionType[] } = {},
): Appearance[] {
  const { roles, types } = filters;
  return (index.byAgent.get(slug) ?? []).filter(
    (a) =>
      (!roles?.length || a.roles.some((r) => roles.includes(r))) &&
      (!types?.length || types.includes(a.item.type)),
  );
}
