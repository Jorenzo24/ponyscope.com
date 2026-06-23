# CLAUDE.md — Mémoire projet Ponyscope

> Fichier lu par Claude Code à chaque session. Contexte, décisions verrouillées
> et règles du projet. À respecter strictement. Mettre à jour quand une décision
> structurante change.

---

## 1. Le projet en une phrase

**Ponyscope** est un média équestre français : relance/rebranding du projet
**Contre-Galop** (ancien site WordPress, ~600 articles, plus gros compte
équestre Instagram FR à son apogée). Objectif : média monétisé et durable
(cible ~10 000 €/mois), modèle éditorial centré UGC (contenus soumis par la
communauté) + couches de monétisation.

- **Nom partout (marque + domaine + repo + dossier)** : `Ponyscope` / `ponyscope.com`
  — **SANS E**. Toujours sans E.
- **Compte GitHub** : `Jorenzo24` — repo : `github.com/Jorenzo24/ponyscope.com`
- **Site en prod** : `https://ponyscope.com` (Cloudflare Pages, SSL Cloudflare)
- **Preview Cloudflare** : `https://ponyscope-com.pages.dev`
- **CMS Strapi** : `https://cms.ponyscope.com` (VPS Hetzner)

---

## 2. Stack technique (décidée — ne pas remettre en cause sans accord explicite)

| Couche | Choix | Statut |
|---|---|---|
| Front | **Astro 6** (HTML statique pré-rendu, SEO maximal, `output: 'static'`) | ✅ en prod |
| CMS / contenu | **Strapi 5** self-hosted sur `cms.ponyscope.com` | ✅ en prod |
| Hébergement front | **Cloudflare Pages** (gratuit, CDN, build auto à chaque push main) | ✅ en prod |
| Hébergement Strapi | **VPS Hetzner** (géré directement par Joseph) | ✅ en prod |
| Auto-rebuild | Webhook Strapi → Cloudflare Deploy Hook (entry.* + media.*) | ✅ en prod |
| Stockage images | **VPS Hetzner** (uploads/ servis par Strapi) | ✅ en prod |

- Le site est monté **from scratch**, PAS WordPress.
- Pendant tout le dev : `noindex,nofollow` partout (le site ne doit pas être
  indexé par Google tant qu'il n'est pas lancé officiellement).
- L'ancien site `contre-galop.com` reste en ligne jusqu'au jour de bascule.
- **SSG pur** : Strapi est appelé UNIQUEMENT au build (~594 pages prégénérées),
  pas au runtime. Aucune requête live vers Strapi côté visiteur.

---

## 3. Décisions verrouillées (NE PAS contredire)

1. **URL identiques à l'ancien site.** Les slugs d'articles doivent être
   EXACTEMENT ceux de contre-galop.com (ex :
   `/blog/ferrer-son-cheval-ou-non-la-bataille-ultime`). Aucune modification de
   slug — c'est critique pour le SEO et éviter 600 redirections individuelles.
   Le jour de bascule : une seule règle de redirection 301 globale de domaine.
2. **noindex partout en dev** (`<meta name="robots" content="noindex, nofollow">`).
3. **Design éditorial premium déjà validé** : hero plein écran photo + titre en
   surimpression, esthétique chic façon Hermès/Figaro Magazine.
4. **Palette (tirée du logo)** :
   - Bleu nuit `--navy: #10142F`
   - Or champagne `--gold: #BF9B66`
   - Ivoire/papier `--paper: #FFFCF6`
5. **Typographies** : Cormorant Garamond (titres serif) + Inter (corps sans-serif).
6. **Ton éditorial** : volontairement familier/punchy à l'origine (« VOUS ETES
   RADINS », etc.). Conservé tel quel pour l'instant ; réécriture pro prévue
   plus tard (ne PAS réécrire le contenu sans consigne).
7. **Markdown = solution temporaire uniquement.** La cible finale du contenu est
   **Strapi** (plusieurs rédacteurs non-devs ont besoin d'une interface
   admin). Ne pas construire de tuyauterie Markdown lourde qui sera jetée.

---

## 4. État actuel du projet (maj 2026-06-23)

