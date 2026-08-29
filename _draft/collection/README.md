# `_draft/collection` — modèle de la Collection

> **Emplacement temporaire et assumé.** Ce dossier vit à la racine, hors de `src/`, donc
> Astro ne le voit pas et le build ne le touche pas. Il bougera quand la techno du site
> sera arrêtée — c'est exactement pourquoi il ne contient **aucun import de framework**.

## Ce qu'il y a ici

| Fichier | Rôle |
|---|---|
| `types.ts` | le modèle. TypeScript pur, zéro dépendance |
| `partial-date.ts` | les dates partielles ISO et leurs helpers |
| `index-builder.ts` | les index dérivés — dont `byAgent`, celui qui justifie tout |
| `validate.ts` | les règles d'intégrité, indépendantes du framework |
| `check.ts` | point d'entrée exécutable : valide + imprime les pages « Simone Weil » et « Dany Bill » |
| `fixtures/` | données de travail. **Contenu non vérifié, ne pas publier** |

```bash
npx tsx _draft/collection/check.ts
```

## Les fixtures sont le site d'Ulysse

Plutôt qu'un jeu de données abstrait, elles montrent **à quoi ressemblerait le site
de quelqu'un** — en l'occurrence Ulysse. C'est une démonstration complète : son
inventaire (ce qui l'a formé), ses projets (le cheval, l'arc, le radeau), son
journal, son Panthéon.

Le choix du domaine public évite tout problème de marque, et le registre va avec
slashome — ariane, knossos, daedalus. **Aucun texte n'est mis dans la bouche
d'Homère** : ce qui est prêté à des personnages est inventé, donc c'est de la
fiction sur de la fiction et non une fausse attribution.

Chaque entrée exerce **un point précis du modèle** et le dit dans sa `note` : le
personnage qui prononce sans écrire, le groupe que `Person` ne savait pas
représenter, l'organisation qui diffuse, la traduction posée à côté de l'original,
`suggestedBy` qui survit à l'adoption, l'attribution fausse assumée, et la
différence entre « anonyme » et « on ne sait pas ».

Deux entrées exercent une **limite** du modèle au lieu de la cacher : `published`
et `written` sont des dates ISO tronquées, qui ne savent pas dire « avant notre
ère ». Le champ reste vide et la date vit dans `context` — inventer un `-0800`
aurait cassé le tri lexicographique de tout le fonds pour une entrée.

## Les décisions prises, et pourquoi

**Le rôle est porté par le lien, pas par l'item.** C'est le point que tout le reste sert.
Simone Weil est `author` de ses citations et `subject` d'une vidéo sur elle ; Dany Bill
est `author` d'une citation et `performer` dans ses combats. Une seule liste plate
`credits[]` sur l'item, jamais des champs `subject:` / `performer:` séparés — sinon
répondre à « tout ce qui concerne X » oblige à parcourir douze champs, et ajouter un
rôle oblige à rouvrir le type.

**`roles` est un tableau.** Parce que l'interface de saisie le demande : on choisit un
nom, puis on coche `subject`, `performer`, ou les deux. Un rôle unique forcerait deux
crédits pour le même agent sur le même item — donc l'item apparaîtrait deux fois sur sa
page, et il faudrait dédupliquer à l'affichage. Invariant : **un seul crédit par agent
et par item**, vérifié par `validate.ts`.

**Les agents sont référencés par slug, pas par valeur.** Comparer `"Simone Weil"` à
`"S. Weil"` ne marche pas. Le slug est aussi l'URL, et il permet de vérifier au build
que la cible existe.

**Pas d'UUID.** Illisible dans un fichier édité à la main, une étape de plus à chaque
ajout, et ça n'achète rien tant qu'il n'y a pas de second système. Le pont vers un futur
ATLAS est `wikidata?: "Q…"` : gratuit, stable, et VIAF / BnF / IMDb / Discogs sont tous
atteignables depuis lui — meilleure clé de jointure qu'un identifiant frappé ici.

