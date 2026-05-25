#!/usr/bin/env node
/**
 * scripts/fix-brand-replace.js
 *
 * One-off : remplace "Contre Galop" → "Ponyscope" dans les articles Strapi
 * (champs title, excerpt, seo.metaTitle).
 *
 * IMPORTANT : la regex est CASE-SENSITIVE et matche exactement "Contre Galop"
 * (C et G capitalisés). Ça préserve volontairement les occurrences en minuscule
 * "contre galop", qui désignent l'allure équestre, pas la marque.
 *
 * Usage :
 *   STRAPI_TOKEN=xxx node scripts/fix-brand-replace.js            # dry-run (par défaut, ne modifie rien)
 *   STRAPI_TOKEN=xxx node scripts/fix-brand-replace.js --apply    # exécute pour de vrai
 *
 * Le token doit être créé dans Strapi admin :
 *   Settings → API Tokens → Create new API token
 *     Name        : fix-brand-replace
 *     Token type  : Full access
 *     Duration    : 1 day  (à supprimer après usage)
 *
 * Le script ne lit/écrit JAMAIS le token sur disque. Il vient uniquement de
 * la var d'env STRAPI_TOKEN passée au moment du run.
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://cms.ponyscope.com';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const APPLY = process.argv.includes('--apply');

const FROM_REGEX = /Contre Galop/g;
const TO = 'Ponyscope';

if (!STRAPI_TOKEN) {
  console.error('✗ Manque la variable d\'env STRAPI_TOKEN.');
  console.error('  Génère un token Strapi admin → Settings → API Tokens (Full access, 1 day).');
  console.error('  Puis :  STRAPI_TOKEN=xxx node scripts/fix-brand-replace.js');
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

async function fetchAllArticles() {
  const all = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const data = await api(
      '/api/articles?' +
        'fields[0]=title&fields[1]=excerpt&fields[2]=slug&' +
        'populate[seo][fields][0]=metaTitle&' +
        `pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );
    all.push(...(data.data || []));
    const pageCount = data.meta?.pagination?.pageCount ?? 1;
    if (page >= pageCount) break;
    page++;
  }
  return all;
}

function detectChanges(article) {
  const changes = {};

  if (article.title && FROM_REGEX.test(article.title)) {
    changes.title = article.title.replace(FROM_REGEX, TO);
  }
  if (article.excerpt && FROM_REGEX.test(article.excerpt)) {
    changes.excerpt = article.excerpt.replace(FROM_REGEX, TO);
  }
  const meta = article.seo?.metaTitle;
  if (meta && FROM_REGEX.test(meta)) {
    // Update partiel d'un component Strapi : on passe id + nouvelle valeur
    changes.seo = {
      id: article.seo.id,
      metaTitle: meta.replace(FROM_REGEX, TO),
    };
  }

  return Object.keys(changes).length > 0 ? changes : null;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Replace "Contre Galop" → "${TO}"`);
  console.log(`  Mode : ${APPLY ? '✱ APPLY (écriture réelle)' : '🔍 DRY-RUN (lecture seule)'}`);
  console.log(`  Strapi : ${STRAPI_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('Chargement de tous les articles…');
  const articles = await fetchAllArticles();
  console.log(`→ ${articles.length} articles récupérés.\n`);

  const planned = articles
    .map((a) => ({ article: a, changes: detectChanges(a) }))
    .filter((x) => x.changes);

  console.log(`→ ${planned.length} articles avec au moins un champ à modifier.\n`);
  if (planned.length === 0) {
    console.log('Rien à faire.');
    return;
  }

  // Aperçu des 10 premiers
  console.log('Aperçu des 10 premiers articles concernés :');
  for (const { article, changes } of planned.slice(0, 10)) {
    console.log(`\n  • ${article.slug}`);
    for (const [k, v] of Object.entries(changes)) {
      const preview = typeof v === 'string' ? v : JSON.stringify(v);
      console.log(`      ${k}: ${preview.slice(0, 120)}`);
    }
  }
  if (planned.length > 10) {
    console.log(`\n  … et ${planned.length - 10} autres.`);
  }

  if (!APPLY) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DRY-RUN terminé. Aucune modification écrite.');
    console.log('Pour appliquer pour de vrai :');
    console.log('  STRAPI_TOKEN=xxx node scripts/fix-brand-replace.js --apply');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  console.log('\n🚀 Application en cours…');
  let done = 0;
  let failed = 0;
  for (const { article, changes } of planned) {
    try {
      await api(`/api/articles/${article.documentId}`, {
        method: 'PUT',
        body: JSON.stringify({ data: changes }),
      });
      done++;
      if (done % 25 === 0) {
        console.log(`  … ${done}/${planned.length}`);
      }
    } catch (e) {
      failed++;
      console.error(`  ✗ ${article.slug} : ${e.message}`);
    }
  }

  console.log(`\n✅ Terminé. ${done} updates OK, ${failed} échecs.`);
  console.log('\n⚠️  N\'oublie pas de SUPPRIMER le token Strapi maintenant :');
  console.log('   Strapi admin → Settings → API Tokens → fix-brand-replace → Delete');
}

main().catch((e) => {
  console.error('\n✗ Erreur fatale :', e.message);
  process.exit(1);
});