✅ Fait et fonctionnel :
- Projet Astro 6 dans `~/Documents/SITES/GIT/ponyscope.com` (iCloud désactivé).
- `.git` connecté à GitHub `Jorenzo24/ponyscope.com` (branche `main`).
- Serveur dev : `npm run dev` → `http://localhost:4321`.
- **Strapi 5** sur `cms.ponyscope.com` (VPS Hetzner), ~585 articles migrés du WP.
- **Cloudflare Pages** connecté au repo : build auto à chaque push `main`
  (~1-2 min). **Dernier build : 594 pages en SSG.**
- **`https://ponyscope.com`** en prod, SSL Cloudflare, custom domain actif.
  Preview : `https://ponyscope-com.pages.dev`.
- **Pipeline Strapi → Astro** : route catch-all `src/pages/[...path].astro`
  qui sert SOIT un article SOIT une page catégorie (selon `kind`), en
  préservant exactement les anciens slugs Contre-Galop.
- **Composants Astro** (dans `src/components/`) :
  - Article : `ArticleHero`, `ArticleBody`, `BlocksRenderer`, `ArticleAuthor`
    (design "frontispice de magazine", navy horizontal), `ArticleRelated`
    (3 articles même catégorie), `ArticleTOC` + `ArticleTOCInline` (sommaire).
  - Catégorie : `CategoryView` + `CategoryCard` (cf. ci-dessous).
  - Commun : `Nav`, `Footer`, `OrnamentDivider`, `AdSlot` (slot pub amorcé).
- **Pages catégorie refondues (juin 2026)** — `CategoryView` + `CategoryCard`,
  partagés par les 8 rubriques (blog, tops, actu-cheval, tutos, guides-cheval,
  guides-galops, metiers, ethologie). Modifier ces 2 composants = modifier
  TOUTES les pages catégorie d'un coup. Détail :
  - **Hero photo plein cadre, traitement CHAUD** : cover de l'article phare en
    fond (léger flou + sépia + voile espresso, PAS bleu froid), overline
    « Le magazine », titre monumental `clamp(58→124px)`, « N articles · depuis
    20XX » (année calculée auto), et **barre de recherche stylisée DANS le hero**
    (pilule verre dépoli, focus or). Image fixe par rubrique possible via la map
    `HERO_IMAGES` (déposer dans `public/heroes/`, fallback = cover phare).
    ⏳ Joseph doit fournir les images fixes.
  - **"La Une"** sous le hero : l'article phare en grand format paysage.
  - **Grille 4 colonnes** (paliers 4→3→2→1) sur fond crème, **carte "feature"
    2×2** qui casse la grille (1 par page, via classe `card--feature` posée en
    JS ; `grid-auto-flow: dense` pour combler ; désactivée si < 8 cartes).
  - **Filtre texte + tri** (Récent/Ancien/A–Z) + **compteur de résultats** +
    **pagination** (pastilles rondes or). Tout **100% client** (JS dans le
    `<script>` de `CategoryView`), sur les cartes rendues au build → SSG pur.
    **13 cartes/page** (1 feature = 4 cellules + 12 = 16 = 4 rangées pleines).
  - Animations d'apparition (fade + montée en cascade, `prefers-reduced-motion`).
  - ⚠️ **Piège Astro rencontré** : les éléments créés en JS (boutons de
    pagination) n'ont PAS l'attribut de scope `data-astro-cid-*`, donc le CSS
    scopé ne s'y applique pas. Solution : sélecteurs `.parent :global(button)`.
  - Chapô éditorial par rubrique : map `CATEGORY_INTROS` (clé = slug Strapi).
  - Modèle de données : en flat, tous les articles d'une page partagent leur
    `primaryCategory` → un filtre par sous-catégorie n'aurait rien à filtrer ;
    d'où le choix filtre-texte + tri. Liens vers catégories sœurs dans `cat-subs`.
- **Page d'accueil v1** : `src/pages/index.astro` n'est plus l'ancien template
  (hero éditorial + grille des 12 derniers, via `CategoryCard`). v1, à revoir.
- Design system : navy/gold/paper + Cormorant Garamond + Inter.
- **Direction "chaleur" (décidée juin 2026)** : le site paraissait froid (navy
  dominant). Choix validé = **réchauffer SANS nouvelle couleur** (palette
  verrouillée respectée) : crème dominant, navy réduit aux touches, fini le
  blanc pur (bordures de cartes crème), ombres chaudes (brun léger, pas
  gris-navy), images revivifiées (saturate ↑ au lieu de désaturées), cartes en
  4:3. Pistes refusées : ajouter un brun cuir/châtaigne ; accent oxblood/ocre.
