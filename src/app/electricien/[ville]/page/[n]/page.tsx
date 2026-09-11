import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PageVille } from "@/components/PageVille";
import { communeParSlug, nbPages } from "@/lib/db";
import { absolu, urlVille, urlVillePage } from "@/lib/site";
import { descriptionVille, titreVille } from "@/lib/texte";

export const revalidate = 86400;

type Props = { params: Promise<{ ville: string; n: string }> };

function lire(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const page = Number(n);
  return page >= 2 ? page : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville, n } = await params;
  const commune = communeParSlug(ville);
  const page = lire(n);
  if (!commune || !page || page > nbPages(commune)) return {};
  return {
    title: titreVille(commune, page),
    description: descriptionVille(commune, page),
    alternates: { canonical: absolu(urlVillePage(commune.slug, page)) },
    // Les pages 2+ sont des listes dérivées : on garde le crawl vers les fiches
    // sans encombrer l'index de variantes quasi identiques.
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { ville, n } = await params;
  const commune = communeParSlug(ville);
  if (!commune || commune.nb === 0) notFound();

  const page = lire(n);
  if (!page) permanentRedirect(urlVille(commune.slug));
  if (page > nbPages(commune)) notFound();

  return <PageVille commune={commune} page={page} />;
}
