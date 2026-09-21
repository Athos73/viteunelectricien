import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await categorie((await params).slug);
  if (!cat) return {};
  return {
    title: `${cat.nom} : conseils et guides`,
    description: introCategorie(cat.nom),
    alternates: { canonical: absolu(urlCategorie(cat.slug)) },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const [cat, cats] = await Promise.all([categorie(slug), categories()]);
  if (!cat) notFound();
  const liste = await articles(1, cat.id);

  return (
    <ListeBlog
      titre={cat.nom}
      intro={introCategorie(cat.nom)}
      fil={[
        { nom: "Accueil", href: "/" },
        { nom: "Blog", href: urlBlog() },
        { nom: cat.nom },
      ]}
      articles={liste.articles}
      categories={cats}
      categorieActive={cat.slug}
      page={1}
      pages={liste.pages}
      url={(p) => urlCategorie(cat.slug, p)}
    />
  );
}
