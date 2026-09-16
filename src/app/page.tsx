import Link from "next/link";
import { FormulaireDevis } from "@/components/FormulaireDevis";
import { Icone } from "@/components/Icone";
import { Recherche } from "@/components/Recherche";
import {
  CarteLien,
  Conteneur,
  EnTeteSection,
  Pastille,
  Question,
} from "@/components/Ui";
import { metier } from "@/config/metier";
import { statsGlobales, topCommunes, toutesRegions } from "@/lib/db";
import { absolu, nombre, urlRegion, urlVille } from "@/lib/site";
import { capitale, comptageMetier } from "@/lib/texte";

export const revalidate = 86400;

export const metadata = {
  alternates: { canonical: absolu("/") },
};

export default function Page() {
  const stats = statsGlobales();
  const villes = topCommunes(24);
  const regions = toutesRegions();

  return (
    <>
      {/* Héros : dégradé clair, halos diffus et barre de recherche flottante. */}
      <section className="relative overflow-hidden border-b border-hairline/60 bg-gradient-to-b from-sky-50 via-white to-surface py-16 lg:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-1/4 size-96 rounded-full bg-sky-200/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 left-10 size-80 rounded-full bg-blue-100/50 blur-3xl"
        />

        <Conteneur className="relative z-10 flex flex-col items-center text-center">
          <Pastille ton="bleu">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Base officielle INSEE / Sirene
          </Pastille>

          <h1 className="mt-6 max-w-4xl font-heading text-3xl leading-[1.15] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Trouvez un{" "}
            <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-electric bg-clip-text text-transparent">
              {metier.labelSingulier}
            </span>{" "}
            près de chez vous
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
            {nombre(stats.fiches)} entreprises d&apos;installation électrique en
            activité, réparties dans {nombre(stats.communes)} communes
            françaises. Consultez, comparez, demandez un devis gratuit.
          </p>

          <div className="mt-10 w-full max-w-3xl">
            <Recherche />
          </div>

          <dl className="mt-12 grid w-full max-w-3xl grid-cols-1 divide-y divide-slate-100 rounded-2xl border border-hairline bg-white/80 p-6 text-center shadow-soft backdrop-blur-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:p-7 sm:text-left">
            <div className="flex flex-col items-center pt-2 sm:items-start sm:px-4 sm:pt-0">
              <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
                Entreprises référencées
              </dt>
              <dd className="order-1 flex items-baseline gap-1.5 font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {nombre(stats.fiches)}
                <span className="rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-600">
                  Actives
                </span>
              </dd>
            </div>
            <div className="flex flex-col items-center pt-4 sm:items-start sm:px-6 sm:pt-0">
              <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
                Communes couvertes
              </dt>
              <dd className="order-1 font-heading text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                {nombre(stats.communes)}
              </dd>
            </div>
            <div className="flex flex-col items-center pt-4 sm:items-start sm:px-6 sm:pt-0">
              <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
                Professionnels RGE
              </dt>
              <dd className="order-1 flex items-center gap-1.5 font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {nombre(stats.rge)}
                <Icone nom="certifie" className="size-5 text-verified" />
              </dd>
            </div>
          </dl>
        </Conteneur>
      </section>

      {/* Bloc de réassurance : d'où viennent les données, en deux colonnes. */}
      <section className="border-b border-hairline/80 bg-white py-20">
        <Conteneur className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Pastille ton="bleu">L&apos;annuaire de confiance</Pastille>
            <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {capitale(metier.labelPluriel)} vérifiés, données publiques
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
            <p className="mt-6 leading-relaxed">
              Chaque fiche est construite à partir du répertoire Sirene de
              l&apos;INSEE, la source légale qui recense tous les
              établissements immatriculés en France. Aucune inscription payante,
              aucun classement sponsorisé : l&apos;ordre d&apos;affichage ne se
              négocie pas.
            </p>
            <p className="mt-4 leading-relaxed">
              Nous ne conservons que les établissements en activité dont
              l&apos;activité principale correspond aux travaux
              d&apos;installation électrique, et nous excluons les entreprises
              ayant exercé leur droit d&apos;opposition auprès de
              l&apos;INSEE.
            </p>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Établissements en activité uniquement",
                "Qualifications RGE signalées",
                "Ancienneté et effectif indiqués",
                "Retrait sur simple demande",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm">
                  <Icone nom="coche" className="size-5 shrink-0 text-verified" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-soft sm:p-8">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
                <Icone nom="certifie" className="size-4" />
                Fiche technique
              </div>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/70 pb-4">
                  <dt className="text-ink-muted">Source</dt>
                  <dd className="text-right font-semibold text-ink">
                    Répertoire Sirene · INSEE
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/70 pb-4">
                  <dt className="text-ink-muted">Code NAF retenu</dt>
                  <dd className="text-right font-mono font-semibold text-ink">
                    {metier.nafCodes.join(", ")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-b border-slate-200/70 pb-4">
                  <dt className="text-ink-muted">Licence</dt>
                  <dd className="text-right font-semibold text-ink">
                    Licence Ouverte 2.0
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-muted">Couverture</dt>
                  <dd className="text-right font-semibold text-ink">
                    {nombre(stats.communes)} communes
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Conteneur>
      </section>

      {/* Villes les plus pourvues. */}
      <section className="border-b border-hairline/80 bg-slate-50/70 py-20">
        <Conteneur className="flex flex-col items-center">
          <EnTeteSection
            ton="ambre"
            pastille="Forte demande"
            titre="Villes les plus recherchées"
            className="mb-12"
          />
          <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {villes.map((v) => (
              <li key={v.code}>
                <CarteLien
                  href={urlVille(v.slug)}
                  titre={v.nom}
                  detail={comptageMetier(v.nb)}
                />
              </li>
            ))}
          </ul>
        </Conteneur>
      </section>

      {/* Régions. */}
      <section className="border-b border-hairline/80 bg-white py-20">
        <Conteneur className="flex flex-col items-center">
          <EnTeteSection
            ton="bleu"
            pastille="Couverture nationale"
            titre={`Trouver un ${metier.labelSingulier} par région`}
            className="mb-12"
          />
          <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {regions.map((r) => (
              <li key={r.code}>
                <CarteLien
                  href={urlRegion(r.slug)}
                  titre={r.nom}
                  detail={comptageMetier(r.nb)}
                />
              </li>
            ))}
          </ul>
          <Link
            href="/regions"
            className="mt-10 inline-flex items-center gap-1.5 font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            Voir toutes les régions et départements
            <Icone nom="fleche" className="size-4" />
          </Link>
        </Conteneur>
      </section>

      {/* FAQ. */}
      <section className="border-b border-hairline/80 bg-slate-50/70 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 sm:px-6 lg:px-8">
          <EnTeteSection pastille="FAQ" titre="Questions fréquentes" className="mb-10" />
          <div className="flex w-full flex-col gap-3.5">
            <Question titre="D'où proviennent les entreprises listées ?" ouvert>
              De la base Sirene de l&apos;INSEE, qui recense tous les
              établissements immatriculés en France. Nous ne retenons que les
              établissements en activité dont le code d&apos;activité principale
              est {metier.nafCodes.join(", ")} (travaux d&apos;installation
              électrique dans tous locaux). Les entreprises ayant exercé leur
              droit d&apos;opposition auprès de l&apos;INSEE ne sont pas
              affichées.
            </Question>
            <Question titre="Que signifie le label RGE ?">
              Reconnu Garant de l&apos;Environnement. C&apos;est une
              qualification délivrée par un organisme accrédité, obligatoire
              pour que vos travaux ouvrent droit à MaPrimeRénov&apos; ou aux
              certificats d&apos;économies d&apos;énergie (CEE). Nous
              l&apos;indiquons sur chaque fiche concernée.
            </Question>
            <Question titre="Le service est-il payant ?">
              Non. La consultation de l&apos;annuaire et la demande de devis
              sont gratuites et sans engagement.
            </Question>
            <Question
              titre={`Je suis ${metier.labelSingulier}, comment modifier ou retirer ma fiche ?`}
            >
              Rendez-vous sur la page{" "}
              <Link href="/retrait" className="font-semibold text-primary underline">
                retrait d&apos;une fiche
              </Link>
              . Toute demande est traitée sous 30 jours.
            </Question>
          </div>
        </div>
      </section>

      {/* Appel à l'action : le formulaire de devis. */}
      <section id="devis" className="scroll-mt-24 bg-ink py-20">
        <Conteneur className="flex flex-col items-center">
          <Pastille ton="bleu">Gratuit et sans engagement</Pastille>
          <h2 className="mt-4 max-w-3xl text-center font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Recevez jusqu&apos;à 3 devis d&apos;
            {metier.labelPluriel} près de chez vous
          </h2>
          <p className="mt-4 max-w-2xl text-center leading-relaxed text-slate-300">
            Décrivez votre projet en une minute : des professionnels de votre
            secteur vous recontactent directement.
          </p>
          <div className="mt-10 w-full max-w-3xl rounded-2xl border border-hairline bg-white p-5 shadow-float sm:p-8">
            <FormulaireDevis source="accueil" />
          </div>
        </Conteneur>
      </section>
    </>
  );
}
