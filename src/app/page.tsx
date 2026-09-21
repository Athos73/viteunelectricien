import Image from "next/image";
import Link from "next/link";
import heroElectricien from "@/assets/hero-electricien.jpg";
import parcoursConfiance from "@/assets/parcours-devis-confiance.jpg";
import parcoursDevis from "@/assets/parcours-devis.jpg";
import { Faq } from "@/components/Faq";
import { FormulaireDevis } from "@/components/FormulaireDevis";
import { Icone } from "@/components/Icone";
import { Interventions } from "@/components/Interventions";
import { PopupDevis } from "@/components/PopupDevis";
import { PrixIndicatifs } from "@/components/PrixIndicatifs";
import { Recherche } from "@/components/Recherche";
import {
  CarteLien,
  Conteneur,
  EnTeteSection,
  Pastille,
} from "@/components/Ui";
import { metier } from "@/config/metier";
import { statsGlobales, topCommunes, toutesRegions } from "@/lib/db";
import { absolu, nombre, urlRegion, urlVille } from "@/lib/site";
import { comptageMetier } from "@/lib/texte";

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
      {/* Accroche d'ouverture : proposée une fois par visite, elle renvoie
          vers le formulaire de la section #devis en bas de page. */}
      <PopupDevis />

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
          {/* Les étoiles sont décoratives : la note et la mention portent le
              sens, et se lisent seules au lecteur d'écran. */}
          <p className="inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-hairline bg-white/70 px-4 py-2 shadow-soft backdrop-blur-sm">
            <span aria-hidden className="flex items-center gap-0.5 text-amber-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <Icone key={i} nom="etoile" className="size-[18px]" />
              ))}
            </span>
            <span className="font-heading text-sm font-extrabold tracking-tight text-ink">
              4.9/5
            </span>
            <span className="text-sm text-ink-soft">
              Recommandé par nos clients
            </span>
          </p>

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

      <Interventions />

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

      <Faq />

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
            Le parcours en trois temps - le doute, la recherche, le résultat -
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
              alt="Un électricien au travail sur un tableau : professionnels vérifiés, devis rapides, travaux de qualité, en toute confiance - vos travaux entre de bonnes mains."
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

      <PrixIndicatifs />
    </>
  );
}
