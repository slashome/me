/**
 * Validation — indépendante du framework, exprès.
 *
 * Si le site reste sur Astro, ces règles se réécrivent en Zod dans
 * `content.config.ts` et s'exécutent au build. Si le site part ailleurs, ce
 * fichier tourne dans un script npm. Dans les deux cas, les RÈGLES ne bougent
 * pas — c'est pour ça qu'elles vivent ici et pas dans un schéma.
 */

import { isIsoDate, isPartialDate } from './partial-date';
import {
  COLLECTION_ROLES,
  COLLECTION_TYPES,
  JOURNAL_KINDS,
  LANGUAGES,
  RESERVED_AGENT_SLUGS,
  type Agent,
  type Attribution,
  type CollectionItem,
  type Concept,
  type JournalEntry,
  type Project,
  type Shelf,
} from './types';

export interface Issue {
  severity: 'error' | 'warning';
  where: string;
  message: string;
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const ATTRIBUTIONS: readonly Attribution[] = ['misattributed', 'disputed', 'altered'];

const SHELVES: readonly Shelf[] = ['wanted', 'unread', 'reading', 'read'];

const PROJECT_STATUSES: readonly Project['status'][] = ['actif', 'archive', 'dormant'];

export function validate(
  agents: Agent[],
  items: CollectionItem[],
  concepts: Concept[] = [],
): Issue[] {
  const issues: Issue[] = [];
  const error = (where: string, message: string) =>
    issues.push({ severity: 'error', where, message });
  const warn = (where: string, message: string) =>
    issues.push({ severity: 'warning', where, message });

  /* ── Agents ─────────────────────────────────────────────────────────────── */

  const seenAgents = new Set<string>();
  for (const agent of agents) {
    const where = `agents/${agent.slug}`;
    if (!SLUG_RE.test(agent.slug)) error(where, 'slug non conforme (minuscules, tirets)');
    if (seenAgents.has(agent.slug)) error(where, 'slug en double');
    /* `/agents/pantheon/` est une page du site, pas quelqu'un. */
    if ((RESERVED_AGENT_SLUGS as readonly string[]).includes(agent.slug)) {
      error(where, `« ${agent.slug} » est un nom réservé sous /agents/`);
    }
    seenAgents.add(agent.slug);

    if (!agent.name.trim()) error(where, 'nom vide');
    for (const [field, value] of [
      ['born', agent.born],
      ['died', agent.died],
    ] as const) {
      if (value && !isPartialDate(value)) {
        error(where, `${field} : « ${value} » n'est pas une date ISO partielle`);
      }
    }
    if (agent.born && agent.died && agent.died < agent.born) {
      error(where, 'died antérieur à born');
    }
    if (agent.kind !== 'person' && agent.sortName) {
      warn(where, 'sortName inutile hors personne : le tri se fait déjà sur name');
    }
    if (agent.members?.length && agent.kind !== 'group') {
      error(where, 'seul un groupe a des membres');
    }
    for (const nickname of agent.nicknames ?? []) {
      if (!nickname.text.trim()) error(where, 'surnom vide');
      /* `lang` est optionnel : un pseudonyme n'est dans aucune langue. Mais une
         traduction sans langue d'origine ne veut rien dire. */
      if (nickname.translations?.length && !nickname.lang) {
        error(where, `« ${nickname.text} » a des traductions mais pas de langue d'origine`);
      }
      /* La liste fermée est ce qui distingue une coquille d'une langue nouvelle :
         `frr` est un code valide (frison septentrional), pas une faute de `fr`. */
      if (nickname.lang && !LANGUAGES.includes(nickname.lang)) {
        error(where, `langue inconnue : « ${nickname.lang} » — à ajouter à LANGUAGES si elle est réelle`);
      }
      for (const t of nickname.translations ?? []) {
        if (!t.lang.trim() || !t.text.trim()) error(where, 'traduction incomplète');
        if (!LANGUAGES.includes(t.lang)) {
          error(where, `langue de traduction inconnue : « ${t.lang} »`);
        }
        if (t.lang === nickname.lang) {
          warn(where, `traduction dans la langue d'origine (${t.lang})`);
        }
      }
    }
    for (const link of agent.links ?? []) {
      if (!/^https?:\/\//.test(link.url)) error(where, `lien non absolu : ${link.url}`);
    }
  }

  /* Membres : vérifiés APRÈS, quand tous les slugs sont connus (un membre peut
     être déclaré plus bas dans le fichier que son groupe). */
  for (const agent of agents) {
    for (const member of agent.members ?? []) {
      if (!seenAgents.has(member)) {
        error(`agents/${agent.slug}`, `membre inconnu : ${member}`);
      }
      if (member === agent.slug) {
        error(`agents/${agent.slug}`, 'membre de lui-même');
      }
    }
    for (const former of agent.formerSlugs ?? []) {
      if (seenAgents.has(former)) {
        error(
          `agents/${agent.slug}`,
          `formerSlugs contient « ${former} », qui est le slug d'un agent existant`,
        );
      }
    }
  }

  /* ── Concepts ───────────────────────────────────────────────────────────── */

  const seenConcepts = new Set<string>();
  for (const concept of concepts) {
    const where = `concepts/${concept.slug}`;
    if (!SLUG_RE.test(concept.slug)) error(where, 'slug non conforme (minuscules, tirets)');
    if (seenConcepts.has(concept.slug)) error(where, 'slug en double');
    seenConcepts.add(concept.slug);
    if (!concept.name.trim()) error(where, 'nom vide');
  }
  for (const concept of concepts) {
    for (const rel of concept.related ?? []) {
      if (!seenConcepts.has(rel)) error(`concepts/${concept.slug}`, `voisin inconnu : ${rel}`);
      if (rel === concept.slug) error(`concepts/${concept.slug}`, 'voisin de lui-même');
    }
  }

  /* ── Items ──────────────────────────────────────────────────────────────── */

  const seenItems = new Set<string>();
  for (const item of items) {
    const where = `items/${item.slug}`;
    if (!SLUG_RE.test(item.slug)) error(where, 'slug non conforme (minuscules, tirets)');
    /* Unicité par TYPE, pas globale : l'URL est /inventaire/<type>/<slug>/. */
    const key = `${item.type}/${item.slug}`;
    if (seenItems.has(key)) error(where, `slug en double dans le type ${item.type}`);
    seenItems.add(key);

    if (!COLLECTION_TYPES.includes(item.type)) error(where, `type inconnu : ${item.type}`);
    if (!item.title.trim()) error(where, 'titre vide');

    if (!isIsoDate(item.added)) {
      error(where, `added : « ${item.added} » doit être une date complète AAAA-MM-JJ`);
    }
    if (item.published && !isPartialDate(item.published)) {
      error(where, `published : « ${item.published} » n'est pas une date ISO partielle`);
    }

    /** Une citation sans son texte n'est pas une citation. */
    if (item.type === 'citation' && !item.text?.trim()) {
      error(where, 'une citation doit porter son texte dans `text`');
    }

    /* Le corpus Notion a un champ « lien » qui contient parfois « Song Love from
       Gojira band » — c'est-à-dire pas un lien. D'où la vérification. */
    if (item.link && !/^https?:\/\//.test(item.link)) {
      error(where, `link : « ${item.link} » doit être une URL absolue`);
    }
    for (const source of item.sources ?? []) {
      if (!/^https?:\/\//.test(source.url)) {
        error(where, `sources : « ${source.url} » doit être une URL absolue`);
      }
    }
    if (item.shelf && !SHELVES.includes(item.shelf)) {
      error(where, `état de lecture inconnu : ${item.shelf}`);
    }
    /* Une citation ne se lit pas « en entier » : elle EST l'extrait. */
    if (item.shelf && item.type === 'citation') {
      warn(where, '`shelf` n\'a pas de sens sur une citation');
    }
    if (item.attribution && !ATTRIBUTIONS.includes(item.attribution)) {
      error(where, `attribution inconnue : ${item.attribution}`);
    }

    /* ── Langue et traductions ── */

    if (item.lang && !LANGUAGES.includes(item.lang)) {
      error(where, `langue inconnue : « ${item.lang} »`);
    }
    if (item.translations?.length && !item.lang) {
      error(where, 'des traductions, mais la langue de `text` n\'est pas déclarée');
    }
    const seenTranslations = new Set<string>();
    for (const t of item.translations ?? []) {
      if (!LANGUAGES.includes(t.lang)) error(where, `traduction en langue inconnue : « ${t.lang} »`);
      if (!t.text.trim()) error(where, `traduction vide (${t.lang})`);
      /* Une « traduction » dans la langue de l'original est soit un doublon,
         soit une variante — dans les deux cas ce n'est pas une traduction. */
      if (t.lang === item.lang) error(where, `traduction dans la langue de l'original (${t.lang})`);
      if (seenTranslations.has(t.lang)) error(where, `deux traductions en ${t.lang}`);
      seenTranslations.add(t.lang);
      if (t.translatedBy && !seenAgents.has(t.translatedBy)) {
        error(where, `traducteur inconnu : « ${t.translatedBy} »`);
      }
      if (t.source && !/^https?:\/\//.test(t.source.url)) {
        error(where, `source de traduction non absolue : ${t.source.url}`);
      }
    }

    /* Celui qui a fait découvrir l'item est un agent comme un autre : il a une
       page, donc il doit exister. */
    if (item.suggestedBy && !seenAgents.has(item.suggestedBy)) {
      error(where, `suggestedBy : agent inconnu « ${item.suggestedBy} »`);
    }

    /* Une faute de frappe sur un concept est une référence morte, plus un
       28ᵉ concept créé en silence. C'est tout le gain de l'entité. */
    if (concepts.length) {
      const seenOnItem = new Set<string>();
      for (const slug of item.concepts ?? []) {
        if (!seenConcepts.has(slug)) error(where, `concept inconnu : ${slug}`);
        if (seenOnItem.has(slug)) error(where, `concept en double : ${slug}`);
        seenOnItem.add(slug);
      }
    }

    /* ── Crédits ── */

    if (!item.credits.length) {
      warn(where, 'aucun crédit : cet item sera invisible depuis toutes les pages de noms');
    }

    const seenAgentsOnItem = new Set<string>();
    item.credits.forEach((credit, i) => {
      const creditWhere = `${where}#credits[${i}]`;

      /** LA vérification qui compte : la cible existe-t-elle ? */
      if (!seenAgents.has(credit.agent)) {
        error(creditWhere, `référence morte vers agents/${credit.agent}`);
      }

      /** Un seul crédit par agent et par item — c'est ce que `roles[]` permet. */
      if (seenAgentsOnItem.has(credit.agent)) {
        error(
          creditWhere,
          `${credit.agent} apparaît deux fois : fusionne les rôles dans un seul crédit`,
        );
      }
      seenAgentsOnItem.add(credit.agent);

      if (!credit.roles.length) error(creditWhere, 'roles vide');
      if (new Set(credit.roles).size !== credit.roles.length) {
        error(creditWhere, 'rôle en double');
      }
      for (const role of credit.roles) {
        if (!COLLECTION_ROLES.includes(role)) error(creditWhere, `rôle inconnu : ${role}`);
      }
    });
  }

  /* ── Agents orphelins ───────────────────────────────────────────────────── */

  /* `suggestedBy` compte autant qu'un crédit : celui qui a fait découvrir un
     item a bien quelque chose sur sa page. Trou trouvé en écrivant les fixtures
     — Pénélope était signalée orpheline alors qu'elle avait apporté un item. */
  const cited = new Set([
    ...items.flatMap((i) => i.credits.map((c) => c.agent)),
    ...items.flatMap((i) => (i.suggestedBy ? [i.suggestedBy] : [])),
  ]);
  /* Un membre de groupe cité est légitimement sans item à lui : il est visible
     par la page de son groupe. Ne pas le signaler évite un bruit permanent. */
  const membersOfCitedGroups = new Set(
    agents.filter((a) => cited.has(a.slug)).flatMap((a) => a.members ?? []),
  );
  for (const agent of agents) {
    if (!cited.has(agent.slug) && !membersOfCitedGroups.has(agent.slug)) {
      warn(`agents/${agent.slug}`, 'aucun item : sa page serait vide');
    }
  }

  const usedConcepts = new Set(items.flatMap((i) => i.concepts ?? []));
  for (const concept of concepts) {
    if (!usedConcepts.has(concept.slug)) {
      warn(`concepts/${concept.slug}`, 'aucun item : sa page serait vide');
    }
  }

  return issues;
}

/**
 * Règles propres aux **propositions** — ce que des inconnus proposent, et qui
 * n'est pas encore entré dans le fonds.
 *
 * Une proposition est un item comme un autre pour le schéma : elle passe par
 * `validate()` avec les items. Ces deux règles-ci s'y ajoutent, et elles
 * existent parce qu'une proposition n'est PAS un ajout au fonds — c'est un
 * cadeau qui attend d'être accepté.
 */
export function validatePropositions(propositions: CollectionItem[]): Issue[] {
  const issues: Issue[] = [];
  for (const item of propositions) {
    const where = `propositions/${item.slug}`;

    /* Sans elle, on ne saurait plus qui a montré quoi — et c'est la seule
       chose que le contributeur reçoit en retour. */
    if (!item.suggestedBy) {
      issues.push({ severity: 'error', where, message: '`suggestedBy` est obligatoire ici' });
    }

    /* `note` dit pourquoi Florian garde une chose. C'est sa voix ; elle n'est
       pas ouverte aux contributions. Le contributeur a `context` pour expliquer
       de quoi il s'agit. */
    if (item.note) {
      issues.push({
        severity: 'error',
        where,
        message: '`note` est réservé au propriétaire du fonds — utilise `context`',
      });
    }
  }
  return issues;
}

/** Sortie lisible + code de sortie exploitable en CI. */
export function report(issues: Issue[]): { ok: boolean; text: string } {
  if (!issues.length) return { ok: true, text: 'Collection valide.' };
  const errors = issues.filter((i) => i.severity === 'error');
  const lines = issues.map(
    (i) => `${i.severity === 'error' ? '✗' : '⚠'} ${i.where} — ${i.message}`,
  );
  lines.push(`\n${errors.length} erreur(s), ${issues.length - errors.length} avertissement(s).`);
  return { ok: errors.length === 0, text: lines.join('\n') };
}

/**
 * Règles des projets. Séparé de `validate()` parce que les projets ne sont pas
 * des items : ils n'ont ni crédits, ni concepts, ni date d'entrée dans un fonds.
 */
export function validateProjects(projects: Project[]): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const p of projects) {
    const where = `projects/${p.slug}`;
    const error = (m: string) => issues.push({ severity: 'error', where, message: m });

    if (!SLUG_RE.test(p.slug)) error('slug non conforme (minuscules, tirets)');
    if (seen.has(p.slug)) error('slug en double');
    seen.add(p.slug);

    if (!p.name.trim()) error('nom vide');
    if (!p.description.trim()) error('description vide');
    if (!PROJECT_STATUSES.includes(p.status)) error(`statut inconnu : ${p.status}`);

    if (p.repo && !/^https?:\/\//.test(p.repo)) error(`repo non absolu : ${p.repo}`);
    for (const l of p.links ?? []) {
      if (!/^https?:\/\//.test(l.url)) error(`lien non absolu : ${l.url}`);
    }
    /* Un projet qu'on ne peut ni lire ni visiter n'a rien à faire sur une page
       publique — c'est le cas des dépôts privés, d'où l'exigence d'un `links`. */
    if (!p.repo && !p.links?.length) {
      issues.push({
        severity: 'warning',
        where,
        message: 'ni dépôt public ni lien : rien à montrer au visiteur',
      });
    }
  }
  return issues;
}

/** Règles du journal. Pas de crédits à vérifier : l'auteur est toujours le même. */
export function validateJournal(entries: JournalEntry[], concepts: Concept[] = []): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  const conceptSlugs = new Set(concepts.map((c) => c.slug));
  for (const e of entries) {
    const where = `journal/${e.slug}`;
    const error = (m: string) => issues.push({ severity: 'error', where, message: m });

    if (!SLUG_RE.test(e.slug)) error('slug non conforme (minuscules, tirets)');
    if (seen.has(e.slug)) error('slug en double');
    seen.add(e.slug);

    if (!JOURNAL_KINDS.includes(e.kind)) error(`type d'entrée inconnu : ${e.kind}`);
    if (!e.title.trim()) error('titre vide');
    if (!isIsoDate(e.published)) error(`published : « ${e.published} » doit être AAAA-MM-JJ`);
    if (e.written && !isPartialDate(e.written)) {
      error(`written : « ${e.written} » n'est pas une date ISO partielle`);
    }
    /** Un aphorisme sans son texte n'est rien : le texte EST l'entrée. */
    if (e.kind === 'aphorisme' && !e.text?.trim()) error('un aphorisme doit porter son texte');
    if (e.lang && !LANGUAGES.includes(e.lang)) error(`langue inconnue : « ${e.lang} »`);
    if (concepts.length) {
      for (const c of e.concepts ?? []) {
        if (!conceptSlugs.has(c)) error(`concept inconnu : ${c}`);
      }
    }
  }
  return issues;
}
