import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ListeBlog } from "@/components/Blog";
import { articles, categories, INTRO_BLOG, TITRE_BLOG, urlBlog } from "@/lib/blog";
import { absolu } from "@/lib/site";

export const revalidate = 3600;
// Rendu à la première visite puis mis en cache (ISR), comme les articles.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ n: string }> };

function lire(n: string): number | null {
  if (!/^\d+$/.test(n)) return null;
  const page = Number(n);
  return page >= 2 ? page : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = lire((await params).n);
  if (!page) return {};
  return {
    title: `Blog : conseils et guides - page ${page}`,
    alternates: { canonical: absolu(urlBlog(page)) },
    robots: { index: false, follow: true },
  };
}

export default async function Page({ params }: Props) {
  const page = lire((await params).n);
  if (!page) permanentRedirect(urlBlog());

  const [liste, cats] = await Promise.all([articles(page), categories()]);
  if (liste.articles.length === 0) notFound();

  return (
    <ListeBlog
      titre={`${TITRE_BLOG} - page ${page}`}
      intro={INTRO_BLOG}
      fil={[
        { nom: "Accueil", href: "/" },
        { nom: "Blog", href: urlBlog() },
        { nom: `Page ${page}` },
      ]}
      articles={liste.articles}
      categories={cats}
      page={page}
      pages={liste.pages}
      url={urlBlog}
    />
  );
}
