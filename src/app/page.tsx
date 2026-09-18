import Image from "next/image";
import Link from "next/link";
import heroElectricien from "@/assets/hero-electricien.jpg";
import parcoursConfiance from "@/assets/parcours-devis-confiance.jpg";
import parcoursDevis from "@/assets/parcours-devis.jpg";
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
      {/* Héros : photo pleine largeur en fond, voiles blancs dégradés pour
          garder le texte lisible et fondre la section dans le bloc suivant. */}
      <section className="relative isolate overflow-hidden border-b border-hairline/60 bg-gradient-to-b from-sky-50 via-white to-surface py-16 lg:py-24">
        {/* La photo est un panorama 2,5:1 : sous 1280 px le cadre est trop
            étroit pour la montrer en entier, on recentre donc le recadrage sur
            la carte de France (zone claire et reconnaissable) plutôt que sur un
            morceau de ciel. Au-delà, le centrage rend l'électricien à gauche et
            la carte à droite, de part et d'autre du texte. */}
        <Image
          src={heroElectricien}
          alt=""
          aria-hidden
          fill
          preload
          sizes="100vw"
          placeholder="blur"
          className="-z-20 object-cover object-[78%_center] xl:object-center"
        />

        {/* Voile vertical : opaque sous le header collant, transparent au
            milieu pour laisser voir la photo, blanc en bas pour rejoindre la
            section suivante. Plus léger à mesure que l'écran s'élargit. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white/85 via-white/45 to-white lg:from-white/75 lg:via-white/32"
        />
        {/* Halo radial centré sur la colonne de texte : assure le contraste du
            titre là où le voile est le plus fin. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_44%_at_50%_36%,rgba(255,255,255,0.72),rgba(255,255,255,0)_72%)]"
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

          {/*
            Le parcours en trois temps — le doute, la recherche, le résultat —
            sous le formulaire : le rappel de ce à quoi il sert, pour qui
            hésite encore une fois le formulaire parcouru.

            La bande est un panoramique 2,5:1 dont tous les textes sont
            incrustés. Sous 1024 px elle retomberait à ~140 px de haut et
            deviendrait illisible : on n'y garde alors que le dernier volet,
            celui qui rassure. Les deux images restent en chargement paresseux
            (défaut de next/image), donc le navigateur ne télécharge que celle
            qui s'affiche.
          */}
          <div className="mt-10 w-full max-w-6xl">
            <Image
              src={parcoursConfiance}
              alt="Un électricien au travail sur un tableau : professionnels vérifiés, devis rapides, travaux de qualité, en toute confiance — vos travaux entre de bonnes mains."
              sizes="448px"
              className="mx-auto h-auto w-full max-w-md rounded-2xl ring-1 ring-white/10 lg:hidden"
            />
            <Image
              src={parcoursDevis}
              alt="Trois étapes : trop de questions et de temps perdu pour trouver un artisan, une recherche rapide et simple sur Vite un électricien, puis des travaux confiés à des professionnels vérifiés."
              sizes="1152px"
              className="hidden h-auto w-full rounded-2xl ring-1 ring-white/10 lg:block"
            />
          </div>
        </Conteneur>
      </section>
    </>
  );
}
