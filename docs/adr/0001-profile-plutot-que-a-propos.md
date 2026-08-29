# 0001 — `/profile/` plutôt que `/about/` ou `/character/`

- **Statut** : Accepted
- **Date** : 2026-08-29

## Contexte

Le site prend la forme d'un menu de jeu vidéo. Une de ses entrées mène à la page
qui parle de son propriétaire : présentation, ce qui l'occupe hors du clavier,
compétences, points de contact.

Le nom initial était **« À propos »**. Il a été jugé mauvais, et il l'est : c'est
le vocabulaire du site institutionnel, il annonce une page qu'on ne lit pas, et
il jure avec le reste de l'interface — un écran-titre n'a pas d'« à propos ».

Trois candidats ont été pesés.

- **`/about/`** — attendu, neutre, et sans rapport avec le genre choisi.
- **`/character/`** — exact au regard du contenu prévu : la page affichera des
  **statistiques** plutôt qu'un CV, à la manière d'une fiche de personnage de
  SCUM. L'objection retenue contre lui : il désigne un personnage *joué*, un
  avatar. Or la personne n'est pas un avatar.
- **`/profile/`** — le mot que les jeux emploient pour le **profil du joueur**,
  celui qui joue et non celui qu'on incarne.

L'objection faite à `/profile/` était qu'il évoque LinkedIn. Elle est réelle mais
elle suppose un contexte que le site ne donne pas : dans un menu qui affiche
*Inventaire*, *Agents* et *Options*, le registre est fixé avant que le mot ne
soit lu.

## Décision

**La page est `/profile/`.**

Le motif est celui-ci, et il n'est pas d'ergonomie :

> Dans un jeu, le profil est celui **du joueur**, pas du personnage. Ce site est
> mon jeu. Ce que les visiteurs y parcourent, c'est le monde vu par mes yeux —
> ils sont dans ma partie. Le profil affiché est donc le mien, au sens exact où
> un jeu l'entend.

`/character/` aurait dit « voici un personnage », ce qui aurait été un mensonge
poli. `/about/` aurait dit « voici une notice ». `/profile/` dit « voici qui
tient la manette », et c'est vrai.

Le chemin est en anglais comme tous les autres ; le libellé affiché est
**« Profil »**.

## Conséquences

- Le lien GitHub, et plus tard les autres points de contact, vivent sur cette
  page et non sur l'écran-titre. L'écran-titre ne porte que le menu.
- La page accueillera les blocs retirés de l'accueil — « hors du clavier » et les
  compétences — sous forme de statistiques.
- Ce choix engage le reste du vocabulaire : si le profil est celui du joueur,
  alors les autres écrans doivent rester dans le registre du jeu (*Inventaire*,
  *Agents*, *Options*) plutôt que dans celui du site personnel (*Collection*,
  *Contact*, *Réglages*). C'est une contrainte assumée, pas un effet de bord.
- `/about/` n'est pas redirigé : il n'a jamais existé publiquement.

## Ce qui la ferait tomber

Si la page finit par ne contenir ni statistique ni rien qui relève du jeu — un CV
en prose, par exemple — le mot ne tiendra plus, et `/about/` sera le bon nom.
Cette ADR sera alors remplacée, pas modifiée.
