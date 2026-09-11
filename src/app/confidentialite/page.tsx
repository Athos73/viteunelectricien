import type { Metadata } from "next";
import Link from "next/link";
import { Fil } from "@/components/Fil";
import { metier } from "@/config/metier";
import { absolu } from "@/lib/site";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: `Politique de confidentialité et traitement des données personnelles sur ${metier.nomSite}.`,
  alternates: { canonical: absolu("/confidentialite") },
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Fil maillons={[{ nom: "Accueil", href: "/" }, { nom: "Confidentialité" }]} />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Politique de confidentialité
      </h1>

      <div className="mt-6 max-w-3xl space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Données des professionnels référencés
          </h2>
          <p className="mt-2">
            Les fiches publiées reprennent des données issues de la base Sirene
            de l&apos;INSEE : dénomination, enseigne, adresse de
            l&apos;établissement, SIRET, date de création, tranche
            d&apos;effectif et code d&apos;activité. Ces données sont publiques
            et diffusées sous licence ouverte.
          </p>
          <p className="mt-2">
            Lorsque l&apos;établissement est exploité par une personne physique
            (entrepreneur individuel), ces informations peuvent constituer des
            données à caractère personnel. La base légale du traitement est
            l&apos;intérêt légitime (article 6.1.f du RGPD) : permettre au
            public de trouver un professionnel en activité près de chez lui.
          </p>
          <p className="mt-2">
            Les établissements ayant demandé à l&apos;INSEE le statut
            non-diffusible sont exclus de l&apos;annuaire. Vous disposez
            d&apos;un droit d&apos;accès, de rectification, d&apos;effacement
            et d&apos;opposition : utilisez le formulaire de{" "}
            <Link href="/retrait" className="underline">
              retrait d&apos;une fiche
            </Link>
            . Toute demande est traitée sous 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Données des visiteurs
          </h2>
          <p className="mt-2">
            La consultation de l&apos;annuaire ne nécessite aucune création de
            compte. Le champ de recherche envoie uniquement le texte saisi à
            notre serveur pour retourner des suggestions de communes ; rien
            n&apos;est conservé.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Formulaire de devis et service tiers
          </h2>
          <p className="mt-2">
            Le formulaire de demande de devis est fourni par un prestataire
            tiers (Vite un Devis). Les informations que vous y saisissez —
            description du projet, code postal, coordonnées — sont collectées
            et traitées par ce prestataire, qui les transmet à des
            professionnels susceptibles de vous répondre. Ce formulaire charge
            des ressources depuis les domaines viteundevis.com et
            googleapis.com, susceptibles de déposer des traceurs.
          </p>
          <p className="mt-2">
            Ce module n&apos;est chargé que lorsqu&apos;il devient visible à
            l&apos;écran. Pour connaître le détail du traitement opéré par ce
            prestataire, reportez-vous à sa propre politique de
            confidentialité.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Pour toute question relative à vos données :{" "}
            <a href={`mailto:contact@${metier.domaine}`} className="underline">
              contact@{metier.domaine}
            </a>
            . Vous pouvez également introduire une réclamation auprès de la
            CNIL.
          </p>
        </section>
      </div>
    </div>
  );
}
