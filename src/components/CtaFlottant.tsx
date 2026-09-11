"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icone } from "@/components/Icone";

/**
 * Les pages qui embarquent leur propre section `#devis` : l'accueil, les pages
 * commune (`/electricien/<ville>`) et les fiches entreprise
 * (`/electricien/<ville>/<fiche>`).
 *
 * Les pages région et département ne listent que des zones, sans formulaire —
 * tout comme /regions et les pages légales. On y renvoie vers l'accueil.
 *
 * Ce test se fait sur le chemin plutôt que sur la présence de `#devis` dans le
 * DOM : la cible est ainsi connue dès le rendu serveur, sans écart
 * d'hydratation. Si un gabarit venait à perdre sa section, le pire cas reste un
 * renvoi vers le formulaire de l'accueil.
 */
function aFormulaire(chemin: string): boolean {
  if (chemin === "/") return true;
  if (!chemin.startsWith("/electricien/")) return false;
  return !/^\/electricien\/(region|departement)\//.test(chemin);
}

/**
 * Bouton de devis flottant, présent sur toutes les pages.
 *
 * Il s'efface lorsque le formulaire est à l'écran : un bouton fixe posé sur le
 * formulaire qu'il vise recouvrirait les champs au mobile, là où se trouve
 * l'essentiel du trafic.
 */
export function CtaFlottant() {
  const chemin = usePathname();
  const local = aFormulaire(chemin);
  const [surFormulaire, setSurFormulaire] = useState(false);

  // Sur une page sans formulaire, l'observateur ne tourne pas : on ignore la
  // dernière valeur observée, qui daterait de la page précédente.
  const masque = local && surFormulaire;

  useEffect(() => {
    if (!local) return;
    const section = document.getElementById("devis");
    if (!section) return;

    // La marge haute compense l'en-tête collant (h-20) : la section n'est
    // considérée visible qu'une fois sortie de dessous le bandeau.
    // `observe()` déclenche immédiatement le rappel, ce qui réinitialise l'état
    // à chaque changement de page.
    const observateur = new IntersectionObserver(
      ([entree]) => setSurFormulaire(entree.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observateur.observe(section);
    return () => observateur.disconnect();
  }, [local, chemin]);

  return (
    <Link
      href={local ? "#devis" : "/#devis"}
      aria-hidden={masque}
      tabIndex={masque ? -1 : undefined}
      className={`fixed right-4 bottom-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-5 text-sm font-bold text-white shadow-xl shadow-sky-500/30 transition-all duration-300 hover:from-sky-600 hover:to-cyan-600 hover:shadow-2xl hover:shadow-sky-500/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 motion-reduce:transition-none sm:right-8 sm:bottom-8 sm:px-6 print:hidden ${
        masque
          ? "pointer-events-none translate-y-24 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <Icone nom="eclair" className="size-5" />
      <span className="sm:hidden">Devis gratuit</span>
      <span className="hidden sm:inline">Demander un devis gratuit</span>
    </Link>
  );
}
