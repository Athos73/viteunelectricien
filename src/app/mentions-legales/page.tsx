import type { Metadata } from "next";
import Link from "next/link";
import { Fil } from "@/components/Fil";
import { metier } from "@/config/metier";
import { absolu } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Mentions légales du site ${metier.nomSite}.`,
  alternates: { canonical: absolu("/mentions-legales") },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Fil maillons={[{ nom: "Accueil", href: "/" }, { nom: "Mentions légales" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Mentions légales
      </h1>

      <div className="mt-6 max-w-3xl space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Éditeur</h2>
          <p className="mt-2">
            Le site {metier.domaine} est édité par [Viteunelectricien.fr].
          </p>
          <p className="mt-2">
            Directeur de la publication : [Viteunelectricien.fr]. Contact :{" "}
            <a href={`mailto:contact@viteunelectricien.fr}`} className="underline">
              contact@viteunelectricien.fr
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Hébergeur</h2>
          <p className="mt-2">
            Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
            États-Unis — vercel.com.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Origine des données
          </h2>
          <p className="mt-2">
            Les informations d&apos;entreprises publiées proviennent de la base
            Sirene des entreprises et de leurs établissements, diffusée par
            l&apos;INSEE sous licence ouverte Etalab 2.0, et de la base
            Découpage administratif communal français (API Géo). Ces sources
            sont exploitées telles que diffusées ; {metier.nomSite} n&apos;en
            garantit ni l&apos;exhaustivité ni l&apos;exactitude à un instant
            donné.
          </p>
          <p className="mt-2">
            Les établissements ayant exercé leur droit d&apos;opposition à la
            diffusion auprès de l&apos;INSEE ne sont pas publiés. Pour toute
            demande de rectification ou de retrait, voir la page{" "}
            <Link href="/retrait" className="underline">
              retrait d&apos;une fiche
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Nature du service
          </h2>
          <p className="mt-2">
            {metier.nomSite} est un annuaire informatif. Il n&apos;emploie
            aucun {metier.labelSingulier}, ne réalise aucun travaux et
            n&apos;intervient pas dans la relation contractuelle entre un
            particulier et une entreprise. La mise en relation pour devis est
            opérée par un service tiers partenaire.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Propriété intellectuelle
          </h2>
          <p className="mt-2">
            La structure du site, ses textes éditoriaux et sa charte graphique
            sont protégés. Les données publiques restent régies par leur
            licence d&apos;origine (Licence Ouverte Etalab 2.0).
          </p>
        </section>
      </div>
    </div>
  );
}