- `noindex,nofollow` actif PARTOUT (forcé `true` dans `BaseLayout.astro` et
  `[...path].astro`) — normal tant que non lancé.

🐛 Bugs connus / à vérifier (non bloquants) :
- `<title>` de l'onglet : afficherait encore « Contre Galop » sur certaines
  pages — à reverifier (peut venir de la source Strapi).
- **13/14 avatars d'auteurs manquants** dans Strapi (seul Joseph Lambert
  uploadé). Fallback initiales (cercle bordé or) élégant pour l'instant.
- `/blog` est un fourre-tout (~373 articles → 373 cartes dans le HTML de la
  page catégorie). Ça marche (lazy-load + pagination) mais c'est lourd ;
  à traiter à part un jour.

✅ Déjà réglé (historique) :
- Chapô dupliqué : corrigé via `extractLedeFromBlocks()` (le chapô = 1er
  paragraphe du contenu, retiré du flow pour ne pas s'afficher 2×).
- "Catégorie test" : devenue la **catégorie cachée** officielle —
  `HIDDEN_CATEGORY_SLUG` dans `strapi.js`. Ses articles existent mais ne sont
  jamais exposés (ni page catégorie, ni breadcrumb, ni listing), forcés noindex.

ℹ️ Notes data :
- Covers migrées du WP en résolution moyenne (~760px) — cover mise dans le
  flow (taille native) plutôt qu'en hero étiré. Ré-extraction possible plus tard.

🔜 Reste à faire (ordre proposé) :
1. **Phase 2 recherche** : intégrer **Pagefind** (index build-time, zéro
   backend) pour une recherche GLOBALE, UI overlay déclenchée depuis la Nav.
   ⚠️ Ajoute une dépendance + modifie `astro.config.mjs`, et ne marche
   qu'après `npm run build` (PAS en `npm run dev`).
2. Reverifier/fixer le `<title>` « Contre Galop ».
3. Composant Newsletter (bloc navy plein écran en fin d'article).
4. Page d'accueil finale (l'actuelle est une v1 assumée).
5. **Quand prêt (go-live)** : enlever le `noindex` global, passer à
   `index, follow` selon le champ `metaRobots` de Strapi → bascule officielle
   + 301 globale `contre-galop.com` → `ponyscope.com`.

ℹ️ **Migration WP→Strapi complète** : 585 articles WP = 585 articles
Strapi, 0 manquant (vérifié par comparaison des slugs). L'API publique du
vieux WP est encore accessible à `https://contre-galop.com/wp-json/wp/v2/`
si besoin de refaire des extractions.

---

## 5. Règles strictes pour Claude Code

- ❌ **Ne JAMAIS** réindexer le site (garder noindex partout tant que non lancé).
- ❌ **Ne JAMAIS** modifier/supprimer le dossier `.git` ni changer le remote.
- ❌ **Ne JAMAIS** changer les slugs / chemins d'URL des articles.
- ✅ **Emplacement du projet** : `~/Documents/SITES/GIT/ponyscope.com`
  (iCloud désactivé sur la machine — juin 2026). C'est le SEUL dossier
  valide, c'est ici que le `.git` est actif. (Ancien emplacement
  `~/Sites/ponyscope.com` : obsolète.)
- ❌ Ne pas réécrire le contenu éditorial sans consigne explicite.
- ❌ Ne pas réintroduire de contenu inventé dans la maquette (stats bidon,
  fausses citations, fausses sources — déjà nettoyé volontairement).
- ✅ Toujours préférer une solution simple et non jetable.
- ✅ Tester réellement (lancer le serveur, vérifier le rendu) avant d'affirmer
  que ça marche.
- ✅ Avant un gros changement : expliquer le plan, attendre validation.
- ✅ Commits Git réguliers avec messages clairs (en français).
- ✅ **Workflow de déploiement** : 2 chemins, tous deux automatiques :
  1. `git push origin main` → build Cloudflare Pages (~1-2 min) → prod.
  2. **Tout save dans Strapi** (entry.* ou media.*) → webhook configuré qui
     appelle un Cloudflare Deploy Hook → rebuild automatique. Aucune action
     manuelle requise quand un rédacteur publie/modifie un article.
  → Donc plus jamais besoin de toucher au dashboard Cloudflare en usage
  courant. Pour tester en local avant push : `npm run dev` ou
  `npm run build && npm run preview`.
