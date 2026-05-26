#!/usr/bin/env node
/**
 * scripts/fix-questions-category.js
 *
 * One-off : aplatit la sous-catégorie "questions" dans "blog".
 *   1. Reclasse les 6 articles "questions" → primaryCategory = "blog"
 *   2. Met à jour leur seo.canonicalURL : retire le segment /questions/
 *   3. Supprime la catégorie "questions"
 *
 * Pas de 301 : les anciennes URLs /blog/questions/... vont 404 (acceptable
 * car le site n'est pas encore indexé en prod public).
 *
 * Usage :
 *   node --env-file=.env scripts/fix-questions-category.js          # dry-run
 *   node --env-file=.env scripts/fix-questions-category.js --apply  # exécute
 */

const STRAPI_URL =
  process.env.PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://cms.ponyscope.com';
const STRAPI_TOKEN = process.env.STRAPI_ADMIN_TOKEN || process.env.STRAPI_TOKEN;
const APPLY = process.argv.includes('--apply');

if (!STRAPI_TOKEN) {
  console.error('✗ Manque STRAPI_ADMIN_TOKEN dans .env');
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${STRAPI_TOKEN}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on ${path}\n${body}`);
  }
  return body ? JSON.parse(body) : null;
}

async function findBlogCategory() {
  const json = await api(
    `/api/categories?filters[slug][$eq]=blog&pagination[pageSize]=1`
  );
  return json.data?.[0] || null;
}

async function findQuestionsCategory() {
  const json = await api(
    `/api/categories?filters[slug][$eq]=questions&pagination[pageSize]=1`
  );
  return json.data?.[0] || null;
}

async function fetchQuestionsArticles() {
  const populate =
    'populate[primaryCategory]=true&populate[seo][populate][metaImage][fields][0]=id';
  const json = await api(
    `/api/articles?filters[primaryCategory][slug][$eq]=questions&${populate}&pagination[pageSize]=100`
  );
  return json.data || [];
}

function rewriteURL(oldURL) {
  if (!oldURL) return oldURL;
  // /blog/questions/foo/ → /blog/foo/
  // Conserve le trailing slash, le protocol, le host (tout ce qui n'est pas
  // le segment "questions").
  return oldURL.replace('/blog/questions/', '/blog/');
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Fix : sous-catégorie "questions" → aplatie dans "blog"`);
  console.log(`  Mode : ${APPLY ? '✱ APPLY (écriture réelle)' : '🔍 DRY-RUN'}`);
  console.log(`  Strapi : ${STRAPI_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const blog = await findBlogCategory();
  if (!blog) {
    console.error('✗ Catégorie "blog" introuvable. Abandon.');
    process.exit(1);
  }
  console.log(`Catégorie "blog" trouvée : id=${blog.id} documentId=${blog.documentId}\n`);

  const questions = await findQuestionsCategory();
  if (!questions) {
    console.log('Aucune catégorie "questions" — peut-être déjà supprimée.');
  } else {
    console.log(
      `Catégorie "questions" trouvée : id=${questions.id} documentId=${questions.documentId}\n`
    );
  }

  const articles = await fetchQuestionsArticles();
  console.log(`Articles à reclasser : ${articles.length}\n`);

  if (articles.length === 0 && !questions) {
    console.log('Rien à faire — déjà migré.');
    return;
  }

  // Plan détaillé
  console.log('Plan de migration :');
  for (const a of articles) {
    const newURL = rewriteURL(a.seo?.canonicalURL);
    console.log(`  • ${a.slug}`);
    console.log(`      primaryCategory : questions → blog (${blog.id})`);
    console.log(`      canonicalURL    : ${a.seo?.canonicalURL || '(none)'}`);
    console.log(`                     → ${newURL || '(none)'}`);
  }
  if (questions) {
    console.log(`  • DELETE category "questions" (${questions.documentId})`);
  }
  console.log();

  if (!APPLY) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DRY-RUN terminé. Aucune modification écrite.');
    console.log('Pour appliquer :');
    console.log('  node --env-file=.env scripts/fix-questions-category.js --apply');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  // === APPLY ===
  console.log('🚀 Application en cours…\n');
  let ok = 0;
  let fail = 0;

  for (const a of articles) {
    const newURL = rewriteURL(a.seo?.canonicalURL);
    const seo = a.seo;
    try {
      // Pour update un component Strapi 5 : on envoie l'objet COMPLET sans son
      // id (l'id diffère entre draft et published) avec metaImage en id-only.
      await api(`/api/articles/${a.documentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            primaryCategory: blog.id,
            seo: seo
              ? {
                  metaTitle: seo.metaTitle ?? undefined,
                  metaDescription: seo.metaDescription ?? undefined,
                  metaRobots: seo.metaRobots ?? undefined,
                  canonicalURL: newURL,
                  metaImage: seo.metaImage?.id ?? null,
                }
              : undefined,
          },
        }),
      });
      console.log(`  ✓ ${a.slug}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${a.slug} : ${e.message}`);
      fail++;
    }
  }

  console.log(`\nArticles : ${ok} OK, ${fail} échecs.`);

  if (fail === 0 && questions) {
    console.log(`\nSuppression de la catégorie "questions"…`);
    try {
      await api(`/api/categories/${questions.documentId}`, { method: 'DELETE' });
      console.log(`  ✓ Catégorie "questions" supprimée.`);
    } catch (e) {
      console.error(`  ✗ Échec suppression catégorie : ${e.message}`);
    }
  } else if (fail > 0) {
    console.log(
      `\n⚠ Catégorie "questions" NON supprimée (${fail} articles en échec — corriger d'abord).`
    );
  }

  console.log('\n✅ Terminé.');
}

main().catch((e) => {
  console.error('\n✗ Erreur fatale :', e.message);
  process.exit(1);
});
