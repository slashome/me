# slashome.me

Mon site personnel — présentation, projets, blog, citations.

Construit avec [Astro](https://astro.build), déployé sur GitHub Pages.

Voir [PLAN.md](PLAN.md) pour la feuille de route.

## Développement

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # astro check (TypeScript strict)
npm run build    # build statique dans dist/
npm run preview  # sert dist/
```

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
