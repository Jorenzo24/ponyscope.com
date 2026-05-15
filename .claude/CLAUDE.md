# CLAUDE.md — Ponyscope

## Contexte du projet

- **Domaine** : ponyscope.com
- **Hébergement** : VPS Hetzner avec cPanel
- **Username cPanel** : `ponyscope`
- **Deploy path** : `/home/ponyscope/public_html/`
- **Déploiement** : Git Version Control de cPanel via `.cpanel.yml` (push sur `main` → déploiement auto)

## Stack technique

- HTML5 / CSS3 / JavaScript vanilla (pas de framework, pas de build)
- Pas de Node, pas de npm en prod (le `node_modules/` est gitignoré au cas où)

## Conventions de développement

### CSS / HTML
- **Mobile-first** : écrire le CSS pour mobile d'abord, puis ajouter des media queries pour les écrans plus larges
- **Chemins relatifs uniquement** pour toutes les ressources locales (`css/style.css`, pas `/css/style.css`). Sinon ça casse en `file://` ou si déployé dans un sous-dossier.
- **Images** :
  - Format WebP de préférence (fallback JPG/PNG si nécessaire)
  - SVG inline pour les icônes (pas de fichier séparé sauf si réutilisé partout)
  - Jamais de hotlink — toujours héberger les images sur le domaine
  - Attribut `alt` obligatoire sur toutes les `<img>` (vide `alt=""` si purement décorative)
  - `loading="lazy"` sur les images sous la ligne de flottaison

### Cache-busting
À cause du cache navigateur 1 mois défini dans `.htaccess` pour CSS/JS, **toute modification** de `css/style.css` ou `js/main.js` doit s'accompagner d'un bump du query string `?v=AAAAMMJJx` dans **toutes les pages** qui les référencent (à minima `index.html`).

Format : `?v=` + date du jour `AAAAMMJJ` + lettre incrémentale (`a`, `b`, `c`...) pour plusieurs modifs le même jour.

Exemple :
```html
<link rel="stylesheet" href="css/style.css?v=20260515a">
<script src="js/main.js?v=20260515a"></script>
```

Sans ce bump, les visiteurs récurrents servent du CSS/JS périmé pendant 1 mois.

### SEO
- `<title>` unique et descriptif sur chaque page (50-60 caractères)
- `<meta name="description">` unique (150-160 caractères)
- Balises Open Graph complètes (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale`)
- Schema.org en JSON-LD quand pertinent (Organisation, LocalBusiness, Product, Article...)
- `sitemap.xml` mis à jour à chaque nouvelle page
- `robots.txt` autorise tout et pointe vers le sitemap

## Git

- `main` = branche de production (déploiement auto via cPanel Git Version Control)
- Branches `feature/...` pour le développement
- **Jamais de push direct sur `main`** — passer par une PR ou un merge local après tests
- Commits en français, présent de l'indicatif (« ajoute la page X », « corrige le footer »)

## Workflow de déploiement

1. Faire les modifs sur une branche feature
2. Tester en local (ouvrir `index.html` ou via un serveur statique)
3. Bumper le cache-busting si CSS/JS modifié
4. Mettre à jour `sitemap.xml` si nouvelle page
5. Merger sur `main`
6. Push sur GitHub
7. cPanel Git Version Control déclenche le déploiement via `.cpanel.yml`
