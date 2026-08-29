// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://slashome.me',

  /**
   * Les anciens chemins français ont vécu une demi-heure en ligne. Les rediriger
   * ne coûte qu'une page de redirection statique par entrée, et ça évite qu'un
   * lien déjà partagé meure.
   */
  redirects: {
    /* Une seule forme par chemin : Astro génère `/projets/index.html`, qui
       répond aussi bien à `/projets` qu'à `/projets/`. Déclarer les deux
       produit une collision de routes. */
    '/projets': '/projects/',
    '/blog': '/journal/',
    '/citations': '/inventory/quotes/',
  },
});
