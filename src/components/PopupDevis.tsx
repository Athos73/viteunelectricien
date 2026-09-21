"use client";

import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { metier } from "@/config/metier";

/**
 * Délai avant l'ouverture. Le popup doit arriver « dans la seconde », mais pas
 * pendant le premier rendu : une modale qui s'affiche avant que la page soit
 * peinte donne l'impression d'un écran de chargement, et Chrome la compte dans
 * le plus grand élément affiché (LCP).
 */
const DELAI_MS = 900;

/**
 * Une fois la modale écartée, on ne la remontre pas de la visite. Sans cela un
 * retour à l'accueil depuis une page commune - une navigation client, donc un
 * remontage du composant - la rouvrirait à chaque fois.
 *
 * Stockage de session : l'oubli au prochain passage est volontaire.
 */
const CLE_SESSION = "popup-devis-vu";

/**
 * Modale d'accroche de l'accueil : elle propose la comparaison de trois devis
 * et renvoie vers le formulaire déjà présent en bas de page (`#devis`).
 *
 * Elle s'appuie sur `<dialog>` natif plutôt que sur un `<div>` en position
 * fixe : le navigateur fournit alors le piège de focus, la fermeture par
 * Échap, l'inertie du reste de la page pour les lecteurs d'écran et le rendu
 * au-dessus de l'en-tête collant, sans une ligne de JavaScript de notre part.
 */
export function PopupDevis() {
  const [ouvert, setOuvert] = useState(false);
  const dialogue = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    // `sessionStorage` lève en navigation privée sur certains navigateurs et
    // lorsque les cookies tiers sont bloqués : l'accès est donc gardé, et en
    // cas d'échec le popup s'affiche simplement comme au premier passage.
    try {
      if (sessionStorage.getItem(CLE_SESSION)) return;
    } catch {}

    const minuterie = setTimeout(() => setOuvert(true), DELAI_MS);
    return () => clearTimeout(minuterie);
  }, []);

  // `showModal()` ne peut pas être appelé au rendu : l'élément doit déjà être
  // dans le document. Le verrou de défilement accompagne l'ouverture, `<dialog>`
  // ne figeant pas le fond de lui-même.
  useEffect(() => {
    if (!ouvert) return;
    dialogue.current?.showModal();
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [ouvert]);

  // Tous les chemins de fermeture - croix, « non merci », appel à l'action,
  // touche Échap - passent par `close()`, donc par `onClose` : c'est là que se
  // note la visite, et non dans les gestionnaires de clic qu'Échap contourne.
  function surFermeture() {
    try {
      sessionStorage.setItem(CLE_SESSION, "1");
    } catch {}
    setOuvert(false);
  }

  function fermer() {
    dialogue.current?.close();
  }

  if (!ouvert) return null;

  return (
    <dialog
      ref={dialogue}
      aria-labelledby="popup-devis-titre"
      onClose={surFermeture}
      className="m-auto w-[calc(100%-2rem)] max-w-3xl overflow-visible rounded-3xl bg-transparent p-0 shadow-float backdrop:bg-ink/70 backdrop:backdrop-blur-[2px] open:animate-[popup-entree_0.28s_cubic-bezier(0.16,1,0.3,1)] motion-reduce:open:animate-none"
    >
      <div className="relative grid overflow-hidden rounded-3xl bg-white sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Volet de gauche : le chiffre porte la promesse à lui seul. Masqué
            sous 640 px, où il mangerait la hauteur utile - le titre le répète. */}
        <div className="relative hidden flex-col justify-center overflow-hidden bg-gradient-to-br from-sky-500 via-primary to-sky-700 p-8 sm:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -left-10 size-44 rounded-full border-[14px] border-white/15"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -bottom-16 size-52 rounded-full bg-white/10"
          />
          <p className="relative font-heading text-[5.5rem] leading-none font-extrabold text-amber-300 drop-shadow-sm">
            3
          </p>
          <p className="relative mt-3 font-heading text-lg leading-snug font-bold text-white">
            devis d&apos;{metier.labelPluriel} locaux
          </p>
        </div>

        {/* Volet de droite : l'argumentaire et l'appel à l'action. */}
        <div className="p-6 sm:p-9">
          {/* La réserve à droite tient le bouton de fermeture à l'écart : sous
              640 px la pastille occupe sinon toute la ligne et passe dessous. */}
          <div className="pr-12 sm:pr-0">
            <span className="inline-flex items-center rounded-full bg-sky-100/80 px-3.5 py-1.5 text-[11px] font-semibold tracking-wider text-sky-800 uppercase sm:text-xs">
              Votre installation, en toute sécurité
            </span>
          </div>

          <h2
            id="popup-devis-titre"
            className="mt-4 font-heading text-2xl leading-tight font-extrabold tracking-tight text-ink sm:text-3xl"
          >
            Vous voulez comparer gratuitement{" "}
            <span className="text-primary">3 devis</span> ?
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">
            Mise aux normes, installation ou dépannage : présentez votre projet
            et comparez les offres d&apos;{metier.labelPluriel} proches de chez
            vous.
          </p>

          <ul className="mt-5 space-y-2.5 text-sm font-semibold text-ink sm:text-[15px]">
            {[
              "Gratuit et sans engagement",
              "Réponse rapide, généralement sous 48\u00a0h",
              "Comparez les prix avant de choisir",
            ].map((argument) => (
              <li key={argument} className="flex items-start gap-2.5">
                <Icone
                  nom="coche"
                  className="mt-px size-5 shrink-0 text-verified"
                />
                {argument}
              </li>
            ))}
          </ul>

          {/* Le formulaire est déjà dans la page : l'ancre suffit, et le lien
              reste fonctionnel si le JavaScript n'a pas pris la main. */}
          <a
            href="#devis"
            onClick={fermer}
            className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-6 text-center font-heading text-base font-bold text-ink shadow-lg shadow-amber-400/30 transition-all hover:-translate-y-0.5 hover:bg-amber-300 hover:shadow-xl hover:shadow-amber-400/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 motion-reduce:transition-none"
          >
            Oui, je compare les devis
            <Icone nom="fleche" className="size-5" />
          </a>

          <button
            type="button"
            onClick={fermer}
            className="mx-auto mt-4 block text-sm font-medium text-ink-muted underline underline-offset-4 transition-colors hover:text-ink-soft"
          >
            Non merci, je continue ma visite
          </button>
        </div>

        <button
          type="button"
          onClick={fermer}
          aria-label="Fermer"
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full border border-hairline bg-white text-ink-muted shadow-sm transition-colors hover:border-primary/40 hover:text-primary sm:top-4 sm:right-4"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </dialog>
  );
}
