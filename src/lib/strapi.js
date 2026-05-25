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

/**
 * Slugifie un texte de heading pour générer un id d'ancre stable.
 * Doit donner le MÊME résultat qu'utilisé par BlocksRenderer pour les ids HTML.
 * @param {string} text
 * @returns {string}
 */
export function slugifyHeading(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')        // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Récupère le texte plat d'un noeud Strapi (paragraphe / heading / link / ...).
 * @param {object} node
 * @returns {string}
 */
function nodeText(node) {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.children)) {
    return node.children.map(nodeText).join('');
  }
  return '';
}

/**
 * Extrait les headings (h2/h3) du contenu d'un article pour construire le TOC.
 * Retourne un tableau d'objets { level, text, id }.
 * @param {Array<object>} blocks
 * @returns {Array<{level:number, text:string, id:string}>}
 */
export function extractHeadings(blocks) {
  if (!Array.isArray(blocks)) return [];
  const headings = [];
  const used = new Map(); // pour dédupliquer les slugs identiques

  for (const block of blocks) {
    if (block?.type !== 'heading') continue;
    const level = Math.min(Math.max(block.level || 2, 1), 6);
    if (level < 2 || level > 3) continue; // on garde h2 et h3 dans le TOC

    const text = nodeText(block).trim();
    if (!text) continue;

    let id = slugifyHeading(text);
    if (used.has(id)) {
      const n = used.get(id) + 1;
      used.set(id, n);
      id = `${id}-${n}`;
    } else {
      used.set(id, 1);
    }

    headings.push({ level, text, id });
  }

  return headings;
}

/**
 * Renvoie jusqu'à `limit` articles liés à l'article courant.
 * Stratégie : même primaryCategory, exclu lui-même, trié par date desc.
 * Fallback : complète avec d'autres articles récents si pas assez dans la catégorie.
 *
 * @param {object} currentArticle
 * @param {Array<object>} allArticles
 * @param {number} limit  Nombre d'articles à retourner (3 par défaut)
 * @returns {Array<object>}
 */
export function getRelatedArticles(currentArticle, allArticles, limit = 3) {
  if (!currentArticle || !Array.isArray(allArticles)) return [];

  const currentId = currentArticle.id;
  const categoryId = currentArticle.primaryCategory?.id;

  const byDateDesc = (a, b) => {
    const da = new Date(a.originalPublishedAt || a.publishedAt || 0).getTime();
    const db = new Date(b.originalPublishedAt || b.publishedAt || 0).getTime();
    return db - da;
  };

  const sameCat = allArticles
    .filter((a) => a.id !== currentId && a.primaryCategory?.id && a.primaryCategory.id === categoryId)
    .sort(byDateDesc);

  if (sameCat.length >= limit) return sameCat.slice(0, limit);

  // Pas assez dans la catégorie : on complète avec les plus récents tout court
  const others = allArticles
    .filter((a) => a.id !== currentId && (!categoryId || a.primaryCategory?.id !== categoryId))
    .sort(byDateDesc);

  return [...sameCat, ...others].slice(0, limit);
}