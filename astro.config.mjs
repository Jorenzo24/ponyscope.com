// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://ponyscope.com',
  // SSG pur : output statique pour Cloudflare Pages
  output: 'static',
  trailingSlash: 'ignore',
});
