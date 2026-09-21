import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ListeBlog } from "@/components/Blog";
import {
  articles,
  categorie,
  categories,
  introCategorie,
  urlBlog,
  urlCategorie,
} from "@/lib/blog";
import { absolu } from "@/lib/site";

export const revalidate = 3600;
// Rendu à la première visite puis mis en cache (ISR), comme les articles.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string; n: string }> };

function lire(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const page = Number(n);
  return page >= 2 ? page : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const [cat, page] = [await categorie(slug), lire(n)];
  if (!cat || !page) return {};
  return {
    title: `${cat.nom} - page ${page}`,
    alternates: { canonical: absolu(urlCategorie(cat.slug, page)) },
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const { slug, n } = await params;
  const [cat, cats] = await Promise.all([categorie(slug), categories()]);
  if (!cat) notFound();
  const page = lire(n);
  if (!page) permanentRedirect(urlCategorie(cat.slug));

  const liste = await articles(page, cat.id);
  if (liste.articles.length === 0) notFound();

  return (
    <ListeBlog
      titre={`${cat.nom} - page ${page}`}
      intro={introCategorie(cat.nom)}
      fil={[
        { nom: "Accueil", href: "/" },
        { nom: "Blog", href: urlBlog() },
        { nom: cat.nom, href: urlCategorie(cat.slug) },
        { nom: `Page ${page}` },
      ]}
      articles={liste.articles}
      categories={cats}
      categorieActive={cat.slug}
      page={page}
      pages={liste.pages}
      url={(p) => urlCategorie(cat.slug, p)}
    />
  );
}
