// src/lib/signImages.js
// Mappe le slug d'un signe → son illustration (ImageMetadata) pour qu'Astro
// l'optimise au build (resize + webp) via le composant <Image> d'astro:assets.
//
// Les PNG sources vivent dans src/assets/signs/<slug>.png. On les charge en
// eager (au build) avec import.meta.glob ; chaque entrée est l'ImageMetadata
// directement utilisable comme `src` d'<Image>.

const imgs = import.meta.glob('../assets/signs/*.png', { eager: true, import: 'default' });

/**
 * Renvoie l'ImageMetadata du signe, ou null si absent.
 * @param {string} slug  ex: 'belier'
 */
export function signImage(slug) {
  const entry = Object.entries(imgs).find(([path]) => path.endsWith(`/${slug}.png`));
  return entry ? entry[1] : null;
}
