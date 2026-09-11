import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DevisWidget } from "@/components/DevisWidget";
import { FicheCard } from "@/components/FicheCard";
import { Fil } from "@/components/Fil";
import { Icone } from "@/components/Icone";
import {
  Conteneur,
  EnTeteSection,
  HeroZone,
  Pastille,
} from "@/components/Ui";
import { metier } from "@/config/metier";
import {
  communeParSlug,
  communePorteuse,
  departementParCode,
  ficheParSlug,
  fichesDeCommune,
  regionParCode,
  rgeDe,
} from "@/lib/db";
import {
  absolu,
  anciennete,
  libelleEffectif,
  urlDepartement,
  urlFiche,
  urlRegion,
  urlVille,
} from "@/lib/site";
import { capitale, comptageMetier } from "@/lib/texte";

export const revalidate = 86400;

type Props = { params: Promise<{ ville: string; fiche: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville, fiche } = await params;
  const commune = communeParSlug(ville);
  if (!commune) return {};
  const f = ficheParSlug(commune, fiche);
  if (!f) return {};
  const nom = f.enseigne ?? f.nom;
  const porteuse = communePorteuse(commune, f);
  return {
    title: `${nom} — ${metier.labelSingulier} à ${porteuse.nom} (${f.code_postal})`,
    description: `${nom}, ${metier.labelSingulier} situé ${f.adresse}. Coordonnées, ancienneté, qualifications et demande de devis.`,
    alternates: { canonical: absolu(urlFiche(porteuse.slug, f.slug)) },
  };
}

