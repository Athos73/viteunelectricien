import type { Metadata } from "next";
import { ListeBlog } from "@/components/Blog";
import { articles, categories, INTRO_BLOG, TITRE_BLOG, urlBlog } from "@/lib/blog";
import { absolu } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Blog : conseils et guides pour vos travaux d'électricité`,
  description: INTRO_BLOG,
  alternates: { canonical: absolu(urlBlog()) },
};

export default async function Page() {
  const [liste, cats] = await Promise.all([articles(1), categories()]);
  return (
    <ListeBlog
      titre={TITRE_BLOG}
      intro={INTRO_BLOG}
      fil={[{ nom: "Accueil", href: "/" }, { nom: "Blog" }]}
      articles={liste.articles}
      categories={cats}
      page={1}
      pages={liste.pages}
      url={urlBlog}
    />
  );
}
