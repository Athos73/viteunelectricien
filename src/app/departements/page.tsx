import type { Metadata } from "next";
import Link from "next/link";
import { Fil } from "@/components/Fil";
import { Icone } from "@/components/Icone";
import { CarteLien, Chiffres, Conteneur, HeroZone } from "@/components/Ui";
import { metier } from "@/config/metier";
import { statsGlobales, tousDepartements, toutesRegions } from "@/lib/db";
import { absolu, nombre, urlDepartement } from "@/lib/site";
import { capitale, comptageMetier } from "@/lib/texte";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${capitale(metier.labelPluriel)} par département`,
  description: `Les 101 départements français couverts par l'annuaire des ${metier.labelPluriel}, du 01 au 976. Choisissez votre numéro pour voir les entreprises en activité.`,
  alternates: { canonical: absolu("/departements") },
};

export default function Page() {
  const departements = tousDepartements();
  const stats = statsGlobales();

  // La page /regions groupe déjà les départements sous leur région. Ici on les
  // classe par numéro — c'est ainsi qu'on les cherche — et la région passe en
  // sous-titre pour ne rien perdre de la hiérarchie.
  const nomRegion = new Map(toutesRegions().map((r) => [r.code, r.nom]));

  return (
    <>
      <HeroZone
        fil={
          <Fil
            maillons={[{ nom: "Accueil", href: "/" }, { nom: "Départements" }]}
          />
        }
        pastille="Couverture nationale"
        titre={
          <>
            {capitale(metier.labelPluriel)} par{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-electric bg-clip-text text-transparent">
              département
            </span>
          </>
        }
      >
        <p className="mt-5 max-w-3xl leading-relaxed">
          Les {departements.length} départements couverts par l&apos;annuaire,
          classés par numéro. Ouvrez le vôtre pour voir les communes et les
          entreprises d&apos;installation électrique en activité.
        </p>

        <Chiffres
          items={[
            { valeur: departements.length, libelle: "Départements couverts" },
            {
              valeur: nombre(stats.communes),
              libelle: "Communes couvertes",
              accent: true,
            },
            {
              valeur: nombre(stats.fiches),
              libelle: "Entreprises référencées",
            },
          ]}
        />
      </HeroZone>

      <section className="bg-white py-16">
        <Conteneur>
          {/* Trois colonnes au maximum : sur quatre, « Alpes-de-Haute-Provence »
              — le plus long nom de département — se fait tronquer par la carte. */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {departements.map((d) => (
              <li key={d.code}>
                <CarteLien
                  href={urlDepartement(d.slug)}
                  titre={
                    <>
                      <span className="text-ink-muted tabular-nums">
                        {d.code}
                      </span>{" "}
                      {d.nom}
                    </>
                  }
                  detail={
                    <>
                      {comptageMetier(d.nb)}
                      {d.code_region && nomRegion.has(d.code_region) && (
                        <> · {nomRegion.get(d.code_region)}</>
                      )}
                    </>
                  }
                />
              </li>
            ))}
          </ul>

          <p className="mt-10 text-center text-sm">
            <Link
              href="/regions"
              className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Voir plutôt la liste par région
              <Icone nom="fleche" className="size-4" />
            </Link>
          </p>
        </Conteneur>
      </section>
    </>
  );
}
