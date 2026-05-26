// src/lib/strapi.js
// Client minimal pour appeler l'API Strapi de Ponyscope.
// Utilisé au moment du build par Astro pour récupérer les articles et générer les pages statiques.

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || 'https://cms.ponyscope.com';

/**
 * Catégorie cachée : ses articles existent dans Strapi mais le site ne doit
 * jamais les exposer (ni page catégorie, ni breadcrumb, ni listing). Les pages
 * articles individuelles restent générées mais forcées en noindex.
 *
 * Le slug est volontairement opaque pour éviter toute collision accidentelle.
 */
export const HIDDEN_CATEGORY_SLUG =
  'vju86y7r5687ita7r0uv3lart1clebatar456tyt657hgt67ygfdtyrtuk67iuyguft7dfuydr';

/**
 * Indique si un article appartient à la catégorie cachée (à n'importe quel
 * niveau de la chaîne primaryCategory.parent).
 * @param {object} article
 * @returns {boolean}
 */
export function isHiddenArticle(article) {
  let cur = article?.primaryCategory;
  while (cur && cur.slug) {
    if (cur.slug === HIDDEN_CATEGORY_SLUG) return true;
    cur = cur.parent;
  }
  return false;
}

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
 * Exporté pour que BlocksRenderer puisse calculer les mêmes ids que extractHeadings.
 * @param {object} node
 * @returns {string}
 */
