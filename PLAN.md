# Site perso slashome.me — plan de construction

## Contexte

Le dépôt `slashome/me` (cloné dans `~/workspace/projects/slashome/me`) est un placeholder vide : un README (`# website`, à corriger) et une LICENSE GPL v3, un seul commit. Objectif : un site personnel évolutif sur `slashome.me` qui suive Florian dans le temps — projets/repos, présentation (« ID Card » avec compétences), citations favorites, blog.

Décisions prises :
- **Stack : Astro** (statique, contenu Markdown, quasi zéro JS livré, durable)
- **Sections v1** : Projets (probablement page d'accueil), Blog, ID Card (présentation + compétences), Citations (page séparée)
- **Hébergement : GitHub Pages** + domaine `slashome.me` via DNS Gandi (le site Gandi existant n'est pas touché — on n'ajoute que des enregistrements DNS)

⚠️ L'utilisateur part du travail : **la toute première étape est de committer ce plan en `PLAN.md` à la racine du repo et pusher**, pour reprendre à la maison.

## Étape 0 — Sauvegarde immédiate (à faire en premier)

1. Copier ce plan dans `~/workspace/projects/slashome/me/PLAN.md`
2. Corriger `README.md` (titre `# slashome.me`, courte description)
3. `git add + commit + push` sur `main`

## Étape 1 — Scaffold Astro

Dans le repo :
```bash
npm create astro@latest . -- --template minimal --no-git --typescript strict
```
- `astro.config.mjs` : `site: 'https://slashome.me'`
- `.gitignore` standard (node_modules, dist, .astro)
- Vérifier : `npm run dev` → http://localhost:4321

## Étape 2 — Structure du contenu (content collections)

```
src/
├── content.config.ts        # schémas des collections
├── content/
│   ├── blog/                # articles .md (title, date, description, tags, draft)
│   └── quotes/              # ou src/data/quotes.json si plus simple
├── data/
│   └── projects.ts          # liste des projets : nom, description, repo URL, tags, statut (actif/archivé)
├── layouts/
│   └── Base.astro           # <head>, nav, footer, styles globaux
└── pages/
    ├── index.astro          # accueil = Projets (à confirmer à l'usage)
    ├── blog/
    │   ├── index.astro      # liste des articles
    │   └── [slug].astro     # page article
    ├── id-card.astro        # présentation + compétences pro/perso
    ├── citations.astro      # citations favorites
    └── rss.xml.ts           # flux RSS du blog (@astrojs/rss)
```

Projets à référencer au départ (repos GitHub `slashome/*`) : karaokay, kosmos, redlight, dotflies (attention : s'écrit bien « dotflies »), daedalus, userscripts, dreamcatchr…

## Étape 3 — Design minimal v1

- CSS vanilla dans `src/styles/` (pas de framework CSS — durabilité)
- Layout sobre : nav simple (Projets / Blog / ID Card / Citations), typographie lisible, dark/light via `prefers-color-scheme`
- Un composant `ProjectCard.astro` et un `QuoteBlock.astro`

## Étape 4 — Déploiement GitHub Pages

1. `.github/workflows/deploy.yml` : workflow officiel Astro → GitHub Pages (`withastro/action`), déclenché sur push `main`
2. `public/CNAME` contenant `slashome.me`
3. Dans les settings GitHub du repo : Pages → Source = GitHub Actions, custom domain `slashome.me`, Enforce HTTPS
4. Chez Gandi (DNS uniquement, l'hébergement existant n'est pas modifié) :
   - 4 enregistrements `A` sur l'apex : `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME www` → `slashome.github.io`

## Étape 5 — Contenu initial

- 1 article de blog « Hello world » pour valider la chaîne complète
- ID Card : présentation courte + compétences
- 3–4 citations
- Liste de projets remplie

## Notes / à trancher plus tard

- **LICENSE** : GPL v3 est inhabituel pour un site perso (MIT pour le code, CC-BY pour le contenu serait plus courant) — à changer si souhaité
- La page d'accueil (Projets vs présentation) pourra pivoter facilement, c'est juste `index.astro`

## Vérification

1. `npm run dev` → toutes les pages rendent sans erreur
2. `npm run build && npm run preview` → build statique OK, RSS accessible sur `/rss.xml`
3. Push → le workflow GitHub Actions passe au vert → `https://slashome.github.io/me` puis `https://slashome.me` une fois le DNS propagé (vérifier avec `dig slashome.me`)
