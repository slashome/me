# slashome.me

Mon site personnel — présentation, projets, blog, citations.

Construit avec [Astro](https://astro.build), déployé sur GitHub Pages.

Voir [PLAN.md](PLAN.md) pour la feuille de route.

## Développement

```bash
nvm use          # 22.12 minimum, voir .nvmrc
npm install
npm run dev      # http://localhost:4321
npm run check    # astro check (TypeScript strict)
npm run build    # build statique dans dist/
npm run preview  # sert dist/, tel qu'il sera déployé
```

**Pas de Docker, et c'est délibéré** : il n'y a ni base, ni service, ni backend —
rien à isoler. La seule chose qui varie d'une machine à l'autre est la version de
Node, et `.nvmrc` la fixe pour un coût nul. Le jour où un service apparaît, la
question se reposera.

⚠️ Deux choses ne se voient qu'au **build**, pas dans `dev` : les redirections
depuis les anciens chemins français, et l'inlining de la CSS de l'écran-titre.
Pour juger ce qui sera réellement servi, c'est `npm run build && npm run preview`.

## Où vit le contenu

| Quoi | Où |
|---|---|
| Articles du blog | `src/content/blog/*.md` |
| Citations | `src/data/quotes.json` |
| Liste des projets | `src/data/projects.ts` |
| Présentation (accueil) | `src/pages/index.astro` |
| Styles | `src/styles/global.css` (CSS vanilla, pas de framework) |

Le déploiement part tout seul à chaque push sur `main`
(`.github/workflows/deploy.yml`).

## Licences

- **Code** : [MIT](LICENSE)
- **Contenu éditorial** : [CC BY 4.0](LICENSE-CONTENT)
