// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

// https://astro.build/config
export default defineConfig({
  site: 'https://ponyscope.com',
  // SSG pur : output statique pour Cloudflare Pages
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    // Génère sitemap-index.xml + sitemap-0.xml au build (utilise `site` ci-dessus).
    sitemap(),
    // Indexe le HTML buildé pour la recherche globale (Pagefind).
    // ⚠️ L'index n'est produit qu'au `build` — la recherche ne marche donc PAS
    // en `npm run dev`, seulement après `npm run build && npm run preview`.
    pagefind(),
  ],
});
