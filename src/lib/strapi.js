// src/lib/strapi.js
// Client minimal pour appeler l'API Strapi de Ponyscope.
// Utilisé au moment du build par Astro pour récupérer les articles et générer les pages statiques.

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || 'https://cms.ponyscope.com';

/**
 * Fait un GET sur l'API Strapi et renvoie le JSON.
 * @param {string} path  Chemin commençant par /api/...
 * @returns {Promise<any>}
 */
async function fetchAPI(path) {
  const url = `${STRAPI_URL}${path}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Strapi ${res.status} sur ${url}`);
  }

  return res.json();
}

/**
 * Récupère TOUS les articles publiés, avec leurs relations peuplées.
 * Pagination automatique pour récupérer les 585 articles.
 * @returns {Promise<Array>}  Tableau d'articles Strapi
 */
export async function getAllArticles() {
  const pageSize = 100;
  let page = 1;
  let all = [];

  while (true) {
    const populate = 'populate[cover]=true&populate[author][populate]=avatar&populate[categories]=true&populate[primaryCategory][populate][parent][populate]=parent&populate[seo][populate]=metaImage';
    const path = `/api/articles?${populate}&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
    const json = await fetchAPI(path);

    all = all.concat(json.data || []);

    const pageCount = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }

  return all;
}

/**
 * Récupère UN article par son slug, avec relations peuplées.
 * @param {string} slug
 * @returns {Promise<object|null>}
 */
export async function getArticleBySlug(slug) {
  const populate = 'populate[cover]=true&populate[author][populate]=avatar&populate[categories]=true&populate[primaryCategory][populate][parent][populate]=parent&populate[seo][populate]=metaImage';
  const path = `/api/articles?filters[slug][$eq]=${encodeURIComponent(slug)}&${populate}`;
  const json = await fetchAPI(path);
  return (json.data && json.data[0]) || null;
}

/**
 * Construit l'URL absolue d'un media Strapi (le `url` renvoyé est relatif : /uploads/xxx.jpg)
 * @param {string} url
 * @returns {string}
 */
export function mediaURL(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
}

/**
 * Convertit le canonicalURL Strapi en chemin Astro.
 * Ex : "https://ponyscope.com/blog/foo/" -> "/blog/foo"
 * Si pas de canonicalURL, fallback sur "/blog/{slug}"
 * @param {object} article
 * @returns {string}
 */
export function getArticlePath(article) {
  const canonical = article?.seo?.canonicalURL;
  if (canonical) {
    try {
      const u = new URL(canonical);
      const p = u.pathname.replace(/\/+$/, '');
      return p || '/';
    } catch {
      // canonicalURL malformé, on tombe sur le fallback
    }
  }
  return `/blog/${article.slug}`;
}