export function nodeText(node) {
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
 * Construit le fil d'ariane (breadcrumb) d'un article à partir de son
 * canonicalURL. Le dernier segment (= slug de l'article) est retiré.
 *
 * Ex : /blog/tops-cheval/top-10-foo → [
 *   { label: "Blog", path: "/blog" },
 *   { label: "Tops Cheval", path: "/blog/tops-cheval" }
 * ]
 *
 * @param {object} article
 * @returns {Array<{label:string, path:string}>}
 */
export function getArticleBreadcrumb(article) {
  const url = article?.seo?.canonicalURL;
  if (!url) return [];
  try {
    const u = new URL(url);
    const segs = u.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (segs.length < 2) return [];
    return segs.slice(0, -1).map((seg, i) => ({
      label: prettyCategoryName(seg),
      path: '/' + segs.slice(0, i + 1).join('/'),
    }));
  } catch {
    return [];
  }
}

/**
 * Construit l'arbre des catégories à partir du `primaryCategory` Strapi de
 * chaque article (et de sa chaîne de parents).
 *
 * Bug précédent : on dérivait les catégories des segments de canonicalURL,
 * mais comme tous les articles ont une URL `/blog/<slug>` (plate, héritée du
 * WP), tous se retrouvaient rangés sous /blog et nulle part ailleurs. La
 * source de vérité est désormais `primaryCategory` qui a sa propre
 * hiérarchie (parent → grand-parent, peuplée jusqu'à 3 niveaux).
 *
 * Un article dont primaryCategory = "tops-cheval" (parent : "tops") apparaît
 * à la fois sur `/tops` ET sur `/tops/tops-cheval` (héritage ascendant).
 *
 * @param {Array<object>} articles
 * @returns {Map<string, {path:string, slug:string, name:string, articles:Array, subcategories:string[]}>}
 */
export function getCategoryTree(articles) {
  const map = new Map();
  if (!Array.isArray(articles)) return map;

  for (const article of articles) {
    const cat = article?.primaryCategory;
    if (!cat || !cat.slug) continue;
    // Catégorie cachée : ne PAS générer de page catégorie pour ses articles.
    if (isHiddenArticle(article)) continue;

    // Walk up parent chain (Strapi populate : parent → grand-parent).
    // chain[0] = catégorie racine, chain[chain.length-1] = catégorie de l'article
    const chain = [];
    let cur = cat;
    while (cur && cur.slug) {
      chain.unshift({ slug: cur.slug, name: cur.name || prettyCategoryName(cur.slug) });
      cur = cur.parent;
    }
    if (chain.length === 0) continue;

    // Rattache l'article à CHAQUE niveau de la chaîne (ancêtres inclusifs)
    for (let i = 0; i < chain.length; i++) {
      const path = '/' + chain.slice(0, i + 1).map((c) => c.slug).join('/');
      if (!map.has(path)) {
        map.set(path, {
          path,
          slug: chain[i].slug,
          name: chain[i].name,
          articles: [],
          subcategoryPaths: new Set(),
        });
      }
      map.get(path).articles.push(article);
      if (i + 1 < chain.length) {
        const childPath = '/' + chain.slice(0, i + 2).map((c) => c.slug).join('/');
        map.get(path).subcategoryPaths.add(childPath);
      }
    }
  }

  // Dédup (un article peut apparaître plusieurs fois si on l'ajoute au même
  // bucket via plusieurs chemins — peu probable mais on protège) + tri + finalise
  const byDateDesc = (a, b) => {
    const da = new Date(a.originalPublishedAt || a.publishedAt || 0).getTime();
    const db = new Date(b.originalPublishedAt || b.publishedAt || 0).getTime();
    return db - da;
  };
  for (const cat of map.values()) {
    const seen = new Set();
    cat.articles = cat.articles.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    cat.articles.sort(byDateDesc);
    cat.subcategories = [...cat.subcategoryPaths].sort();
    delete cat.subcategoryPaths;
  }

  return map;
}

/**
 * Transforme un slug en nom lisible : "tops-cheval" → "Tops Cheval".
 * @param {string} slug
 * @returns {string}
 */
export function prettyCategoryName(slug) {
  return String(slug || '')
    .replace(/-/g, ' ')
    .replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

/**
 * Échappe les caractères HTML d'une chaîne pour insertion sûre dans du HTML.
 * @param {string} s
 * @returns {string}
 */
function escapeHTML(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Rend les children inline d'un bloc Strapi (paragraph/heading) en HTML.
 * Réplique fidèle de la logique renderInline de BlocksRenderer.astro pour
 * que le chapô extrait du 1er paragraphe ait exactement le même rendu que
 * s'il était rendu dans le flow normal du contenu.
 *
 * Supporte : text + marks (bold/italic/underline/strikethrough/code) + link.
 *
 * @param {Array<object>} children
 * @returns {string}  HTML inline
 */
function renderInlineHTML(children) {
  if (!Array.isArray(children)) return '';
  return children
    .map((child) => {
      if (!child) return '';
      if (child.type === 'text') {
        let html = escapeHTML(child.text || '');
        if (child.code) html = `<code>${html}</code>`;
        if (child.bold) html = `<strong>${html}</strong>`;
        if (child.italic) html = `<em>${html}</em>`;
        if (child.underline) html = `<u>${html}</u>`;
        if (child.strikethrough) html = `<s>${html}</s>`;
        return html;
      }
      if (child.type === 'link') {
        const inner = renderInlineHTML(child.children || []);
        const isExternal = child.url && child.url.startsWith('http');
        const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHTML(child.url || '#')}"${target}>${inner}</a>`;
      }
      return '';
    })
    .join('');
}

/**
 * Extrait le 1er paragraphe du contenu comme chapô (lede) avec drop cap,
 * et le retire des blocks pour éviter qu'il apparaisse une 2e fois.
 *
 * Remplace l'ancienne stratégie qui utilisait l'excerpt Strapi : beaucoup
 * d'articles migrés du WP ont des intros bien rédigées dans le contenu,
 * et l'excerpt est généré automatiquement avec une troncature "[...]"
 * disgracieuse. On préfère donc le vrai 1er paragraphe.
 *
 * Si le 1er bloc n'est pas un paragraphe (article qui démarre sur un
 * heading ou une image), ou si le paragraphe est trop court pour faire
 * un lede convaincant, renvoie ledeHTML: null (et aucun strip).
 *
 * @param {Array<object>} blocks
 * @param {number} minChars  Seuil minimum (chars) pour considérer comme lede
 * @returns {{ ledeHTML: string|null, remainingBlocks: Array<object> }}
 */
export function extractLedeFromBlocks(blocks, minChars = 80) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return { ledeHTML: null, remainingBlocks: blocks || [] };
  }
  const first = blocks[0];
  if (!first || first.type !== 'paragraph') {
    return { ledeHTML: null, remainingBlocks: blocks };
  }
  const text = nodeText(first).trim();
  if (text.length < minChars) {
    return { ledeHTML: null, remainingBlocks: blocks };
  }
  const ledeHTML = renderInlineHTML(first.children || []);
  return { ledeHTML, remainingBlocks: blocks.slice(1) };
}

/**
 * Si le 1er paragraphe du contenu est un quasi-doublon de l'excerpt
 * (chapô) — fréquent dans les articles migrés du WordPress —, on le supprime
 * pour éviter le doublon dans la page article.
 *
 * Heuristique : on compare les textes plats normalisés (lowercase + whitespace
 * collapsed). Si égal, ou si l'un commence par les 80 premiers caractères de
 * l'autre, on considère doublon.
 *
 * @param {Array<object>} blocks  Blocks Strapi du content
 * @param {string} excerpt        Excerpt brut (peut contenir du HTML léger)
 * @returns {Array<object>}       Blocks éventuellement amputés du 1er paragraphe
 */
export function stripDuplicateLeadingParagraph(blocks, excerpt) {
  if (!excerpt || !Array.isArray(blocks) || blocks.length === 0) return blocks;
  const first = blocks[0];
  if (!first || first.type !== 'paragraph') return blocks;

  const norm = (s) =>
    String(s || '')
      .replace(/<[^>]+>/g, '')
      .normalize('NFC')
      .replace(/[\s ]+/g, ' ')
      .trim()
      .toLowerCase();

  const firstText = norm(nodeText(first));
  const exText = norm(excerpt);

  if (!firstText || !exText) return blocks;
  if (firstText === exText) return blocks.slice(1);

  // Comparaison de préfixe (utile quand un des deux est plus long mais commence pareil)
  const head = (s) => s.slice(0, 80);
  if (firstText.length >= 60 && exText.length >= 60 && head(firstText) === head(exText)) {
    return blocks.slice(1);
  }
  // Un contient l'autre sur ≥ 50 caractères
  if (firstText.length > 50 && exText.includes(firstText.slice(0, 60))) return blocks.slice(1);
  if (exText.length > 50 && firstText.includes(exText.slice(0, 60))) return blocks.slice(1);

  return blocks;
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