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
 * Usage (utilise le token persistant dans .env, gitignored) :
 *   node --env-file=.env scripts/fix-brand-replace.js            # dry-run
 *   node --env-file=.env scripts/fix-brand-replace.js --apply    # exécute
 *
 * Le `.env` à la racine doit contenir :
 *   STRAPI_ADMIN_TOKEN=...   (token Strapi Full access, créé dans l'admin)
 */

const STRAPI_URL =
  process.env.PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://cms.ponyscope.com';
const STRAPI_TOKEN = process.env.STRAPI_ADMIN_TOKEN || process.env.STRAPI_TOKEN;
const APPLY = process.argv.includes('--apply');

const FROM_REGEX = /Contre Galop/g;
const TO = 'Ponyscope';

if (!STRAPI_TOKEN) {
  console.error('✗ Manque la variable d\'env STRAPI_ADMIN_TOKEN.');
  console.error('  Ajoute-la dans .env à la racine du projet, puis :');
  console.error('  node --env-file=.env scripts/fix-brand-replace.js');
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
    // On populate TOUT le seo (avec metaImage en id seulement) pour pouvoir
    // le ré-envoyer en entier au PUT sans perdre les autres champs.
    const data = await api(
      '/api/articles?' +
        'fields[0]=title&fields[1]=excerpt&fields[2]=slug&' +
        'populate[seo][populate][metaImage][fields][0]=id&' +
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
  const seo = article.seo;
  if (seo?.metaTitle && FROM_REGEX.test(seo.metaTitle)) {
    // Strapi 5 : pour update un component, on envoie l'objet COMPLET sans son id
    // (l'id des components diffère entre draft et published, donc le passer
    // provoque "Some of the provided components in seo are not related to the
    // entity"). Strapi remplace alors le component existant par notre objet.
    // Pour metaImage (relation media), on n'envoie que l'id (sinon Strapi
    // rejette le payload).
    changes.seo = {
      metaTitle: seo.metaTitle.replace(FROM_REGEX, TO),
      metaDescription: seo.metaDescription ?? undefined,
      metaRobots: seo.metaRobots ?? undefined,
      canonicalURL: seo.canonicalURL ?? undefined,
      metaImage: seo.metaImage?.id ?? null,
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
  console.log('\nLe token reste dans .env pour les futurs scripts.');
  console.log('À supprimer manuellement dans Strapi admin si tu veux le révoquer.');
}

main().catch((e) => {
  console.error('\n✗ Erreur fatale :', e.message);
  process.exit(1);
});
