import type { Metadata } from "next";
import Link from "next/link";
import { Fil } from "@/components/Fil";
import { Icone } from "@/components/Icone";
import { Conteneur, HeroZone } from "@/components/Ui";
import { metier } from "@/config/metier";
import { departementsDeRegion, toutesRegions } from "@/lib/db";
import { absolu, nombre, urlDepartement, urlRegion } from "@/lib/site";
import { capitale, comptageMetier } from "@/lib/texte";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${capitale(metier.labelPluriel)} par région et département`,
  description: `Toutes les régions et départements couverts par l'annuaire des ${metier.labelPluriel}.`,
  alternates: { canonical: absolu("/regions") },
};

export default function Page() {
  const regions = toutesRegions();

  return (
    <>
      <HeroZone
        fil={
          <Fil maillons={[{ nom: "Accueil", href: "/" }, { nom: "Régions" }]} />
        }
        pastille="Couverture nationale"
        titre={
          <>
            {capitale(metier.labelPluriel)} par{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-electric bg-clip-text text-transparent">
              région
            </span>
          </>
        }
      >
        <p className="mt-5 max-w-3xl leading-relaxed">
          Les {regions.length} régions couvertes par l&apos;annuaire et leurs
          départements. Descendez jusqu&apos;à votre commune pour voir les
          professionnels en activité.
        </p>
      </HeroZone>

      <section className="bg-white py-16">
        <Conteneur className="space-y-10">
          {regions.map((r) => (
            <section
              key={r.code}
              className="rounded-2xl border border-hairline bg-surface p-6 shadow-soft sm:p-8"
            >
              <h2 className="font-heading text-lg font-bold tracking-tight text-ink sm:text-xl">
                <Link
                  href={urlRegion(r.slug)}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                >
                  {r.nom}
                  <Icone nom="fleche" className="size-4" />
                </Link>
                <span className="mt-1 block text-sm font-normal text-ink-muted">
                  {comptageMetier(r.nb)}
                </span>
              </h2>
              <ul className="mt-5 flex flex-wrap gap-2">
                {departementsDeRegion(r.code).map((d) => (
                  <li key={d.code}>
                    <Link
                      href={urlDepartement(d.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-all hover:border-primary/40 hover:text-primary"
                    >
                      {d.nom}
                      <span className="text-xs text-ink-muted">
                        {nombre(d.nb)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Conteneur>
      </section>
    </>
  );
}