export default async function Page({ params }: Props) {
  const { ville, fiche } = await params;
  const commune = communeParSlug(ville);
  if (!commune) notFound();
  const f = ficheParSlug(commune, fiche);
  if (!f) notFound();

  const nom = f.enseigne ?? f.nom;
  const porteuse = communePorteuse(commune, f);
  const rge = rgeDe(f);
  const ans = anciennete(f.date_creation);
  const effectif = libelleEffectif(f.tranche_effectif);
  const dep = departementParCode(commune.code_departement);
  const reg = regionParCode(commune.code_region);
  const autres = fichesDeCommune(commune, 1)
    .filter((a) => a.siret !== f.siret)
    .slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Electrician",
    name: nom,
    legalName: f.nom,
    identifier: f.siret,
    address: {
      "@type": "PostalAddress",
      streetAddress: f.adresse,
      postalCode: f.code_postal,
      addressLocality: porteuse.nom,
      addressCountry: "FR",
    },
    ...(f.lat && f.lng
      ? { geo: { "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lng } }
      : {}),
    ...(f.date_creation ? { foundingDate: f.date_creation } : {}),
    areaServed: { "@type": "City", name: porteuse.nom },
    url: absolu(urlFiche(porteuse.slug, f.slug)),
  };

  const lignes: [string, string][] = [
    ["Adresse", f.adresse],
    ["SIRET", f.siret],
    ...((f.date_creation
      ? [["Création", new Date(f.date_creation).toLocaleDateString("fr-FR")]]
      : []) as [string, string][]),
    ...((ans !== null ? [["Ancienneté", `${ans} ans`]] : []) as [string, string][]),
    ...((effectif ? [["Effectif", effectif]] : []) as [string, string][]),
    ["Activité", `Travaux d'installation électrique (NAF ${f.naf})`],
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <HeroZone
        fil={
          <Fil
            maillons={[
              { nom: "Accueil", href: "/" },
              ...(reg ? [{ nom: reg.nom, href: urlRegion(reg.slug) }] : []),
              ...(dep ? [{ nom: dep.nom, href: urlDepartement(dep.slug) }] : []),
              { nom: commune.nom, href: urlVille(commune.slug) },
              { nom },
            ]}
          />
        }
        titre={nom}
      >
        <p className="mt-4 text-lg text-ink-soft">
          {capitale(metier.labelSingulier)} à {porteuse.nom} (
          {f.code_postal})
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Établissement actif
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            <Icone nom="certifie" className="size-3.5" />
            Vérifié Sirene
          </span>
          {rge.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              RGE · {rge.length} qualification{rge.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </HeroZone>

      <section className="border-b border-hairline/80 bg-white py-14">
        <Conteneur className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            {rge.length > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="flex items-center gap-2 font-heading font-bold text-emerald-900">
                  <Icone nom="certifie" className="size-5" />
                  Qualification RGE — Reconnu Garant de l&apos;Environnement
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-emerald-800">
                  Cette entreprise détient {rge.length} qualification
                  {rge.length > 1 ? "s" : ""} RGE, nécessaire pour bénéficier
                  des aides à la rénovation énergétique
                  (MaPrimeRénov&apos;, CEE).
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {rge.map((q) => (
                    <li
                      key={q}
                      className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700"
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="mt-10 font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Informations administratives
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
            <dl className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
              {lignes.map(([k, v]) => (
                <div
                  key={k}
                  className="flex flex-col gap-1 p-5 sm:flex-row sm:gap-6"
                >
                  <dt className="w-44 shrink-0 text-sm font-medium text-ink-muted">
                    {k}
                  </dt>
                  <dd className="text-sm font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-10 font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Zone d&apos;intervention
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
            <p className="mt-6 leading-relaxed">
              L&apos;établissement est domicilié à {porteuse.nom} (
              {f.code_postal})
              {dep ? `, dans le département ${dep.nom}` : ""}. Consultez la{" "}
              <Link
                href={urlVille(commune.slug)}
                className="font-semibold text-primary underline"
              >
                liste complète des {metier.labelPluriel} à {commune.nom}
              </Link>{" "}
              pour comparer les entreprises du secteur.
            </p>
          </div>

          {/* Colonne latérale : synthèse + appel à l'action, collante au scroll. */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 rounded-2xl border border-hairline bg-surface p-6 shadow-soft">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                <Icone nom="eclair" className="size-4" />
                En résumé
              </div>
              <dl className="mt-5 space-y-3.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Commune</dt>
                  <dd className="text-right font-semibold text-ink">
                    {porteuse.nom}
                  </dd>
                </div>
                {ans !== null && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">Ancienneté</dt>
                    <dd className="text-right font-semibold text-ink">
                      {ans} an{ans > 1 ? "s" : ""}
                    </dd>
                  </div>
                )}
                {effectif && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">Effectif</dt>
                    <dd className="text-right font-semibold text-ink">
                      {effectif}
                    </dd>
                  </div>
                )}
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">RGE</dt>
                  <dd className="text-right font-semibold text-ink">
                    {rge.length > 0 ? `${rge.length} qualification${rge.length > 1 ? "s" : ""}` : "Non signalé"}
                  </dd>
                </div>
              </dl>

              <Link
                href="#devis"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-600"
              >
                Demander un devis gratuit
                <Icone nom="fleche" className="size-4" />
              </Link>

              <ul className="mt-5 space-y-2.5 text-xs">
                {[
                  "Gratuit et sans engagement",
                  "Plusieurs propositions comparables",
                  "Données issues du répertoire Sirene",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Icone nom="coche" className="size-4 shrink-0 text-verified" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </Conteneur>
      </section>

      <section
        id="devis"
        className="scroll-mt-24 border-b border-hairline/80 bg-ink py-14"
      >
        <Conteneur className="flex flex-col items-center">
          <Pastille ton="bleu">Gratuit et sans engagement</Pastille>
          <h2 className="mt-4 text-center font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Obtenir un devis à {commune.nom}
          </h2>
          <p className="mt-3 max-w-2xl text-center text-slate-300">
            Comparez plusieurs propositions d&apos;artisans du secteur,
            gratuitement.
          </p>
          <div className="mt-8 w-full max-w-3xl rounded-2xl border border-hairline bg-white p-5 shadow-float sm:p-8">
            <DevisWidget
              motCle={`${capitale(metier.labelSingulier)} ${commune.nom} ${commune.code_postal}`}
            />
          </div>
        </Conteneur>
      </section>

      {autres.length > 0 && (
        <section className="bg-slate-50/70 py-16">
          <Conteneur className="flex flex-col items-center">
            <EnTeteSection
              ton="bleu"
              pastille={commune.nom}
              titre={`Autres ${metier.labelPluriel} à ${commune.nom}`}
              className="mb-12"
            />
            <ul className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {autres.map((a) => (
                <FicheCard key={a.siret} fiche={a} villeSlug={commune.slug} />
              ))}
            </ul>
            <Link
              href={urlVille(commune.slug)}
              className="mt-10 inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Voir les {comptageMetier(commune.nb)} à {commune.nom}
              <Icone nom="fleche" className="size-4" />
            </Link>
          </Conteneur>
        </section>
      )}

      <Conteneur className="py-10">
        <p className="text-xs text-ink-muted">
          Informations issues de la base Sirene de l&apos;INSEE, établissement
          en activité.{" "}
          <Link href="/retrait" className="underline hover:text-primary">
            Demander le retrait de cette fiche
          </Link>
          .
        </p>
      </Conteneur>
    </>
  );
}
