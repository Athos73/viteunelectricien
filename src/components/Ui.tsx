import Link from "next/link";
import type { ReactNode } from "react";
import { Icone } from "@/components/Icone";

/**
 * Le layout est pleine largeur pour laisser les héros déborder : chaque
 * section pose donc elle-même sa gouttière.
 */
export function Conteneur({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

const TONS = {
  bleu: "bg-sky-100/80 border-sky-200 text-sky-800",
  ambre: "bg-amber-50 border-amber-200/70 text-amber-700",
  blanc: "bg-white border-hairline text-ink-soft",
} as const;

export function Pastille({
  children,
  ton = "blanc",
}: {
  children: ReactNode;
  ton?: keyof typeof TONS;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wider uppercase shadow-sm ${TONS[ton]}`}
    >
      {children}
    </span>
  );
}

/** Pastille + titre + barre bleue : l'en-tête répété à chaque section. */
export function EnTeteSection({
  pastille,
  ton,
  titre,
  className = "",
}: {
  pastille?: ReactNode;
  ton?: keyof typeof TONS;
  titre: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      {pastille && <Pastille ton={ton}>{pastille}</Pastille>}
      <h2 className="mt-3 text-center font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
        {titre}
      </h2>
      <div className="mt-3 h-1 w-12 rounded-full bg-primary" />
    </div>
  );
}

/** Carte-lien « nom + détail + chevron » : villes, départements, régions. */
export function CarteLien({
  href,
  titre,
  detail,
}: {
  href: string;
  titre: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-hairline bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
    >
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-heading text-[15px] font-semibold text-ink transition-colors group-hover:text-primary">
          {titre}
        </span>
        {detail && <span className="mt-0.5 text-xs text-ink-muted">{detail}</span>}
      </span>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-sky-50">
        <Icone
          nom="chevron"
          className="size-[18px] text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </span>
    </Link>
  );
}

/**
 * Bandeau de tête des pages de zone (région, département, commune, fiche).
 * Même dégradé et même halo que l'accueil, en version compacte.
 */
export function HeroZone({
  fil,
  pastille,
  titre,
  children,
}: {
  fil?: ReactNode;
  pastille?: ReactNode;
  titre: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-hairline/60 bg-gradient-to-b from-sky-50 via-white to-surface py-10 lg:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-1/4 size-80 rounded-full bg-sky-200/40 blur-3xl"
      />
      <Conteneur className="relative z-10">
        {fil}
        {pastille && (
          <div className="mt-5">
            <Pastille ton="bleu">{pastille}</Pastille>
          </div>
        )}
        <h1 className="mt-4 max-w-4xl font-heading text-3xl leading-tight font-extrabold tracking-tight text-ink sm:text-4xl lg:text-5xl">
          {titre}
        </h1>
        {children}
      </Conteneur>
    </section>
  );
}

/** Bloc de chiffres clés sous un titre de page. */
export function Chiffres({
  items,
}: {
  items: { valeur: ReactNode; libelle: string; accent?: boolean }[];
}) {
  return (
    // Les classes doivent être littérales : Tailwind scanne le source, il ne
    // verrait pas un `sm:grid-cols-${n}` construit à l'exécution.
    <dl
      className={`mt-8 grid max-w-2xl grid-cols-1 divide-y divide-slate-100 rounded-2xl border border-hairline bg-white/80 p-5 shadow-soft backdrop-blur-sm sm:divide-x sm:divide-y-0 ${
        items.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
      }`}
    >
      {items.map((it) => (
        <div
          key={it.libelle}
          className="flex flex-col pt-3 first:pt-0 sm:px-5 sm:pt-0 sm:first:pl-0"
        >
          <dt className="order-2 mt-1 text-xs font-medium tracking-wider text-ink-muted uppercase">
            {it.libelle}
          </dt>
          <dd
            className={`order-1 font-heading text-2xl font-extrabold tracking-tight ${it.accent ? "text-primary" : "text-ink"}`}
          >
            {it.valeur}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Question/réponse dépliable, conforme au balisage attendu par les moteurs. */
export function Question({
  titre,
  children,
  ouvert = false,
}: {
  titre: ReactNode;
  children: ReactNode;
  ouvert?: boolean;
}) {
  return (
    <details
      open={ouvert}
      className="group overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 select-none sm:p-6">
        <span className="font-heading text-base font-semibold text-ink transition-colors group-hover:text-primary sm:text-lg">
          {titre}
        </span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-all group-open:bg-sky-50 group-open:text-primary">
          <Icone
            nom="deplier"
            className="size-5 transition-transform duration-200 group-open:rotate-180"
          />
        </span>
      </summary>
      <div className="border-t border-slate-100 px-5 pt-4 pb-6 text-sm leading-relaxed text-ink-soft sm:px-6 sm:text-base">
        {children}
      </div>
    </details>
  );
}
