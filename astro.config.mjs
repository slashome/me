// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://slashome.me',
  redirects: {
    '/projets': '/projects/',
    '/blog': '/journal/',
    '/citations': '/inventory/quotes/',
  },
});
