import Image from "next/image";
import Link from "next/link";
import { Fil, type Maillon } from "@/components/Fil";
import { Icone } from "@/components/Icone";
import { Conteneur, HeroZone } from "@/components/Ui";
import {
  dateLongue,
  urlArticle,
  urlBlog,
  urlCategorie,
  type Categorie,
  type ResumeArticle,
} from "@/lib/blog";

export function CarteArticle({
  article,
  prioritaire = false,
}: {
  article: ResumeArticle;
  prioritaire?: boolean;
}) {
  const categorie = article.categories[0];
  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-card">
      <Link href={urlArticle(article.slug)} className="flex flex-1 flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-sky-100 to-cyan-50">
          {article.image ? (
            <Image
              src={article.image.url}
              alt={article.image.alt}
              fill
              sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
              loading={prioritaire ? "eager" : "lazy"}
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-full items-center justify-center">
              <Icone nom="eclair" className="size-12 text-sky-300" />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-muted">
            {categorie && (
              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-semibold text-sky-700">
                {categorie.nom}
              </span>
            )}
            <time dateTime={article.publie}>{dateLongue(article.publie)}</time>
          </p>
          <h2 className="mt-3 font-heading text-lg leading-snug font-bold text-ink transition-colors group-hover:text-primary">
            {article.titre}
          </h2>
          {article.extrait && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
              {article.extrait}
            </p>
          )}
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primary">
            Lire l&apos;article
            <Icone nom="fleche" className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}

export function GrilleArticles({ articles }: { articles: ResumeArticle[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((a, i) => (
        <CarteArticle key={a.id} article={a} prioritaire={i < 3} />
      ))}
    </ul>
  );
}

function Pagination({
  page,
  total,
  url,
}: {
  page: number;
  total: number;
  url: (n: number) => string;
}) {
  if (total <= 1) return null;
  const fenetre = new Set<number>([1, total, page - 1, page, page + 1]);
  const pages = [...fenetre]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const lien =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-hairline bg-white px-3.5 text-sm font-medium text-ink-soft transition-all hover:border-primary/40 hover:text-primary";

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link href={url(page - 1)} rel="prev" className={lien}>
          Précédent
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="text-slate-400">…</span>
          )}
          {p === page ? (
            <span
              aria-current="page"
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-3.5 text-sm font-bold text-white shadow-md shadow-sky-500/20"
            >
              {p}
            </span>
          ) : (
            <Link href={url(p)} className={lien}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < total && (
        <Link href={url(page + 1)} rel="next" className={lien}>
          Suivant
        </Link>
      )}
    </nav>
  );
}

/** Corps commun à l'accueil du blog, à ses pages 2+ et aux catégories. */
export function ListeBlog({
  titre,
  intro,
  fil,
  articles,
  categories,
  categorieActive,
  page,
  pages,
  url,
}: {
  titre: string;
  intro: string;
  fil: Maillon[];
  articles: ResumeArticle[];
  categories: Categorie[];
  categorieActive?: string;
  page: number;
  pages: number;
  url: (n: number) => string;
}) {
  const puce =
    "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors";
  return (
    <>
      <HeroZone fil={<Fil maillons={fil} />} pastille="Conseils & guides" titre={titre}>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
          {intro}
        </p>
      </HeroZone>

      <Conteneur className="py-12 lg:py-16">
        {categories.length > 0 && (
          <nav aria-label="Catégories" className="mb-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
            <Link
              href={urlBlog()}
              className={`${puce} ${!categorieActive ? "border-primary bg-primary text-white" : "border-hairline bg-white text-ink-soft hover:border-primary/40 hover:text-primary"}`}
            >
              Tous les articles
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={urlCategorie(c.slug)}
                className={`${puce} ${categorieActive === c.slug ? "border-primary bg-primary text-white" : "border-hairline bg-white text-ink-soft hover:border-primary/40 hover:text-primary"}`}
              >
                {c.nom}
              </Link>
            ))}
          </nav>
        )}

        {articles.length > 0 ? (
          <GrilleArticles articles={articles} />
        ) : (
          <p className="rounded-2xl border border-dashed border-hairline bg-white p-10 text-center text-ink-soft">
            Les premiers articles arrivent bientôt.
          </p>
        )}

        <Pagination page={page} total={pages} url={url} />
      </Conteneur>
    </>
  );
}
