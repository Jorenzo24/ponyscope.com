// scripts/inspect-categories-routing.js
// Diagnostic : pourquoi /guides-galops affiche des articles qui n'ont rien à voir.
//
// Vérifie :
//   - Le populate ramène-t-il bien primaryCategory.parent ?
//   - Quels articles ont leur primaryCategory.slug = "guides-galops" ?
//   - Et quel parent ont-ils réellement ?

const STRAPI_URL =
  process.env.PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'https://cms.ponyscope.com';
const STRAPI_TOKEN = process.env.STRAPI_ADMIN_TOKEN || process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('✗ Manque STRAPI_ADMIN_TOKEN');
  process.exit(1);
}

async function api(path) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

(async () => {
  // Récupère un échantillon avec le populate utilisé en prod
  const populate =
    'populate[primaryCategory][populate][parent][populate]=parent';
  const json = await api(
    `/api/articles?${populate}&fields[0]=slug&fields[1]=title&pagination[pageSize]=10`
  );

  console.log('=== Sample d\'articles avec populate primaryCategory.parent ===\n');
  for (const a of json.data) {
    const pc = a.primaryCategory;
    console.log(`• [${a.id}] ${a.slug}`);
    console.log(`   primaryCategory: ${pc ? JSON.stringify({ id: pc.id, slug: pc.slug, name: pc.name }) : 'null'}`);
    if (pc?.parent) {
      console.log(`   parent: ${JSON.stringify({ id: pc.parent.id, slug: pc.parent.slug, name: pc.parent.name })}`);
      if (pc.parent.parent) {
        console.log(`   grand-parent: ${JSON.stringify({ slug: pc.parent.parent.slug })}`);
      }
    } else if (pc) {
      console.log(`   parent: (null ou non peuplé)`);
    }
    console.log();
  }

  // Filter sur primaryCategory = "guides-galops" pour voir
  console.log('=== Articles dont primaryCategory.slug = "guides-galops" ===\n');
  const ggJson = await api(
    `/api/articles?filters[primaryCategory][slug][$eq]=guides-galops&${populate}&fields[0]=slug&fields[1]=title&pagination[pageSize]=100`
  );
  console.log(`Total: ${ggJson.data.length}\n`);
  for (const a of ggJson.data) {
    const pc = a.primaryCategory;
    console.log(`  • ${a.slug}`);
    console.log(`     parent du primaryCategory: ${pc?.parent ? pc.parent.slug : '(null/non peuplé)'}`);
  }

  console.log('\n=== Articles dont primaryCategory.slug = "guides-cheval" (top-level "Guides") ===\n');
  const gcJson = await api(
    `/api/articles?filters[primaryCategory][slug][$eq]=guides-cheval&${populate}&fields[0]=slug&fields[1]=title&pagination[pageSize]=100`
  );
  console.log(`Total: ${gcJson.data.length}\n`);
  for (const a of gcJson.data.slice(0, 10)) {
    console.log(`  • ${a.slug} — "${a.title?.slice(0, 60) || ''}"`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
