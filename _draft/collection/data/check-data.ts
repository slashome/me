/**
 * Valide le corpus réel importé de Notion, puis imprime ce qu'en verrait le site.
 *
 *   npx tsx _draft/collection/data/check-data.ts
 *
 * Distinct de `../check.ts`, qui exerce les fixtures pédagogiques. Ici, ce sont
 * les vraies données : 123 citations, 72 agents.
 */

import { appearancesOfAgent, buildIndex, compareAgents, rolesOfAgent } from '../index-builder';
import { fromKeyed, ROLE_LABELS, type Agent, type CollectionItem, type Keyed } from '../types';
import { report, validate } from '../validate';
import agentsData from './agents.json' with { type: 'json' };
import citationsData from './items/citations.json' with { type: 'json' };

function withoutComment<T extends object>(record: Record<string, unknown>): Keyed<T> {
  const { _comment: _ignored, ...rest } = record;
  return rest as Keyed<T>;
}

const agents = fromKeyed<Agent>(withoutComment<Agent>(agentsData));
const items = fromKeyed<CollectionItem>(withoutComment<CollectionItem>(citationsData));

const { ok, text } = report(validate(agents, items));
console.log(text);
if (!ok) throw new Error('Corpus invalide — voir les erreurs ci-dessus.');

const index = buildIndex(agents, items);

console.log(`\n${items.length} items · ${agents.length} agents`);
const byKind = new Map<string, number>();
for (const a of agents) byKind.set(a.kind, (byKind.get(a.kind) ?? 0) + 1);
console.log([...byKind].map(([k, n]) => `${k}: ${n}`).join(' · '));

console.log('\n── Les plus cités');
[...index.byAgent.entries()]
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10)
  .forEach(([slug, appearances]) => {
    const agent = index.agents.get(slug)!;
    console.log(
      `   ${String(appearances.length).padStart(3)}  ${agent.name.padEnd(26)} ` +
        rolesOfAgent(index, slug).map((r) => ROLE_LABELS[r]).join(', '),
    );
  });

console.log('\n── Items sans crédit (invisibles depuis toute page de nom)');
for (const item of items.filter((i) => !i.credits.length)) {
  console.log(`   ${item.slug}`);
}

console.log('\n── Les agents qui ne sont pas des personnes');
for (const agent of [...index.agents.values()].filter((a) => a.kind !== 'person').sort(compareAgents)) {
  const n = appearancesOfAgent(index, agent.slug).length;
  console.log(`   ${agent.kind.padEnd(13)} ${agent.name.padEnd(38)} ${n} item(s)`);
}
