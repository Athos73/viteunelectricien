import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { GrilleArticles } from "@/components/Blog";
import { Fil } from "@/components/Fil";
import { Icone } from "@/components/Icone";
import { Conteneur } from "@/components/Ui";
import { metier } from "@/config/metier";
import {
  article,
  articlesLies,
  dateLongue,
  tempsLecture,
  urlArticle,
  urlBlog,
  urlCategorie,
} from "@/lib/blog";
import { absolu } from "@/lib/site";

// Aucun article n'est pré-rendu au build : chacun est généré à sa première
// visite puis mis en cache, et le webhook WordPress l'invalide à la mise à jour.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await article((await params).slug);
  if (!a) return {};

  // Le titre Yoast embarque déjà le nom du site (réglage « Titre du site » de
  // WordPress) : `absolute` évite que le gabarit du layout le double.
  const titre = a.seo.titre ? { absolute: a.seo.titre } : a.titre;
  const description = a.seo.description ?? a.extrait;
  const canonical = absolu(urlArticle(a.slug));

  return {
    title: titre,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: a.titre,
      description,
      publishedTime: a.publie,
      modifiedTime: a.modifie,
      images: a.image ? [{ url: a.image.url, alt: a.image.alt }] : undefined,
    },
  };
}

export default async function Page({ params }: Props) {
  const a = await article((await params).slug);
  if (!a) notFound();

  const lies = await articlesLies(a);
  const categorie = a.categories[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: a.titre,
    description: a.seo.description ?? a.extrait,
    datePublished: a.publie,
    dateModified: a.modifie,
    mainEntityOfPage: absolu(urlArticle(a.slug)),
    ...(a.image ? { image: a.image.url } : {}),
    author: { "@type": "Organization", name: metier.nomSite, url: absolu("/") },
    publisher: { "@type": "Organization", name: metier.nomSite, url: absolu("/") },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header className="relative overflow-hidden border-b border-hairline/60 bg-gradient-to-b from-sky-50 via-white to-surface pt-10 pb-12 lg:pt-14">
          <div
            aria-hidden
            className="pointer-events-none absolute top-0 right-1/4 size-80 rounded-full bg-sky-200/40 blur-3xl"
          />
          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6">
            <Fil
              maillons={[
                { nom: "Accueil", href: "/" },
                { nom: "Blog", href: urlBlog() },
                ...(categorie
                  ? [{ nom: categorie.nom, href: urlCategorie(categorie.slug) }]
                  : []),
                { nom: a.titre },
              ]}
            />
            <h1 className="mt-6 font-heading text-3xl leading-tight font-extrabold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
              {a.titre}
            </h1>
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
              {/* Signature de marque : le compte WordPress (« contact »,
                  « wisewand »…) n'a pas à apparaître côté lecteurs. */}
              <span className="font-medium text-ink-soft">{metier.nomSite}</span>
              <time dateTime={a.publie}>Publié le {dateLongue(a.publie)}</time>
              {a.modifie.slice(0, 10) > a.publie.slice(0, 10) && (
                <time dateTime={a.modifie}>· Mis à jour le {dateLongue(a.modifie)}</time>
              )}
              <span>· {tempsLecture(a.contenu)} min de lecture</span>
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
          {a.image && (
            <Image
              src={a.image.url}
              alt={a.image.alt}
              width={a.image.largeur ?? 1024}
              height={a.image.hauteur ?? 576}
              sizes="(min-width: 768px) 720px, 100vw"
              preload
              className="mb-10 w-full rounded-2xl border border-hairline object-cover shadow-soft"
            />
          )}

          <div className="contenu-article" dangerouslySetInnerHTML={{ __html: a.contenu }} />

          {/* Wisewand pose des blocs interactifs (quiz, diagnostics) pilotés en
              `x-data` : leur <script> Alpine est retiré par `assainit()` comme
              tout script venant du contenu, donc on le charge nous-mêmes, en
              confiance, uniquement quand l'article en a besoin. */}
          {a.contenu.includes("x-data") && (
            <Script
              src="https://cdn.jsdelivr.net/npm/@alpinejs/csp@3/dist/cdn.min.js"
              strategy="lazyOnload"
            />
          )}

          <aside className="mt-14 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 p-8 text-white shadow-float">
            <p className="flex items-center gap-2 font-heading text-xl font-bold">
              <Icone nom="eclair" className="size-6" />
              Besoin d&apos;un {metier.labelSingulier} ?
            </p>
            <p className="mt-2 text-sky-50">
              Décrivez vos travaux : des artisans près de chez vous vous
              proposent un devis gratuit, sans engagement.
            </p>
            <Link
              href="/#devis"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-sky-700 shadow-md transition-transform hover:-translate-y-0.5"
            >
              Demander un devis gratuit
              <Icone nom="fleche" className="size-4" />
            </Link>
          </aside>
        </div>
      </article>

      {lies.length > 0 && (
        <section className="border-t border-hairline bg-white py-14">
          <Conteneur>
            <h2 className="mb-8 font-heading text-2xl font-bold tracking-tight text-ink">
              À lire aussi
            </h2>
            <GrilleArticles articles={lies} />
          </Conteneur>
        </section>
      )}
    </>
  );
}
