import Link from "next/link";
import type { ReactNode } from "react";
import { Conteneur, EnTeteSection } from "@/components/Ui";
import { prestationParWorktype } from "@/config/prestations";

/**
 * Pictogrammes propres à cette section.
 *
 * `Icone` sert l'habillage de l'interface : ses tracés viennent de Material
 * Symbols, pleins et compacts, pensés pour des glyphes de 16 à 20 px. Les
 * vignettes d'intervention sont trois fois plus grandes et alignées côte à
 * côte : au trait, elles se lisent mieux et forment une famille homogène. On
 * les garde donc ici, au plus près de leur unique usage, plutôt que de mêler
 * deux styles dans le jeu d'icônes commun.
 */
const PICTOS = {
  prise: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M9.4 11v2.2M14.6 11v2.2" />
    </>
  ),
  tableau: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M3.5 8.6h17M8.2 12.3v4.4M12 12.3v4.4M15.8 12.3v4.4" />
    </>
  ),
  borne: (
    <>
      <rect x="4" y="3.5" width="11.5" height="17" rx="2.5" />
      <path d="M4 8.6h11.5" />
      <path d="M10.9 11.4 8.6 15.3h2l-.5 2.6 2.3-3.9h-2z" />
      <path d="M15.5 12.4h2.6a1.9 1.9 0 0 1 1.9 1.9v2.4a1.5 1.5 0 0 0 3 0v-5.6" />
    </>
  ),
  solaire: (
    <>
      <path d="M7.4 4.5h9.2l3.4 12H4z" />
      <path d="M12 4.5v12M5.6 10.5h12.8" />
      <path d="M12 16.5v3M8.5 19.5h7" />
    </>
  ),
  maison: (
    <>
      <path d="M4 10.4 12 4l8 6.4V20H4z" />
      {/* Onde à deux arcs : un seul arc surmontant un point se lisait comme
          un visage dans la maison. */}
      <path d="M9.6 14.4a3.5 3.5 0 0 1 4.8 0" />
      <path d="M10.9 16.2a1.7 1.7 0 0 1 2.2 0" />
      <path d="M11.95 17.9h.1" />
    </>
  ),
  camera: (
    <>
      <rect x="2.8" y="7.3" width="14" height="9.4" rx="2.6" />
      <circle cx="9.8" cy="12" r="2.3" />
      <path d="M16.8 11.2 21.2 8.6v6.8l-4.4-2.6z" />
    </>
  ),
} as const;

function Picto({ nom }: { nom: keyof typeof PICTOS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-7"
    >
      {PICTOS[nom]}
    </svg>
  );
}

/**
 * Les six interventions mises en avant, désignées par leur identifiant de
 * prestation : intitulés et descriptions viennent du catalogue du formulaire,
 * si bien qu'une carte ne peut pas promettre un travail que la première étape
 * du devis ne proposerait pas.
 */
const MISES_EN_AVANT = [
  { worktype: 218, picto: "prise" },
  { worktype: 219, picto: "tableau" },
  { worktype: 260, picto: "borne" },
  { worktype: 114, picto: "solaire" },
  { worktype: 217, picto: "maison" },
  { worktype: 81, picto: "camera" },
] as const satisfies readonly { worktype: number; picto: keyof typeof PICTOS }[];

function Carte({
  picto,
  titre,
  detail,
}: {
  picto: keyof typeof PICTOS;
  titre: ReactNode;
  detail: ReactNode;
}) {
  return (
    <Link
      href="#devis"
      className="group flex h-full flex-col items-center rounded-2xl border border-hairline bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-sky-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Picto nom={picto} />
      </span>
      <span className="mt-4 font-heading text-[15px] leading-snug font-bold text-ink transition-colors group-hover:text-primary">
        {titre}
      </span>
      <span className="mt-1.5 text-xs leading-relaxed text-ink-muted">
        {detail}
      </span>
    </Link>
  );
}

/** Vitrine des interventions courantes, chaque carte menant au formulaire. */
export function Interventions() {
  return (
    <section className="border-b border-hairline/80 bg-white py-20">
      <Conteneur className="flex flex-col items-center">
        <EnTeteSection
          ton="bleu"
          pastille="Nos services"
          titre="Nos interventions les plus demandées"
          className="mb-4"
        />
        <p className="mb-12 max-w-2xl text-center leading-relaxed">
          Des professionnels disponibles pour chaque urgence comme pour vos
          projets de rénovation.
        </p>
        <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {MISES_EN_AVANT.map(({ worktype, picto }) => {
            const prestation = prestationParWorktype(worktype);
            // Une prestation retirée du catalogue laisserait une carte vide :
            // on la saute plutôt que d'afficher un libellé manquant.
            if (!prestation) return null;
            return (
              <li key={worktype}>
                <Carte
                  picto={picto}
                  titre={prestation.titre}
                  detail={prestation.detail}
                />
              </li>
            );
          })}
        </ul>
      </Conteneur>
    </section>
  );
}
