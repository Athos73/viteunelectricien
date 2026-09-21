import { metier } from "@/config/metier";
import { absolu } from "@/lib/site";

/**
 * Blog : WordPress sert de CMS « headless ».
 *
 * Les articles sont rédigés dans l'administration WordPress - à la main ou
 * poussés par Wisewand via son intégration WordPress native - puis lus ici par
 * l'API REST et rendus sous viteunelectricien.fr/blog. Le WordPress lui-même
 * n'est pas destiné au public : son front redirige vers le site (voir
 * `docs/wordpress/viteunelectricien-headless.php`).
 *
 * Sans `WORDPRESS_URL`, le blog est simplement vide : le build ne doit pas
 * échouer tant que le CMS n'est pas en place.
 */

const WP = process.env.WORDPRESS_URL?.replace(/\/+$/, "");

/** Étiquette de cache commune à toutes les lectures WordPress. */
export const TAG_BLOG = "blog";

/**
 * Filet de sécurité : le webhook de publication invalide le cache
 * immédiatement, mais si un appel se perd, une heure suffit à rattraper.
 */
const REVALIDATION = 3600;

export const PAR_PAGE = 12;

export const urlBlog = (n = 1) => (n <= 1 ? "/blog" : `/blog/page/${n}`);
export const urlArticle = (slug: string) => `/blog/${slug}`;
export const urlCategorie = (slug: string, n = 1) =>
  n <= 1 ? `/blog/categorie/${slug}` : `/blog/categorie/${slug}/page/${n}`;

export const TITRE_BLOG = `Le blog de l'${metier.labelSingulier}`;
export const INTRO_BLOG =
  "Normes, dépannage, rénovation, prix des travaux : nos guides pour préparer votre projet électrique et bien choisir votre artisan.";
export const introCategorie = (nom: string) =>
  `Tous nos articles « ${nom} » pour préparer vos travaux d'électricité.`;

export type Visuel = {
  url: string;
  alt: string;
  largeur?: number;
  hauteur?: number;
};

export type Categorie = { id: number; nom: string; slug: string };

export type ResumeArticle = {
  id: number;
  slug: string;
  titre: string;
  extrait: string;
  publie: string;
  modifie: string;
  image: Visuel | null;
  categories: Categorie[];
};

export type Article = ResumeArticle & {
  contenu: string;
  seo: {
    titre: string | null;
    description: string | null;
  };
};

/* ---------- Forme brute renvoyée par /wp-json/wp/v2 ---------- */

type WpRendu = { rendered: string };
type WpMedia = {
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
};
type WpTerme = { id: number; name: string; slug: string; taxonomy: string };
type WpPost = {
  id: number;
  slug: string;
  date_gmt: string;
  modified_gmt: string;
  title: WpRendu;
  excerpt: WpRendu;
  content: WpRendu;
  // Présent quand Yoast SEO est installé : Wisewand y dépose titre et méta.
  yoast_head_json?: {
    title?: string;
    description?: string;
  };
  _embedded?: {
    "wp:featuredmedia"?: WpMedia[];
    "wp:term"?: WpTerme[][];
  };
};
type WpCategorie = { id: number; name: string; slug: string; count: number };

/* ---------- Transport ---------- */

type Page<T> = { items: T[]; total: number; pages: number };

async function wp<T>(
  chemin: string,
  params: Record<string, string | number> = {},
): Promise<Page<T>> {
  if (!WP) return { items: [], total: 0, pages: 0 };

  const url = new URL(`${WP}/wp-json/wp/v2/${chemin}`);
  for (const [cle, valeur] of Object.entries(params))
    url.searchParams.set(cle, String(valeur));

  let reponse: Response;
  try {
    reponse = await fetch(url, {
      next: { revalidate: REVALIDATION, tags: [TAG_BLOG] },
      headers: { Accept: "application/json" },
    });
  } catch (erreur) {
    // Au build, un CMS injoignable ne doit pas bloquer le déploiement de tout
    // l'annuaire : le blog part vide et se remplit à la revalidation suivante.
    // À l'exécution on laisse l'erreur remonter - Next garde alors la dernière
    // version en cache au lieu de la remplacer par une page vide.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[blog] WordPress injoignable au build : ${erreur}`);
      return { items: [], total: 0, pages: 0 };
    }
    throw erreur;
  }
  // WordPress répond 400 à une page au-delà de la dernière : c'est un 404
  // pour nous, pas une panne.
  if (reponse.status === 400) return { items: [], total: 0, pages: 0 };
  if (!reponse.ok)
    throw new Error(`WordPress ${reponse.status} sur ${url.pathname}`);

  return {
    items: (await reponse.json()) as T[],
    total: Number(reponse.headers.get("x-wp-total") ?? 0),
    pages: Number(reponse.headers.get("x-wp-totalpages") ?? 0),
  };
}

/* ---------- Normalisation ---------- */

const ENTITES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  ndash: "–",
  mdash: "-",
  laquo: "«",
  raquo: "»",
};

/**
 * Le site n'écrit jamais de tiret cadratin : ceux que Wisewand ou l'éditeur
 * glissent dans un article - caractère, entité nommée ou numérique - deviennent
 * un tiret commun.
 */
