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
| Hébergement Strapi | **VPS Hetzner** (géré par le dev de Joseph) | ✅ en prod |
| Stockage images | **VPS Hetzner** (uploads/ servis par Strapi) | ✅ en prod |

- Le site est monté **from scratch**, PAS WordPress.
- Pendant tout le dev : `noindex,nofollow` partout (le site ne doit pas être
  indexé par Google tant qu'il n'est pas lancé officiellement).
- L'ancien site `contre-galop.com` reste en ligne jusqu'au jour de bascule.
- **SSG pur** : Strapi est appelé UNIQUEMENT au build (565 pages prégénérées),
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

## 4. État actuel du projet (au dernier point)

✅ Fait et fonctionnel :
- Projet Astro 6 dans `~/Sites/ponyscope.com` (hors iCloud).
- `.git` connecté à GitHub `Jorenzo24/ponyscope.com` (branche `main`).
- Serveur dev : `npm run dev` → `http://localhost:4321`.
- **Strapi 5** installé et configuré sur `cms.ponyscope.com` (VPS Hetzner),
  ~580 articles déjà migrés depuis l'ancien WordPress.
- **Cloudflare Pages** connecté au repo GitHub : build auto à chaque push
  sur `main` (~1-2 min), 565 pages générées en SSG.
- **`https://ponyscope.com`** en prod avec SSL Cloudflare (custom domain
  actif). Preview URL : `https://ponyscope-com.pages.dev`.
- **Pipeline Strapi → Astro fonctionnel** : la route catch-all
  `src/pages/[...path].astro` génère toutes les pages d'articles depuis
  les slugs Strapi, en préservant exactement les URLs de l'ancien site.
- **Refactor design en composants Astro propres** : `BaseLayout`, `Nav`,
  `Footer`, `ArticleHero` (hero 100vh image Strapi), `ArticleBody` (drop
  cap, h2 stylisés), `BlocksRenderer` (rendu blocks Strapi).
- Design system appliqué : navy/gold/paper + Cormorant Garamond + Inter.
- `noindex,nofollow` actif partout (`BaseLayout.astro` ligne 31 ; forcé
  à `true` dans `[...path].astro` ligne 69).

🐛 Bugs connus à corriger (non bloquants) :
- Le `<title>` de l'onglet affiche encore « Contre Galop » au lieu de
  « Ponyscope » (à fixer dans `BaseLayout.astro` ou la source Strapi).
- Images Strapi qui apparaissent pixelisées sur le hero (à investiguer :
  qualité source, compression Strapi, ou taille rendue trop grande).
- Chapô dupliqué : l'excerpt Strapi est souvent identique au 1er paragraphe
  du `content`, donc affiché deux fois. À régler dans `BlocksRenderer.astro`
  (skip le 1er paragraphe si identique à l'excerpt).
- ~20 articles non migrés vers Strapi — bug `metaRobots` probable, à
  investiguer côté script de migration.

🔜 Reste à faire (ordre proposé) :
1. Quick wins : fix `<title>` + chapô dupliqué.
2. Composant Newsletter (bloc navy plein écran en fin d'article).
3. TOC sticky-deferred (220px à gauche, JS custom — code dispo dans
   `.maquette-reference/article-original.astro`, à porter en composant Astro).
4. Related articles (3 articles random même catégorie) + fonction
   `getRelatedArticles()` dans `src/lib/strapi.js`.
5. Pages catégorie (`/blog`, `/tops`, `/tutos`, `/guides-galops`, `/metiers`,
   `/ethologie` — actuellement 404).
6. Page d'accueil (`src/pages/index.astro` est encore l'ancien template).
7. Investiguer + récupérer les 20 articles non migrés.
8. **Quand prêt** : enlever le `noindex` global, passer à `index, follow`
   selon le champ `metaRobots` de Strapi → bascule officielle (et 301
   globale de `contre-galop.com` → `ponyscope.com`).

---

## 5. Règles strictes pour Claude Code

- ❌ **Ne JAMAIS** réindexer le site (garder noindex partout tant que non lancé).
- ❌ **Ne JAMAIS** modifier/supprimer le dossier `.git` ni changer le remote.
- ❌ **Ne JAMAIS** changer les slugs / chemins d'URL des articles.
- ❌ **Ne JAMAIS** travailler sur l'ancien dossier iCloud
  (`~/Documents/SITES/GIT/ponyscope.com`). Le SEUL projet valide est
  `~/Sites/ponyscope.com`.
- ❌ Ne pas réécrire le contenu éditorial sans consigne explicite.
- ❌ Ne pas réintroduire de contenu inventé dans la maquette (stats bidon,
  fausses citations, fausses sources — déjà nettoyé volontairement).
- ✅ Toujours préférer une solution simple et non jetable.
- ✅ Tester réellement (lancer le serveur, vérifier le rendu) avant d'affirmer
  que ça marche.
- ✅ Avant un gros changement : expliquer le plan, attendre validation.
- ✅ Commits Git réguliers avec messages clairs (en français).
- ✅ **Workflow de déploiement** : `git push origin main` déclenche un build
  Cloudflare Pages automatique (~1-2 min) puis push en prod sur `ponyscope.com`.
  Pas besoin de toucher au dashboard Cloudflare. Pour tester en local
  avant push : `npm run dev` ou `npm run build && npm run preview`.
- ⚠️ **Browser pour Cloudflare** : Brave bloque silencieusement certaines
  étapes OAuth de Cloudflare (Shields/cookies tiers). Utiliser Safari ou
  Chrome pour toute interaction avec le dashboard Cloudflare.

---

## 6. Workflow de collaboration

- **Réflexion / architecture / décisions** : se font dans l'app Claude (chat)
  avec Joseph. Claude (chat) prépare des prompts précis.
- **Exécution technique** : Claude Code (cet environnement), qui a accès au
  système, installe, teste, debugge en live.
- **Strapi côté serveur** : Joseph + son développeur (en parallèle).
- Joseph débute sur Astro : expliquer les commandes, aller pas à pas, ne pas
  enchaîner plusieurs grosses opérations sans confirmation.

---

## 7. Structure du projet (Astro)

```
~/Sites/ponyscope.com/
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