**Pas de `firstname` / `lastname`, un seul `name` + `sortName`.** La découpe casse sur
Colette, Stromae, Aristote, Homère et tous les groupes. Son seul service était le tri
alphabétique, que `sortName` rend mieux (« Weil, Simone »).

**Pas de timestamp pour `published`.** ISO 8601 tronqué : `"1947"`, `"1947-04"`,
`"1947-04-12"`. La longueur de la chaîne porte la précision réellement détenue. Un
`number` force à inventer un mois et un jour pour un livre posthume de 1947 — précision
inventée = corruption de données, silencieuse et irréversible.

**`added` a été ajouté.** Il manquait. C'est la date d'ajout à la collection : toujours
connue, et c'est le seul tri qui fonctionne quand `published` est absent (donc sur la
plupart des citations).

**Pas de `content: image | text` en union.** Une union dit « l'un OU l'autre », or un
livre a une couverture **et** un extrait relevé. Trois champs séparés : `cover` (mise en
page, identique aux 6 types), `text` (les mots de l'auteur), `note` (**tes** mots).

**Pas de `CollectionList`.** Un `total` n'a de sens que si un client voit une *fenêtre*
sur des données qu'il n'a pas — il n'y a pas d'API, le build possède tout. Un filtre est
une intention utilisateur : il vit dans l'URL, pas dans un type de domaine.

**Pas de `history: Event[]`.** Sur un site à fichiers versionnés, ajouter un champ
*optionnel* est une migration gratuite. Rien à préparer. Ce qui coûterait cher, c'est de
changer le **type** d'un champ déjà rempli à la main — d'où le soin porté à `published`
et l'indifférence à `history`.

## Les décisions encore ouvertes

**1. Le nom du type et de sa collection — c'est la seule qui coûte cher plus tard**,
parce qu'elle devient une URL publique. `Person` ne tient pas : dès qu'il y a des vinyls,
la moitié des crédits sont des groupes. Le domaine appelle ça un *agent* (vocabulaire des
bibliothèques : Person / Corporate Body), d'où `Agent` + `kind: 'person' | 'group'` ici —
au prix d'une collision avec les agents IA, qui sont partout ailleurs dans slashome.
Alternatives : `Figure`, `Name`, `Contributor` (faux pour un `subject`). Et l'URL :
`/collection/personnes/` ment sur Massive Attack ; `/collection/noms/` ne ment pas.

**2. `roleNote` sur le crédit ou pas.** Aujourd'hui c'est `Credit.note`. Utile pour
« combat contre X, 1992 » ; à supprimer si ça ne sert jamais.

**3. La liste des rôles.** Douze, choisis pour couvrir ce qui existe. Tout rôle pour
lequel tu ne peux pas citer un item réel est spéculatif : à retirer.

**4. La techno.** Voir ci-dessous.

## Ce qui dépend du framework, et ce qui n'en dépend pas

Ce dossier est la réponse concrète à « je ne suis pas sûr de vouloir prendre Astro ».

**Ne dépend de rien** — donc survit à n'importe quel choix : le modèle, les règles de
validation, les index dérivés, les fixtures. C'est-à-dire la quasi-totalité du travail
de conception, et la seule partie coûteuse à refaire.

**Dépend du framework** — donc jetable, quelques dizaines de lignes : le schéma de
validation (Zod dans `content.config.ts` si Astro), le chargement des fichiers, le
routage, le pipeline d'images.

Une seule chose est à savoir avant de trancher : si le site reste sur Astro,
`reference()` **ne vérifie pas** que la cible existe. Astro logge une erreur très précise,
puis **sort en code 0 et publie une page contenant `UNDEFINED`** — sur GitHub Actions,
log rouge et déploiement vert. Le `throw` de `index-builder.ts` est là pour ça.