- ⚠️ **Browser pour Cloudflare** : Brave bloque silencieusement certaines
  étapes OAuth de Cloudflare (Shields/cookies tiers). Utiliser Safari ou
  Chrome pour toute interaction avec le dashboard Cloudflare.
- 🔒 **Deploy Hook URL** : c'est un secret. Ne JAMAIS la coller en clair
  dans un chat, un commit, un fichier versionné. En cas d'exposition,
  rotater immédiatement (Cloudflare → Settings → Deploy Hooks → delete +
  recreate, puis maj de l'URL dans Strapi → Settings → Webhooks).

---

## 6. Workflow de collaboration

- **Réflexion / architecture / décisions** : se font dans l'app Claude (chat)
  avec Joseph. Claude (chat) prépare des prompts précis.
- **Exécution technique** : Claude Code (cet environnement), qui a accès au
  système, installe, teste, debugge en live.
- **Joseph fait tout en solo** : backend (Strapi self-hosted Hetzner),
  migration WP→Strapi, infra, front Astro. Pas de dev externe.
- Joseph est compétent côté backend / infra, **débute sur Astro** :
  expliquer les particularités Astro (SSG, getStaticPaths, slots) quand
  on en croise. Sur le reste (Node, Strapi, Linux, Git, DNS), on peut
  parler dense.
- Pour les longues opérations UI, aller pas à pas avec validation
  intermédiaire ; sur les fixes ciblés, on peut pousser direct en prod
  (push to main → auto-deploy).

---

## 7. Structure du projet (Astro)

```
~/Documents/SITES/GIT/ponyscope.com/
├── CLAUDE.md                ← ce fichier
├── astro.config.mjs         ← config (site: https://ponyscope.com, output: static)
├── package.json
├── .env                     ← PUBLIC_STRAPI_URL=https://cms.ponyscope.com
├── public/                  ← fichiers statiques (favicon, robots.txt…)
├── src/
│   ├── pages/
│   │   ├── index.astro      ← accueil (encore l'ancien template, à refaire)
│   │   └── [...path].astro  ← route catch-all : génère TOUTES les pages
│   │                          d'articles depuis les slugs Strapi
│   ├── layouts/
│   │   └── BaseLayout.astro ← design system (navy/gold/paper, Cormorant +
│   │                          Inter, noindex,nofollow par défaut)
│   ├── components/
│   │   ├── Nav.astro         ← nav sticky avec logo Ponyscope
│   │   ├── Footer.astro      ← footer navy 4 colonnes
│   │   ├── ArticleHero.astro ← hero 100vh image Strapi + titre surimpression
│   │   ├── ArticleBody.astro ← wrap article avec drop cap + h2 stylisés
│   │   └── BlocksRenderer.astro ← rendu des blocks Strapi (paragraphes,
│   │                              headings, listes, images, etc.)
│   └── lib/
│       └── strapi.js         ← fonctions de fetch Strapi (à étendre :
│                                getRelatedArticles, getByCategory, etc.)
├── .maquette-reference/      ← code maquette d'origine (gitignored).
│   └── article-original.astro   Contient notamment le JS TOC sticky-deferred
│                                à porter en composant propre.
└── .git/                     ← NE PAS TOUCHER
```

Rappel Astro : l'arborescence de `src/pages/` = l'arborescence des URL.
La route `[...path].astro` est une **catch-all** : elle attrape n'importe
quel chemin et le résout depuis Strapi via `getStaticPaths()`. C'est ce
qui permet de reproduire EXACTEMENT les anciens slugs Contre-Galop
(ex : `/blog/ferrer-son-cheval-ou-non-la-bataille-ultime`).

---

## 8. Migration WordPress → Strapi (déjà faite, ~580/600)

- Migration effectuée par le dev de Joseph via script (API REST WordPress
  → transformation → import API Strapi).
- ~580 articles ont été migrés avec succès, **slugs exacts préservés**.
- ~20 articles non migrés : bug `metaRobots` probable dans le script → à
  investiguer puis rejouer la migration sur les manquants.
- Images : ré-uploadées sur Strapi (servies depuis `cms.ponyscope.com/uploads/`).
- À vérifier ultérieurement : qualité des images source (apparaissent
  pixelisées en prod, soit compression Strapi soit source basse résolution).
