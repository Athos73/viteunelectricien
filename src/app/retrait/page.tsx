import type { Metadata } from "next";
import Link from "next/link";
import { Fil } from "@/components/Fil";
import { metier } from "@/config/metier";
import { absolu } from "@/lib/site";

export const metadata: Metadata = {
  title: "Retrait ou correction d'une fiche",
  description: `Demander la modification ou le retrait d'une fiche entreprise publiée sur ${metier.nomSite}.`,
  alternates: { canonical: absolu("/retrait") },
};

const MAIL = metier.email;

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Fil
        maillons={[{ nom: "Accueil", href: "/" }, { nom: "Retrait d'une fiche" }]}
      />
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        Retrait ou correction d&apos;une fiche
      </h1>

      <div className="mt-6 max-w-3xl space-y-6 text-sm leading-relaxed text-slate-700">
        <p>
          Votre entreprise apparaît dans cet annuaire parce qu&apos;elle figure
          comme établissement en activité dans la base Sirene de l&apos;INSEE,
          sous le code d&apos;activité {metier.nafCodes.join(", ")}. Nous
          n&apos;ajoutons aucune information que vous n&apos;auriez pas
          déclarée : ni avis, ni note, ni photo, ni numéro de téléphone
          personnel.
        </p>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Demander une modification ou un retrait
          </h2>
          <p className="mt-2">
            Écrivez à{" "}
            <a href={`mailto:${MAIL}`} className="font-medium underline">
              {MAIL}
            </a>{" "}
            en indiquant :
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>le numéro SIRET de l&apos;établissement concerné ;</li>
            <li>l&apos;adresse de la page (URL) sur laquelle il apparaît ;</li>
            <li>
              l&apos;objet de votre demande : retrait complet, correction
              d&apos;une information, ou signalement d&apos;une cessation
              d&apos;activité.
            </li>
          </ul>
          <p className="mt-3">
            Nous traitons chaque demande sous 30 jours et confirmons par
            retour de courriel. Le retrait est définitif : la fiche ne sera pas
            recréée lors des mises à jour ultérieures de la base.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            Corriger la donnée à la source
          </h2>
          <p className="mt-2">
            Si l&apos;information est erronée dans Sirene elle-même (adresse,
            activité, établissement fermé non radié), corrigez-la directement
            auprès de l&apos;INSEE ou du guichet des formalités des
            entreprises : la correction se propagera automatiquement ici à la
            prochaine mise à jour, ainsi que sur tous les autres annuaires qui
            exploitent cette base.
          </p>
          <p className="mt-2">
            Vous pouvez également demander à l&apos;INSEE le statut
            non-diffusible pour votre établissement. Les établissements
            non-diffusibles sont systématiquement exclus de cet annuaire.
          </p>
        </section>

        <p className="text-xs text-slate-500">
          Voir aussi notre{" "}
          <Link href="/confidentialite" className="underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
