import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Fil } from "@/components/Fil";
import {
  CarteLien,
  Chiffres,
  Conteneur,
  EnTeteSection,
  HeroZone,
} from "@/components/Ui";
import { metier } from "@/config/metier";
import { departementsDeRegion, region, toutesRegions } from "@/lib/db";
import { absolu, nombre, urlDepartement, urlRegion } from "@/lib/site";
import { accord, capitale, comptageMetier } from "@/lib/texte";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return toutesRegions().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reg = region(slug);
  if (!reg) return {};
  return {
    title: `${capitale(metier.labelSingulier)} en ${reg.nom} — ${nombre(reg.nb)} professionnels`,
    description: `Annuaire des ${metier.labelPluriel} en ${reg.nom}, par département et par commune.`,
    alternates: { canonical: absolu(urlRegion(reg.slug)) },
  };
}

const ETAPES = [
  {
    titre: "Choisissez votre département",
    texte: "Puis votre commune, pour n'afficher que les artisans du secteur.",
  },
  {
    titre: "Comparez les entreprises",
    texte:
      "Ancienneté, effectif et qualifications RGE sont indiqués sur chaque fiche.",
  },
  {
    titre: "Décrivez votre projet",
    texte: "Une minute suffit pour lancer une demande de devis.",
  },
  {
    titre: "Recevez des propositions",
    texte: "Des professionnels de votre zone vous recontactent, sans engagement.",
  },
];

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const reg = region(slug);
  if (!reg) notFound();
  const deps = departementsDeRegion(reg.code);

  return (
    <>
      <HeroZone
        fil={<Fil maillons={[{ nom: "Accueil", href: "/" }, { nom: reg.nom }]} />}
        pastille="Couverture régionale"
        titre={
          <>
            {capitale(metier.labelPluriel)} en{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-electric bg-clip-text text-transparent">
              {reg.nom}
            </span>
          </>
        }
      >
        <p className="mt-5 max-w-3xl leading-relaxed">
          {comptageMetier(reg.nb)} en activité, répartis sur{" "}
          {accord(deps.length, "département", "départements")}. Sélectionnez
          votre département pour descendre au niveau de la commune.
        </p>
        <Chiffres
          items={[
            {
              valeur: nombre(reg.nb),
              libelle: "Professionnels",
              accent: true,
            },
            { valeur: nombre(deps.length), libelle: "Départements" },
          ]}
        />
      </HeroZone>

      <section className="border-b border-hairline/80 bg-white py-16">
        <Conteneur className="flex flex-col items-center">
          <EnTeteSection
            ton="bleu"
            pastille={reg.nom}
            titre="Départements de la région"
            className="mb-12"
          />
          <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deps.map((d) => (
              <li key={d.code}>
                <CarteLien
                  href={urlDepartement(d.slug)}
                  titre={`${d.nom} (${d.code})`}
                  detail={comptageMetier(d.nb)}
                />
              </li>
            ))}
          </ul>
        </Conteneur>
      </section>

      <section className="bg-slate-50/70 py-16">
        <Conteneur className="flex flex-col items-center">
          <EnTeteSection
            pastille="Mode d'emploi"
            titre="Comment ça marche"
            className="mb-12"
          />
          <ol className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ETAPES.map((e, i) => (
              <li
                key={e.titre}
                className="rounded-2xl border border-hairline bg-white p-6 shadow-soft"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 font-heading font-bold text-white shadow-md shadow-sky-500/25">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-heading font-bold text-ink">
                  {e.titre}
                </h3>
                <p className="mt-2 text-sm leading-relaxed">{e.texte}</p>
              </li>
            ))}
          </ol>
        </Conteneur>
      </section>
    </>
  );
}