const sansCadratin = (texte: string) =>
  texte.replace(/\u2014|&mdash;|&#8212;|&#x2014;/gi, "-");

/** Texte brut depuis le HTML des titres et extraits WordPress. */
export function texteBrut(html: string): string {
  return sansCadratin(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, nom) => ENTITES[nom.toLowerCase()] ?? m)
    .replace(/\s*\[(?:…|&hellip;|\.\.\.)\]\s*$/, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function visuel(media: WpMedia | undefined): Visuel | null {
  if (!media?.source_url) return null;
  // La taille « large » (1024 px) suffit en vignette comme en tête d'article ;
  // l'original peut peser plusieurs mégaoctets.
  const large = media.media_details?.sizes?.large;
  return {
    url: large?.source_url ?? media.source_url,
    alt: media.alt_text ?? "",
    largeur: large?.width ?? media.media_details?.width,
    hauteur: large?.height ?? media.media_details?.height,
  };
}

function resume(p: WpPost): ResumeArticle {
  const termes = p._embedded?.["wp:term"]?.flat() ?? [];
  return {
    id: p.id,
    slug: p.slug,
    titre: texteBrut(p.title.rendered),
    extrait: texteBrut(p.excerpt.rendered),
    publie: `${p.date_gmt}Z`,
    modifie: `${p.modified_gmt}Z`,
    image: visuel(p._embedded?.["wp:featuredmedia"]?.[0]),
    categories: termes
      .filter((t) => t.taxonomy === "category" && t.slug !== "non-classe" && t.slug !== "uncategorized")
      .map((t) => ({ id: t.id, nom: texteBrut(t.name), slug: t.slug })),
  };
}

/**
 * Les liens internes que Wisewand ou l'éditeur posent pointent vers le domaine
 * du CMS : on les ramène sur le site public, sans quoi chaque maillage interne
 * enverrait le lecteur - et Google - sur le WordPress.
 */
function reecritLiens(html: string): string {
  if (!WP) return html;
  const hote = WP.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`href="${hote}/(?!wp-content/)([^"#?]*)`, "g"),
    (_, chemin: string) => {
      const segments = chemin.split("/").filter(Boolean);
      if (segments.length === 0) return `href="${absolu("/blog")}`;
      if (segments[0] === "category" && segments[1])
        return `href="${absolu(urlCategorie(segments.at(-1)!))}`;
      return `href="${absolu(urlArticle(segments.at(-1)!))}`;
    },
  );
}

/**
 * Le contenu vient de notre propre CMS, mais on retire tout de même ce qui
 * exécuterait du code sur le site public : une extension WordPress ou un
 * copier-coller malheureux ne doit pas pouvoir y injecter de script.
 */
function assainit(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

/* ---------- Lectures ---------- */

const CHAMPS_LISTE =
  "id,slug,date_gmt,modified_gmt,title,excerpt,_links,_embedded";

export async function articles(
  n = 1,
  categorie?: number,
): Promise<{ articles: ResumeArticle[]; pages: number; total: number }> {
  const { items, pages, total } = await wp<WpPost>("posts", {
    page: n,
    per_page: PAR_PAGE,
    _embed: "wp:featuredmedia,wp:term",
    _fields: CHAMPS_LISTE,
    ...(categorie ? { categories: categorie } : {}),
  });
  return { articles: items.map(resume), pages, total };
}

export async function article(slug: string): Promise<Article | null> {
  const { items } = await wp<WpPost>("posts", {
    slug,
    _embed: "wp:featuredmedia,wp:term",
  });
  const p = items[0];
  if (!p) return null;
  return {
    ...resume(p),
    contenu: sansCadratin(assainit(reecritLiens(p.content.rendered))),
    seo: {
      titre: p.yoast_head_json?.title ? sansCadratin(p.yoast_head_json.title) : null,
      description: p.yoast_head_json?.description
        ? sansCadratin(p.yoast_head_json.description)
        : null,
    },
  };
}

/** Articles de la même catégorie, pour le maillage en pied d'article. */
export async function articlesLies(a: Article, nombre = 3): Promise<ResumeArticle[]> {
  const { items } = await wp<WpPost>("posts", {
    per_page: nombre,
    exclude: a.id,
    _embed: "wp:featuredmedia,wp:term",
    _fields: CHAMPS_LISTE,
    ...(a.categories[0] ? { categories: a.categories[0].id } : {}),
  });
  return items.map(resume);
}

export async function categories(): Promise<Categorie[]> {
  const { items } = await wp<WpCategorie>("categories", {
    per_page: 100,
    hide_empty: "true",
    _fields: "id,name,slug,count",
  });
  return items
    .filter((c) => c.slug !== "non-classe" && c.slug !== "uncategorized")
    .map((c) => ({ id: c.id, nom: texteBrut(c.name), slug: c.slug }));
}

export async function categorie(slug: string): Promise<Categorie | null> {
  const toutes = await categories();
  return toutes.find((c) => c.slug === slug) ?? null;
}

/** Tous les articles, pour le sitemap : 100 par requête, maximum de l'API. */
export async function tousArticles(): Promise<{ slug: string; modifie: string }[]> {
  const tous: { slug: string; modifie: string }[] = [];
  for (let n = 1; ; n++) {
    const { items, pages } = await wp<Pick<WpPost, "slug" | "modified_gmt">>("posts", {
      page: n,
      per_page: 100,
      _fields: "slug,modified_gmt",
    });
    tous.push(...items.map((p) => ({ slug: p.slug, modifie: `${p.modified_gmt}Z` })));
    if (n >= pages) break;
  }
  return tous;
}

export const dateLongue = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });

/** Temps de lecture à 230 mots par minute, arrondi à la minute supérieure. */
export const tempsLecture = (html: string) =>
  Math.max(1, Math.ceil(texteBrut(html).split(" ").length / 230));
