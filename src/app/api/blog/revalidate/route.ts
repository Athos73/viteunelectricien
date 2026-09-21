import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { TAG_BLOG, urlArticle } from "@/lib/blog";

/**
 * Appelé par WordPress à chaque publication, mise à jour ou suppression
 * d'article (extension `docs/wordpress/viteunelectricien-headless.php`) — que
 * l'article vienne de l'éditeur ou de Wisewand.
 *
 * Sans cet appel, un nouvel article n'apparaîtrait qu'à l'expiration du cache,
 * une heure plus tard.
 */

export const dynamic = "force-dynamic";

const json = (charge: unknown, statut: number) =>
  Response.json(charge, {
    status: statut,
    headers: { "Cache-Control": "no-store" },
  });

/** Comparaison à durée constante, comme pour le webhook des leads. */
function jetonValide(entete: string | null, attendu: string): boolean {
  const fourni = entete?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(requete: NextRequest) {
  const attendu = process.env.BLOG_REVALIDATE_TOKEN;
  if (!attendu) return json({ ok: false, message: "Point d'entrée non configuré." }, 503);
  if (!jetonValide(requete.headers.get("authorization"), attendu))
    return json({ ok: false, message: "Jeton absent ou invalide." }, 401);

  let slug: string | null = null;
  try {
    const corps = (await requete.json()) as { slug?: unknown };
    if (typeof corps.slug === "string" && /^[a-z0-9-]+$/.test(corps.slug))
      slug = corps.slug;
  } catch {
    // Corps vide : on invalide tout le blog, ce qui reste correct.
  }

  // Toutes les lectures WordPress portent l'étiquette : listes, catégories,
  // articles liés et sitemap se régénèrent à leur prochaine visite.
  revalidateTag(TAG_BLOG, "max");
  // L'article lui-même est rendu à la demande : on purge aussi sa page, pour
  // qu'une correction soit visible dès la visite suivante.
  if (slug) revalidatePath(urlArticle(slug));

  return json({ ok: true, slug }, 200);
}
