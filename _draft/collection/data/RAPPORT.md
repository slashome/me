# Import du corpus Notion — rapport

> Exécuté le 2026-08-29 depuis l'export `Citations eb1e2775f9294d52acfb8a77c38ee005_all.csv`.
> Validation : **0 erreur, 5 avertissements** (`npx tsx _draft/collection/data/check-data.ts`).
> Typecheck `tsc --strict` : **0 erreur**.

## Décompte

| | |
|---|---|
| Lignes dans l'export | 123 |
| **Lignes entièrement vides, ignorées** | **2** |
| Citations importées | **121** |
| Agents créés | **72** — 68 personnes, 3 personnages, 1 organisation |
| Citations sans aucun crédit | 5 |

⚠️ **Les deux lignes ignorées ne sont pas des citations perdues** : elles sont vides dans tous
leurs champs, ce sont des lignes vides de ta base Notion. Rien n'a été jeté.

## Les auteurs les plus cités

| | |
|---|---|
| **20** | Florian Boulestreau (`flow`, saisi « Majin ») |
| 8 | Hannah Arendt |
| 4 | Albert Einstein |
| 3 | Paul Valéry, Albert Camus, Bernard Stiegler, Baruch Spinoza, Victor Hugo, Viktor E. Frankl, Giordano Bruno |

## Corrections d'orthographe

Le nom corrigé est dans `name` ; la forme d'origine est ci-dessous et nulle part ailleurs.
**À relire** — je peux m'être trompé sur l'intention.

| Dans l'export | Retenu |
|---|---|
| Herodote | Hérodote |
| Echylle | Eschyle |
| Alexande Astier | Alexandre Astier |
| George Bernard Shawn | George Bernard Shaw |
| Francis N'Gannou | Francis Ngannou |
| Alfred N. Whitehead | Alfred North Whitehead |
| Ali ibn abi Talib | Ali ibn Abi Talib |
| Dr Kwame Nkrumah | Kwame Nkrumah |
| Genghis Khan | Gengis Khan |
| Philippe Fragione (Akhenaton) | Philippe Fragione + surnom « Akhenaton » |

## Ce que j'ai tranché, et comment

- **Deux champs `Auteur` contenaient deux personnes** : « Jean de la Fontaine, Jean-Marc
  Jancovici » et « Joel Duplantier, Mario Duplantier ». Séparés en deux crédits `author`.
  ⚠️ Pour les frères Duplantier j'ai écrit « Joe Duplantier » (l'orthographe usuelle du chanteur
  de Gojira) — **à vérifier**.
- **« Anonyme » n'est pas devenu un agent.** Une absence de nom n'est pas une identité : l'item
  n'a simplement aucun crédit.
- **Les rôles déduits de la colonne `Contexte`** — les seuls endroits où j'ai dépassé `author` :
  - *« Récité par Jean D'Ormesson à la télévision »* → Aragon `author`, d'Ormesson `speaker` ;
  - *« Texte écrit par Astier et récité par Pierre Mondi en tant que César »* → Astier `author`,
    César (`character`) `speaker`, Pierre Mondy `performer` — trois agents pour une réplique ;
  - *« Politically Incorrect with Bill Maher »* → Carlin `interviewee`, l'émission
    (`organization`) `publisher` ;
  - *« Réponse à la question d'une journaliste américaine »* → Cousteau `interviewee` ;
  - Ra's al Ghul et Tyrell Wellick créés en `character`, `speaker`.
- **Deux attributions relevées** : `misattributed` sur la citation *« faussement attribuée à
  Bruce Lee ou Warren Buffett »* (avec le lien Quote Investigator déplacé en `sources`), et
  `altered` sur celle d'Hérodote (*« citation modifiée avec le temps »*).
- **Le champ `lien` contenant « Song Love from Gojira band »** n'est pas une URL : déplacé en
  `context`. C'est la seule valeur non conforme du champ.
- **Les `title` sont des incipits** (les huit premiers mots, suivis de `…` si tronqué). La source
  n'avait pas de titre — le « Nom » d'une ligne Notion *est* le texte de la citation. C'est une
  convention honnête (on cite un poème par son premier vers), mais ce sont des titres de machine :
  **ceux qui comptent méritent d'être réécrits à la main.**
- **Les slugs** sont `<nom-de-famille>-<3 mots significatifs>`, sans accents, dédupliqués par
  suffixe numérique. Uniques dans le type `citation`, comme le veut le modèle.

## Ce que j'ai refusé d'inventer

- **Aucune `bio`, aucune date de naissance, aucun `wikidata`, aucun lien** pour les 68 nouvelles
  personnes. La source n'en contenait pas. Les remplir demande une décision éditoriale par
  personne, pas un script.
- **Aucun `note`.** C'est le champ qui dit *pourquoi tu gardes une citation* — ce sont tes mots,
  ils ne sont écrits nulle part dans l'export, et je ne les écrirai pas à ta place.
- **Aucun `published`.** Dater 121 citations demanderait de retrouver 121 sources.
- **`sortName`** est dérivé par règle (`Nom, Prénom`) sauf pour une liste curée à la main
  (particules : « La Fontaine, Jean de » ; mononymes : Aragon, Coluche, Montesquieu, Marc Aurèle,
  Eschyle, Hérodote, Gandhi, Gengis Khan, Ali ibn Abi Talib, qui n'en ont pas). **À relire** :
  c'est l'endroit où une règle automatique se trompe le plus.

## Points de vigilance avant publication

1. **Une citation vient d'un particulier identifiable.** Le contexte dit *« Dit par Lambda le
   18 mai 2024 à 15:15 »* sur une phrase attribuée à Eschyle. Si « Lambda » est une personne
   réelle de ton entourage, publier ses propos datés sans son accord n'est pas anodin. Rien n'a
   été supprimé — c'est à toi de trancher.
2. **Une citation est signalée comme générée par ChatGPT** dans son contexte, tout en étant
   attribuée à toi. À arbitrer : est-ce de toi, ou d'une machine que tu as fait parler ?
3. **Cinq citations n'ont aucun crédit** et seront donc invisibles depuis toute page de nom.
   C'est correct au regard de la source, ce n'est pas un bug.
4. **Les corrections d'orthographe ci-dessus n'ont pas été validées par toi.**

## Ce que le corpus dit du modèle

Rien à corriger. Les trois champs ajoutés après la première lecture du corpus (`character`,
`context`, `attribution`) ont tous servi à l'import, et aucun cas n'a résisté au modèle.

Un manque persiste, déjà noté et volontairement non traité : **une citation tirée d'une œuvre ne
peut pas pointer vers cette œuvre.** « Des chefs de guerre… » vient de Kaamelott, la réplique de
Ra's al Ghul vient de Batman Begins, « The roots so deep » vient d'une chanson de Gojira — et ces
œuvres sont des items potentiels de l'inventaire. Il manque une relation item↔item (`from`). Elle
est purement additive, donc sans urgence.
