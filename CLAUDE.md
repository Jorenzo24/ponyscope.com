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
- ⚠️ **Bug connu à corriger** : la maquette d'article affiche encore
  « PoneyScope » (avec E) dans le logo nav et le footer. C'est une COQUILLE.
  À remplacer par « Ponyscope » partout quand on retravaillera le template.

---

## 2. Stack technique (décidée — ne pas remettre en cause sans accord explicite)

| Couche | Choix | Statut |
|---|---|---|
| Front | **Astro** (HTML statique pré-rendu, SEO maximal) | ✅ installé & fonctionne |
| CMS / contenu | **Strapi** self-hosted | 🔜 à installer (géré par le dev de Joseph) |
| Hébergement front | **Cloudflare Pages** (gratuit, CDN, déploiement Git auto) | 🔜 plus tard |
| Hébergement Strapi | **VPS Hetzner** existant | 🔜 plus tard |
| Stockage images | VPS Hetzner ou Cloudflare R2 (10 Go gratuits) | 🔜 à décider |

- Le site est monté **from scratch**, PAS WordPress.
- Pendant tout le dev : `noindex` partout (le site ne doit pas être indexé par
  Google tant qu'il n'est pas lancé officiellement).
- L'ancien site `contre-galop.com` reste en ligne jusqu'au jour de bascule.

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
- Projet Astro installé dans `~/Sites/ponyscope.com` (hors iCloud, propre).
- `.git` connecté à GitHub `Jorenzo24/ponyscope.com` (branche `main`).
- Serveur dev OK : `npm run dev` → `http://localhost:4321`.
- Maquette d'article affichée et validée visuellement à l'URL
  `/blog/ferrer-son-cheval-ou-non-la-bataille-ultime`.
- Le fichier article est actuellement **un `.astro` unique** (design + contenu
  mélangés) : `src/pages/blog/ferrer-son-cheval-ou-non-la-bataille-ultime.astro`.
  C'est une **preuve visuelle temporaire**, pas l'architecture finale.

🔜 Reste à faire (ordre logique) :
1. Améliorer / corriger le template article (manques + bug « PoneyScope »).
2. Créer les autres templates (homepage, pages catégorie : Blog, Tops, Tutos,
   Guides Galops, Métiers, Éthologie ; page auteur).
3. Installer & configurer Strapi (dev de Joseph) — noter le schéma de contenu.
4. Connecter Astro ↔ Strapi, tester sur 5-10 articles.
5. Migrer les ~600 articles WordPress → Strapi (script, gratuit).
6. Tests complets puis bascule (301 globale, retrait noindex).

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
├── astro.config.mjs         ← config (penser à `site:` = https://ponyscope.com)
├── package.json
├── public/                  ← fichiers statiques (favicon, robots.txt…)
├── src/
│   ├── pages/               ← chaque .astro = une URL
│   │   ├── index.astro      ← accueil (temporaire pour l'instant)
│   │   └── blog/
│   │       └── ferrer-son-cheval-ou-non-la-bataille-ultime.astro
│   ├── layouts/             ← (à créer) gabarits réutilisables
│   └── components/          ← (à créer) Nav, Hero, Footer, TOC, etc.
└── .git/                    ← NE PAS TOUCHER
```

Rappel Astro : l'arborescence de `src/pages/` = l'arborescence des URL.
Le nom du fichier (sans `.astro`) = le slug de l'URL.

---

## 8. Migration WordPress → Strapi (à anticiper, pas encore fait)

- Source : ancien WordPress Contre-Galop (état exact à confirmer avec Joseph).
- Méthode privilégiée : API REST WordPress (`/wp-json/wp/v2/posts`) → script de
  transformation → import via API Strapi. 100 % gratuit, scriptable.
- Images : à télécharger du serveur WP puis ré-uploader dans Strapi (script).
- **Préserver les slugs exacts** (SEO).
- Récupérer aussi les métadonnées SEO (si Yoast/RankMath utilisé — à confirmer).
- Toujours tester sur 5-10 articles avant de lancer les 600.
