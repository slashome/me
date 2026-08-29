# Décisions d'architecture

Une décision par fichier, numérotée, jamais renumérotée. Le format est celui de
Michael Nygard : *Contexte*, *Décision*, *Conséquences*, plus un *Statut*.

Convention reprise telle quelle de [slashome/ariane](https://github.com/slashome/ariane/tree/develop/docs/adr),
délibérément : un projet n'a pas besoin d'inventer une seconde convention pour
lui-même.

- Une décision remplacée passe en `Superseded by NNNN` et **reste en place**. On
  ne réécrit pas l'histoire d'une décision, on la date.
- Un numéro n'est jamais réutilisé.
- On n'écrit une ADR que quand la décision est **coûteuse à défaire** ou quand
  elle sera **incompréhensible dans six mois** sans son motif.

| # | Décision | Statut |
|---|---|---|
| [0001](./0001-profile-plutot-que-a-propos.md) | `/profile/` plutôt que `/about/` ou `/character/` | Accepted |
