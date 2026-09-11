import Link from "next/link";
import { DevisWidget } from "@/components/DevisWidget";
import { FicheCard } from "@/components/FicheCard";
import { Fil } from "@/components/Fil";
import { Icone } from "@/components/Icone";
import { CarteLien, Conteneur, EnTeteSection, Pastille } from "@/components/Ui";
import { metier } from "@/config/metier";
import {
  PAR_PAGE,
  arrondissements,
  departementParCode,
  fichesDeCommune,
  nbPages,
  regionParCode,
  voisines,
  type Commune,
} from "@/lib/db";
import {
  absolu,
  nombre,
  urlDepartement,
  urlFiche,
  urlRegion,
  urlVille,
  urlVillePage,
} from "@/lib/site";
import { capitale, comptageMetier, introVille, motCleWidget } from "@/lib/texte";

/**
 * Prestations typiques du métier : contenu éditorial générique, jamais une
 * affirmation sur une entreprise en particulier (nous n'avons pas ces données).
 */
const PRESTATIONS = [
  "Mise aux normes NF C 15-100",
  "Rénovation de tableau électrique",
  "Dépannage et recherche de panne",
  "Installation de prises et éclairage",
  "Borne de recharge pour véhicule",
  "Diagnostic électrique avant vente",
];

export function PageVille({ commune, page }: { commune: Commune; page: number }) {
  const fiches = fichesDeCommune(commune, page);
  const total = nbPages(commune);
  const dep = departementParCode(commune.code_departement);
  const reg = regionParCode(commune.code_region);
  const proches = voisines(commune);
  const arrs = arrondissements(commune);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${capitale(metier.labelPluriel)} à ${commune.nom}`,
    numberOfItems: commune.nb,
    itemListElement: fiches.map((f, i) => ({
      "@type": "ListItem",
      position: (page - 1) * PAR_PAGE + i + 1,
      item: {
        "@type": "Electrician",
        name: f.enseigne ?? f.nom,
        address: {
          "@type": "PostalAddress",
          streetAddress: f.adresse,
          postalCode: f.code_postal,
          addressLocality: commune.nom,
          addressCountry: "FR",
        },
        url: absolu(urlFiche(commune.slug, f.slug)),
        ...(f.lat && f.lng
          ? { geo: { "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lng } }
          : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Héros de commune : même grammaire visuelle que l'accueil, en compact. */}
      <section className="relative overflow-hidden border-b border-hairline/60 bg-gradient-to-b from-sky-50 via-white to-surface py-10 lg:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-1/4 size-80 rounded-full bg-sky-200/40 blur-3xl"
        />
        <Conteneur className="relative z-10">
          <Fil
            maillons={[
              { nom: "Accueil", href: "/" },
              ...(reg ? [{ nom: reg.nom, href: urlRegion(reg.slug) }] : []),
              ...(dep ? [{ nom: dep.nom, href: urlDepartement(dep.slug) }] : []),
              {
                nom: commune.nom,
                ...(page > 1 ? { href: urlVille(commune.slug) } : {}),
              },
              ...(page > 1 ? [{ nom: `Page ${page}` }] : []),
            ]}
          />

          <div className="mt-5">
            <Pastille ton="bleu">
              <Icone nom="certifie" className="size-3.5" />
              Données Sirene · {commune.code_postal}
            </Pastille>
          </div>

          <h1 className="mt-4 max-w-4xl font-heading text-3xl leading-tight font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {capitale(metier.labelSingulier)} à{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-electric bg-clip-text text-transparent">
              {commune.nom}
            </span>{" "}
            ({commune.code_postal})
          </h1>

          <dl className="mt-8 grid max-w-2xl grid-cols-1 divide-y divide-slate-100 rounded-2xl border border-hairline bg-white/80 p-5 shadow-soft backdrop-blur-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="flex flex-col pt-3 first:pt-0 sm:px-5 sm:pt-0 sm:first:pl-0">
              <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
                Professionnels trouvés
              </dt>
              <dd className="order-1 font-heading text-2xl font-extrabold tracking-tight text-primary">
                {nombre(commune.nb)}
              </dd>
            </div>
            <div className="flex flex-col pt-3 sm:px-5 sm:pt-0">
              <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
                Habitants
              </dt>
              <dd className="order-1 font-heading text-2xl font-extrabold tracking-tight text-ink">
                {nombre(commune.population)}
              </dd>
            </div>
            <div className="flex flex-col pt-3 sm:px-5 sm:pt-0">
              <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
                Département
              </dt>
              <dd className="order-1 font-heading text-2xl font-extrabold tracking-tight text-ink">
                {commune.code_departement}
              </dd>
            </div>
          </dl>
        </Conteneur>
      </section>

      {/* Contexte éditorial + prestations courantes. */}
      {page === 1 && (
        <section className="border-b border-hairline/80 bg-white py-14">
          <Conteneur className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                {capitale(metier.labelPluriel)} à {commune.nom}
              </h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
              <p className="mt-6 leading-relaxed">
                {introVille(commune, fiches, dep)}
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-soft">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                  <Icone nom="eclair" className="size-4" />
                  Prestations courantes
                </div>
                <ul className="mt-5 space-y-3 text-sm">
                  {PRESTATIONS.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Icone
                        nom="coche"
                        className="mt-px size-4.5 shrink-0 text-verified"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Conteneur>
        </section>
      )}

      {/* Widget de devis. */}
      <section
        id="devis"
        className="scroll-mt-24 border-b border-hairline/80 bg-ink py-14"
      >
        <Conteneur className="flex flex-col items-center">
          <Pastille ton="bleu">Gratuit et sans engagement</Pastille>
          <h2 className="mt-4 text-center font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Demandez plusieurs devis à {commune.nom}
          </h2>
          <p className="mt-3 max-w-2xl text-center text-slate-300">
            Décrivez votre projet, recevez des propositions d&apos;artisans
            locaux.
          </p>
          <div className="mt-8 w-full max-w-3xl rounded-2xl border border-hairline bg-white p-5 shadow-float sm:p-8">
            <DevisWidget motCle={motCleWidget(commune)} />
          </div>
        </Conteneur>
      </section>

      {arrs.length > 0 && (
        <section className="border-b border-hairline/80 bg-white py-14">
          <Conteneur>
            <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Par arrondissement
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {arrs.map((a) => (
                <li key={a.code}>
                  <CarteLien
                    href={urlVille(a.slug)}
                    titre={a.nom}
                    detail={comptageMetier(a.nb)}
                  />
                </li>
              ))}
            </ul>
          </Conteneur>
        </section>
      )}

      {/* La liste elle-même. */}
      <section className="border-b border-hairline/80 bg-slate-50/70 py-16">
        <Conteneur className="flex flex-col items-center">
          <EnTeteSection
            ton="bleu"
            pastille={`${commune.code_postal} · ${commune.nom}`}
            titre={
              <>
                {comptageMetier(commune.nb)} à {commune.nom}
                {total > 1 && (
                  <span className="mt-2 block text-base font-normal text-ink-muted">
                    Page {page} sur {total}
                  </span>
                )}
              </>
            }
            className="mb-12"
          />
          <ul className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {fiches.map((f) => (
              <FicheCard key={f.siret} fiche={f} villeSlug={commune.slug} />
            ))}
          </ul>
          {total > 1 && (
            <Pagination slug={commune.slug} page={page} total={total} />
          )}
        </Conteneur>
      </section>

      {proches.length > 0 && (
        <section className="border-b border-hairline/80 bg-white py-14">
          <Conteneur>
            <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {capitale(metier.labelPluriel)} à proximité
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {proches.map((v) => (
                <li key={v.code}>
                  <CarteLien
                    href={urlVille(v.slug)}
                    titre={v.nom}
                    detail={`${comptageMetier(v.nb)} · ${v.distance.toFixed(0)} km`}
                  />
                </li>
              ))}
            </ul>
          </Conteneur>
        </section>
      )}

      <Conteneur className="py-10">
        <p className="text-xs text-ink-muted">
          Données issues de la base Sirene de l&apos;INSEE (code NAF{" "}
          {metier.nafCodes.join(", ")}), établissements en activité.{" "}
          <Link href="/retrait" className="underline hover:text-primary">
            Demander le retrait d&apos;une fiche
          </Link>
          .
        </p>
      </Conteneur>
    </>
  );
}

function Pagination({
  slug,
  page,
  total,
}: {
  slug: string;
  page: number;
  total: number;
}) {
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
        <Link href={urlVillePage(slug, page - 1)} rel="prev" className={lien}>
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
            <Link href={urlVillePage(slug, p)} className={lien}>
              {p}
            </Link>
          )}
        </span>
      ))}
      {page < total && (
        <Link href={urlVillePage(slug, page + 1)} rel="next" className={lien}>
          Suivant
        </Link>
      )}
    </nav>
  );
}
