import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PageVille } from "@/components/PageVille";
import { communeParCode, communeParSlug, topCommunes } from "@/lib/db";
import { absolu, urlVille } from "@/lib/site";
import { descriptionVille, titreVille } from "@/lib/texte";

export const revalidate = 86400;

type Props = { params: Promise<{ ville: string }> };

export async function generateStaticParams() {
  return topCommunes(2000).map((c) => ({ ville: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville } = await params;
  const commune = communeParSlug(ville);
  if (!commune || commune.nb === 0) return {};
  return {
    title: titreVille(commune, 1),
    description: descriptionVille(commune, 1),
    alternates: { canonical: absolu(urlVille(commune.slug)) },
  };
}

export default async function Page({ params }: Props) {
  const { ville } = await params;
  const commune = communeParSlug(ville);
  if (!commune) notFound();

  // Une commune sans aucun professionnel ne donne pas lieu à une page : elle
  // renvoie en 301 vers la commune couverte la plus proche.
  if (commune.nb === 0) {
    const cible = commune.redirige_vers
      ? communeParCode(commune.redirige_vers)
      : undefined;
    if (cible) permanentRedirect(urlVille(cible.slug));
    notFound();
  }

  return <PageVille commune={commune} page={1} />;
}
