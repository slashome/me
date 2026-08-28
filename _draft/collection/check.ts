/**
 * Point d'entrée exécutable : charge les fixtures, valide, construit l'index,
 * et imprime ce que verraient les pages « Simone Weil » et « Dany Bill ».
 *
 *   npx tsx _draft/collection/check.ts
 *
 * (ou n'importe quel runner TS — le fichier ne dépend d'aucun framework.)
 */

import agentsFixture from './fixtures/agents.json' with { type: 'json' };
import itemsFixture from './fixtures/items.json' with { type: 'json' };
import { appearancesOfAgent, buildIndex, rolesOfAgent } from './index-builder';
import { formatPartialDate } from './partial-date';
import { fromKeyed, ROLE_LABELS, type Agent, type CollectionItem, type Keyed } from './types';
import { report, validate } from './validate';

/** `_comment` est une clé de documentation dans les fixtures, pas une entrée. */
function withoutComment<T extends object>(record: Record<string, unknown>): Keyed<T> {
  const { _comment: _ignored, ...rest } = record;
  return rest as Keyed<T>;
}

const agents = fromKeyed<Agent>(withoutComment<Agent>(agentsFixture));
const items = fromKeyed<CollectionItem>(withoutComment<CollectionItem>(itemsFixture));

const { ok, text } = report(validate(agents, items));
console.log(text);
/** Un throw suffit à sortir en code non nul, sans dépendre des types de Node. */
if (!ok) throw new Error('Collection invalide — voir les erreurs ci-dessus.');

const index = buildIndex(agents, items);

for (const slug of ['simone-weil', 'dany-bill'] as const) {
  const agent = index.agents.get(slug)!;
  const roles = rolesOfAgent(index, slug).map((r) => ROLE_LABELS[r]);
  console.log(`\n── ${agent.name} — ${roles.join(' · ')}`);

  for (const { item, roles: itemRoles } of appearancesOfAgent(index, slug)) {
    const date = item.published ? ` (${formatPartialDate(item.published)})` : '';
    console.log(
      `   ${item.type.padEnd(9)} ${item.title}${date}` +
        `  [${itemRoles.map((r) => ROLE_LABELS[r]).join(', ')}]`,
    );
  }
}
