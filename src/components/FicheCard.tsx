import Link from "next/link";
import { Icone } from "@/components/Icone";
import type { Fiche } from "@/lib/db";
import { rgeDe } from "@/lib/db";
import { anciennete, libelleEffectif, urlFiche } from "@/lib/site";

/** « 814290123 » se lit mal : le Sirene se présente par groupes de trois. */
function sirenLisible(siren: string): string {
  return siren.replace(/(\d{3})(?=\d)/g, "$1 ");
}

export function FicheCard({
  fiche,
  villeSlug,
}: {
  fiche: Fiche;
  villeSlug: string;
}) {
  const rge = rgeDe(fiche);
  const ans = anciennete(fiche.date_creation);
  const effectif = libelleEffectif(fiche.tranche_effectif);

  return (
    <li className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-soft transition-all hover:border-sky-300 hover:shadow-card">
      <div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Actif
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
            <Icone nom="certifie" className="size-3.5" />
            Sirene
          </span>
        </div>

        <h3 className="mt-3 font-heading text-lg leading-snug font-bold text-ink transition-colors group-hover:text-primary">
          <Link href={urlFiche(villeSlug, fiche.slug)}>
            {fiche.enseigne ?? fiche.nom}
          </Link>
        </h3>

        <address className="mt-2 flex items-start gap-1.5 text-xs not-italic text-ink-muted">
          <Icone nom="lieu" className="mt-px size-4 shrink-0 text-slate-400" />
          <span>
            {fiche.adresse}
            {fiche.code_postal ? `, ${fiche.code_postal}` : ""}
          </span>
        </address>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {rge.length > 0 && (
            <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              RGE · {rge.length} qualification{rge.length > 1 ? "s" : ""}
            </span>
          )}
          {ans !== null && ans > 0 && (
            <span className="inline-flex items-center rounded-lg border border-slate-200/70 bg-slate-50 px-2 py-1 text-[11px] text-ink-soft">
              {ans} an{ans > 1 ? "s" : ""} d&apos;activité
            </span>
          )}
          {effectif && (
            <span className="inline-flex items-center rounded-lg border border-slate-200/70 bg-slate-50 px-2 py-1 text-[11px] text-ink-soft">
              {effectif}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
        <span className="font-mono text-[11px] text-slate-400">
          SIREN {sirenLisible(fiche.siren)}
        </span>
        <Link
          href={urlFiche(villeSlug, fiche.slug)}
          className="inline-flex items-center gap-1 font-bold text-primary transition-colors hover:text-primary-hover"
        >
          Voir la fiche
          <Icone
            nom="fleche"
            className="size-4 transition-transform group-hover:translate-x-1"
          />
        </Link>
      </div>
    </li>
  );
}
