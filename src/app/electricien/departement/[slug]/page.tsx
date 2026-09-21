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
import {
  communesDuDepartement,
  departement,
  regionParCode,
  tousDepartements,
} from "@/lib/db";
import { absolu, nombre, urlDepartement, urlRegion, urlVille } from "@/lib/site";
import {
  accord,
  capitale,
  comptageMetier,
  prefixeDepartement,
} from "@/lib/texte";

export const revalidate = 86400;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return tousDepartements().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const dep = departement(slug);
  if (!dep) return {};
  return {
    title: `${capitale(metier.labelSingulier)} dans ${prefixeDepartement(dep.nom)} - ${nombre(dep.nb)} professionnels`,
    description: `Annuaire des ${metier.labelPluriel} dans ${prefixeDepartement(dep.nom)}. ${nombre(dep.nb)} entreprises en activité, classées par commune.`,
    alternates: { canonical: absolu(urlDepartement(dep.slug)) },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const dep = departement(slug);
  if (!dep) notFound();

  const communes = communesDuDepartement(dep.code);
  const reg = dep.code_region ? regionParCode(dep.code_region) : undefined;

  return (
    <>
      <HeroZone
        fil={
          <Fil
            maillons={[
              { nom: "Accueil", href: "/" },
              ...(reg ? [{ nom: reg.nom, href: urlRegion(reg.slug) }] : []),
              { nom: dep.nom },
            ]}
          />
        }
        pastille={`Département ${dep.code}`}
        titre={
          <>
            {capitale(metier.labelPluriel)} dans{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-electric bg-clip-text text-transparent">
              {prefixeDepartement(dep.nom)}
            </span>
          </>
        }
      >
        <p className="mt-5 max-w-3xl leading-relaxed">
          {comptageMetier(dep.nb)} sont en activité dans{" "}
          {prefixeDepartement(dep.nom)}, répartis sur{" "}
          {accord(communes.length, "commune", "communes")}. Sélectionnez votre
          commune pour consulter les professionnels et demander un devis.
        </p>
        <Chiffres
          items={[
            { valeur: nombre(dep.nb), libelle: "Professionnels", accent: true },
            { valeur: nombre(communes.length), libelle: "Communes couvertes" },
          ]}
        />
      </HeroZone>

      <section className="bg-white py-16">
        <Conteneur className="flex flex-col items-center">
          <EnTeteSection
            ton="bleu"
            pastille={dep.nom}
            titre="Communes du département"
            className="mb-12"
          />
          <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {communes.map((c) => (
              <li key={c.code}>
                <CarteLien
                  href={urlVille(c.slug)}
                  titre={c.nom}
                  detail={comptageMetier(c.nb)}
                />
              </li>
            ))}
          </ul>
        </Conteneur>
      </section>
    </>
  );
}
