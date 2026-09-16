"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { PRESTATIONS } from "@/config/prestations";
import {
  BUDGETS,
  CIVILITES,
  DELAIS,
  ETAPES,
  LOGEMENTS,
  OCCUPATIONS,
  demandeVide,
  validerEtape,
  type ChampDevis,
  type DemandeDevis,
  type Erreurs,
} from "@/lib/devis";

/**
 * Formulaire d'acquisition de devis, en remplacement du widget en marque
 * blanche d'un tiers.
 *
 * Il collecte exactement les champs de `RequestVO` (API HelloArtisan) et les
 * poste sur `/api/devis`, qui porte les identifiants et effectue l'import. La
 * découpe en quatre écrans n'est pas cosmétique : le champ le plus engageant
 * (le type de travaux) ouvre la saisie, les coordonnées — le point de friction —
 * ne sont demandées qu'en dernier, une fois le visiteur investi.
 */

type Props = {
  /** Page d'origine, transmise à n8n pour le suivi d'acquisition. */
  source: string;
  /** Commune de la page courante : pré-remplit la localisation. */
  ville?: { nom: string; codePostal: string };
};

export function FormulaireDevis({ source, ville }: Props) {
  const [donnees, setDonnees] = useState<DemandeDevis>(() => ({
    ...demandeVide(source),
    zipcode: ville?.codePostal ?? "",
    city: ville?.nom ?? "",
  }));
  const [etape, setEtape] = useState(0);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [etat, setEtat] = useState<"saisie" | "envoi" | "succes">("saisie");
  const [messageServeur, setMessageServeur] = useState<string | null>(null);
  const titreRef = useRef<HTMLParagraphElement>(null);
  const premierRendu = useRef(true);

  // À chaque changement d'écran, le focus revient sur le titre de l'étape :
  // sans cela un lecteur d'écran resterait sur un bouton qui vient de
  // disparaître, et le clavier repartirait du haut de la page.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    titreRef.current?.focus();
  }, [etape, etat]);

  const modifier = <C extends ChampDevis>(champ: C, valeur: DemandeDevis[C]) => {
    setDonnees((d) => ({ ...d, [champ]: valeur }));
    setErreurs((e) => {
      if (!(champ in e)) return e;
      const reste = { ...e };
      delete reste[champ];
      return reste;
    });
    setMessageServeur(null);
  };

  const avancer = () => {
    const trouvees = validerEtape(donnees, etape);
    setErreurs(trouvees);
    if (Object.keys(trouvees).length > 0) return;
    if (etape < ETAPES.length - 1) setEtape(etape + 1);
    else void envoyer();
  };

  async function envoyer() {
    setEtat("envoi");
    setMessageServeur(null);
    try {
      const reponse = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donnees),
      });
      const resultat = (await reponse.json()) as {
        ok: boolean;
        message?: string;
        erreurs?: Erreurs;
      };

      if (resultat.ok) {
        setEtat("succes");
        return;
      }

      setEtat("saisie");
      if (resultat.erreurs && Object.keys(resultat.erreurs).length > 0) {
        setErreurs(resultat.erreurs);
        // Le serveur revalide l'ensemble : l'erreur peut concerner un écran
        // précédent, on y ramène le visiteur plutôt que d'afficher un message
        // qui désignerait un champ invisible.
        const premiere = ETAPES.findIndex((e) =>
          e.champs.some((c) => c in resultat.erreurs!),
        );
        if (premiere >= 0) setEtape(premiere);
      }
      setMessageServeur(
        resultat.message ?? "Votre demande n'a pas pu être transmise.",
      );
    } catch {
      setEtat("saisie");
      setMessageServeur(
        "La connexion a été interrompue. Vérifiez votre réseau et réessayez.",
      );
    }
  }

  if (etat === "succes") return <Succes ref={titreRef} />;

  const derniere = etape === ETAPES.length - 1;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        avancer();
      }}
    >
      <Progression etape={etape} ref={titreRef} />

      <div className="mt-6">
        {etape === 0 && (
          <EtapePrestation
            valeur={donnees.worktype}
            erreur={erreurs.worktype}
            choisir={(worktype) => {
              // Sélection et passage à l'écran suivant d'un seul geste : cette
              // étape n'a qu'une question, un bouton « Continuer » n'y
              // ajouterait qu'un clic.
              setDonnees((d) => ({ ...d, worktype }));
              setErreurs({});
              setEtape(1);
            }}
          />
        )}

        {etape === 1 && (
          <div className="space-y-7">
            <ChoixUnique
              legende="Vous êtes"
              options={OCCUPATIONS}
              valeur={donnees.isowner}
              erreur={erreurs.isowner}
              choisir={(v) => modifier("isowner", v)}
            />
            <ChoixUnique
              legende="Type de logement"
              options={LOGEMENTS}
              valeur={donnees.housingtype}
              erreur={erreurs.housingtype}
              choisir={(v) => modifier("housingtype", v)}
            />
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-7">
            <ChoixUnique
              legende="Quand souhaitez-vous démarrer ?"
              options={DELAIS}
              valeur={donnees.delay}
              erreur={erreurs.delay}
              choisir={(v) => modifier("delay", v)}
            />
            <ChoixUnique
              legende="Budget envisagé"
              options={BUDGETS}
              valeur={donnees.budget}
              erreur={erreurs.budget}
              choisir={(v) => modifier("budget", v)}
            />
            <div>
              <label
                htmlFor="devis-comment"
                className="block font-heading text-sm font-bold text-ink"
              >
                Décrivez votre projet{" "}
                <span className="font-sans font-normal text-ink-muted">
                  (facultatif)
                </span>
              </label>
              <p className="mt-1 text-xs text-ink-muted">
                Surface, nombre de pièces, contraintes d&apos;accès : plus vous
                êtes précis, plus les devis reçus seront justes.
              </p>
              <textarea
                id="devis-comment"
                rows={4}
                maxLength={2000}
                value={donnees.comment}
                onChange={(e) => modifier("comment", e.target.value)}
                placeholder="Ex : remplacement du tableau électrique et mise aux normes d'un appartement de 60 m², années 1970."
                className="mt-3 w-full rounded-xl border border-hairline bg-white p-3.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
          </div>
        )}

        {etape === 3 && (
          <EtapeCoordonnees
            donnees={donnees}
            erreurs={erreurs}
            modifier={modifier}
          />
        )}
      </div>

      {messageServeur && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800"
        >
          {messageServeur}
        </p>
      )}

      {/* Le leurre est retiré du flux et du parcours clavier, mais reste
          remplissable par un robot qui parcourt le DOM. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="devis-societe">Société</label>
        <input
          id="devis-societe"
          name="societe"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={donnees.piege}
          onChange={(e) => modifier("piege", e.target.value)}
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {etape > 0 ? (
          <button
            type="button"
            onClick={() => setEtape(etape - 1)}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-ink-soft transition-colors hover:text-primary"
          >
            <Icone nom="chevron" className="size-4 rotate-180" />
            Retour
          </button>
        ) : (
          <span className="hidden sm:block" />
        )}

        {etape > 0 && (
          <button
            type="submit"
            disabled={etat === "envoi"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-7 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-sky-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
          >
            {etat === "envoi" ? (
              "Envoi en cours…"
            ) : derniere ? (
              <>
                Recevoir mes devis
                <Icone nom="fleche" className="size-4" />
              </>
            ) : (
              <>
                Continuer
                <Icone nom="fleche" className="size-4" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

function Progression({
  etape,
  ref,
}: {
  etape: number;
  ref: React.Ref<HTMLParagraphElement>;
}) {
  const pourcent = ((etape + 1) / ETAPES.length) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p
          ref={ref}
          tabIndex={-1}
          className="font-heading text-lg font-bold tracking-tight text-ink outline-none sm:text-xl"
        >
          {ETAPES[etape].titre}
        </p>
        <p className="shrink-0 text-xs font-semibold tracking-wider text-ink-muted uppercase">
          Étape {etape + 1} / {ETAPES.length}
        </p>
      </div>
      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={etape + 1}
        aria-valuemin={1}
        aria-valuemax={ETAPES.length}
        aria-label="Avancement du formulaire"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${pourcent}%` }}
        />
      </div>
    </div>
  );
}

function EtapePrestation({
  valeur,
  erreur,
  choisir,
}: {
  valeur: number | null;
  erreur?: string;
  choisir: (worktype: number) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Type de travaux</legend>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PRESTATIONS.map((p) => (
          <li key={p.worktype}>
            <button
              type="button"
              aria-pressed={valeur === p.worktype}
              onClick={() => choisir(p.worktype)}
              className={`group flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card ${
                valeur === p.worktype
                  ? "border-primary bg-primary-light"
                  : "border-hairline bg-white"
              }`}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-heading text-[15px] font-semibold text-ink transition-colors group-hover:text-primary">
                  {p.titre}
                </span>
                <span className="mt-0.5 text-xs text-ink-muted">{p.detail}</span>
              </span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition-colors group-hover:bg-sky-50">
                <Icone
                  nom="chevron"
                  className="size-[18px] text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {erreur && <Erreur message={erreur} />}
    </fieldset>
  );
}

function ChoixUnique<V extends number>({
  legende,
  options,
  valeur,
  erreur,
  choisir,
}: {
  legende: string;
  options: readonly { valeur: V; label: string }[];
  valeur: number | null;
  erreur?: string;
  choisir: (valeur: V) => void;
}) {
  return (
    <fieldset>
      <legend className="font-heading text-sm font-bold text-ink">
        {legende}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {options.map((o) => (
          <button
            key={o.valeur}
            type="button"
            aria-pressed={valeur === o.valeur}
            onClick={() => choisir(o.valeur)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
              valeur === o.valeur
                ? "border-primary bg-primary-light text-primary shadow-sm"
                : "border-hairline bg-white text-ink-soft hover:border-primary/40 hover:text-primary"
            }`}
          >
            {valeur === o.valeur && <Icone nom="coche" className="size-4" />}
            {o.label}
          </button>
        ))}
      </div>
      {erreur && <Erreur message={erreur} />}
    </fieldset>
  );
}

function EtapeCoordonnees({
  donnees,
  erreurs,
  modifier,
}: {
  donnees: DemandeDevis;
  erreurs: Erreurs;
  modifier: <C extends ChampDevis>(champ: C, valeur: DemandeDevis[C]) => void;
}) {
  const idConsentement = useId();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2.5">
        {CIVILITES.map((c) => (
          <button
            key={c.valeur}
            type="button"
            aria-pressed={donnees.civility === c.valeur}
            onClick={() => modifier("civility", c.valeur)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              donnees.civility === c.valeur
                ? "border-primary bg-primary-light text-primary shadow-sm"
                : "border-hairline bg-white text-ink-soft hover:border-primary/40 hover:text-primary"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Champ
          nom="firstname"
          label="Prénom"
          autoComplete="given-name"
          donnees={donnees}
          erreurs={erreurs}
          modifier={modifier}
        />
        <Champ
          nom="lastname"
          label="Nom"
          requis
          autoComplete="family-name"
          donnees={donnees}
          erreurs={erreurs}
          modifier={modifier}
        />
        <Champ
          nom="email"
          label="E-mail"
          type="email"
          requis
          autoComplete="email"
          donnees={donnees}
          erreurs={erreurs}
          modifier={modifier}
        />
        <Champ
          nom="telephone"
          label="Téléphone"
          type="tel"
          requis
          autoComplete="tel"
          aide="Les artisans vous appellent sur ce numéro."
          donnees={donnees}
          erreurs={erreurs}
          modifier={modifier}
        />
        <Champ
          nom="zipcode"
          label="Code postal"
          requis
          inputMode="numeric"
          maxLength={5}
          autoComplete="postal-code"
          donnees={donnees}
          erreurs={erreurs}
          modifier={modifier}
        />
        <Champ
          nom="city"
          label="Ville"
          autoComplete="address-level2"
          donnees={donnees}
          erreurs={erreurs}
          modifier={modifier}
        />
      </div>

      <Champ
        nom="address"
        label="Adresse du chantier"
        autoComplete="street-address"
        aide="Facultative, mais elle évite un aller-retour avec l'artisan."
        donnees={donnees}
        erreurs={erreurs}
        modifier={modifier}
      />

      <div className="rounded-xl border border-hairline bg-surface p-4">
        <div className="flex items-start gap-3">
          <input
            id={idConsentement}
            type="checkbox"
            checked={donnees.consentement}
            onChange={(e) => modifier("consentement", e.target.checked)}
            aria-invalid={erreurs.consentement ? true : undefined}
            className="mt-0.5 size-4.5 shrink-0 rounded border-hairline text-primary focus:ring-2 focus:ring-primary/30"
          />
          <label htmlFor={idConsentement} className="text-xs leading-relaxed">
            J&apos;accepte que mes coordonnées soient transmises à notre
            partenaire HelloArtisan et aux professionnels de mon secteur, aux
            seules fins d&apos;établir les devis demandés. Je peux en demander
            la suppression à tout moment.
          </label>
        </div>
        {erreurs.consentement && <Erreur message={erreurs.consentement} />}
      </div>
    </div>
  );
}

type ChampTexte = Extract<
  ChampDevis,
  "firstname" | "lastname" | "email" | "telephone" | "zipcode" | "city" | "address"
>;

function Champ({
  nom,
  label,
  donnees,
  erreurs,
  modifier,
  type = "text",
  requis = false,
  aide,
  ...reste
}: {
  nom: ChampTexte;
  label: string;
  donnees: DemandeDevis;
  erreurs: Erreurs;
  modifier: <C extends ChampDevis>(champ: C, valeur: DemandeDevis[C]) => void;
  type?: string;
  requis?: boolean;
  aide?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const id = `devis-${nom}`;
  const idAide = `${id}-aide`;
  const erreur = erreurs[nom];

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {!requis && (
          <span className="ml-1 text-xs font-normal text-ink-muted">
            (facultatif)
          </span>
        )}
      </label>
      <input
        {...reste}
        id={id}
        type={type}
        value={donnees[nom]}
        onChange={(e) => modifier(nom, e.target.value)}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur || aide ? idAide : undefined}
        className={`mt-1.5 h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-ink placeholder:text-ink-muted focus:ring-2 focus:outline-none ${
          erreur
            ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/20"
            : "border-hairline focus:border-primary focus:ring-primary/20"
        }`}
      />
      {erreur ? (
        <Erreur message={erreur} id={idAide} />
      ) : (
        aide && (
          <p id={idAide} className="mt-1.5 text-xs text-ink-muted">
            {aide}
          </p>
        )
      )}
    </div>
  );
}

function Erreur({ message, id }: { message: string; id?: string }) {
  return (
    <p id={id} role="alert" className="mt-2 text-xs font-medium text-amber-700">
      {message}
    </p>
  );
}

function Succes({ ref }: { ref: React.Ref<HTMLParagraphElement> }) {
  return (
    <div className="py-6 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-verified-surface text-verified">
        <Icone nom="coche" className="size-8" />
      </span>
      <p
        ref={ref}
        tabIndex={-1}
        className="mt-5 font-heading text-xl font-bold tracking-tight text-ink outline-none sm:text-2xl"
      >
        Votre demande est partie
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed">
        Des professionnels de votre secteur vont étudier votre projet et vous
        recontacter, généralement sous 48 heures. La démarche reste gratuite et
        sans engagement : vous choisissez librement le devis qui vous convient.
      </p>
    </div>
  );
}
