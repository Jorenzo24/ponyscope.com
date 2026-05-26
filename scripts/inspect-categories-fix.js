// scripts/inspect-categories-fix.js
//
// LECTURE SEULE. Affiche :
//   1. Toutes les catégories Strapi (id, documentId, slug, name, parent)
//   2. Les articles dont la primaryCategory est "section"
//   3. Les articles dont le slug contient "question" OU dont le canonicalURL
//      contient "/questions/"
//
// Aucune mutation effectuée. Utiliser :
//   node --env-file=.env scripts/inspect-categories-fix.js

const STRAPI_URL =
  process.env.PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://cms.ponyscope.com';
const STRAPI_TOKEN = process.env.STRAPI_ADMIN_TOKEN || process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error("✗ Manque STRAPI_ADMIN_TOKEN dans .env");
  process.exit(1);
}

async function api(path) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} sur ${path}`);
  return res.json();
}

async function listCategories() {
  let page = 1;
  const all = [];
  while (true) {
    const json = await api(
      `/api/categories?populate[parent]=true&pagination[page]=${page}&pagination[pageSize]=100`
    );
    all.push(...(json.data || []));
    const pc = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pc) break;
    page++;
  }
  return all;
}

async function listAllArticles() {
  let page = 1;
  const all = [];
  while (true) {
    const populate =
      'populate[primaryCategory]=true&populate[seo]=true';
    const json = await api(
      `/api/articles?${populate}&pagination[page]=${page}&pagination[pageSize]=100`
    );
    all.push(...(json.data || []));
    const pc = json.meta?.pagination?.pageCount ?? 1;
    if (page >= pc) break;
    page++;
  }
  return all;
}

(async () => {
  console.log(`→ ${STRAPI_URL}\n`);

  console.log("=== Catégories ===");
  const cats = await listCategories();
  for (const c of cats) {
    const parent = c.parent ? ` (parent: ${c.parent.slug})` : '';
    console.log(
      `  [${c.id}] ${c.documentId}  slug="${c.slug}"  name="${c.name}"${parent}`
    );
  }
  console.log(`Total : ${cats.length}\n`);

  const sectionCat = cats.find((c) => c.slug === 'section');
  console.log(
    sectionCat
      ? `→ "section" trouvée : id=${sectionCat.id} documentId=${sectionCat.documentId}`
      : `→ Aucune catégorie de slug "section" (déjà supprimée ?)`
  );
  console.log();

  console.log("=== Articles ===");
  const articles = await listAllArticles();
  console.log(`Total articles : ${articles.length}\n`);

  const inSection = articles.filter(
    (a) => a.primaryCategory?.slug === 'section'
  );
  console.log(`Articles avec primaryCategory = "section" : ${inSection.length}`);
  for (const a of inSection) {
    console.log(
      `  [${a.id}] ${a.documentId}  slug="${a.slug}"  url="${a.seo?.canonicalURL || '(none)'}"`
    );
  }
  console.log();

  const questionArticles = articles.filter((a) => {
    const slug = a.slug || '';
    const url = a.seo?.canonicalURL || '';
    return /questions?/i.test(slug) || /\/questions?\//i.test(url);
  });
  console.log(
    `Articles dont slug ou canonicalURL contient "question(s)" : ${questionArticles.length}`
  );
  for (const a of questionArticles) {
    console.log(
      `  [${a.id}] ${a.documentId}  slug="${a.slug}"  url="${a.seo?.canonicalURL || '(none)'}"  cat="${a.primaryCategory?.slug || '(none)'}"`
    );
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
