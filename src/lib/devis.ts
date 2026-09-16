import { prestationParWorktype } from "@/config/prestations";

/**
 * Contrat du formulaire de devis, partagé par le composant client et la route
 * `/api/devis`. Aucun secret ici : ce module est bundlé côté navigateur.
 *
 * Les listes de valeurs reproduisent les énumérations de `RequestVO`
 * (OpenAPI HelloArtisan). Elles sont volontairement co-localisées avec leur
 * libellé français : la plateforme n'accepte que l'entier, c'est donc à nous de
 * porter le texte affiché.
 */

export const CIVILITES = [
  { valeur: "M", label: "Monsieur" },
  { valeur: "Mme", label: "Madame" },
] as const;

export const OCCUPATIONS = [
  { valeur: 1, label: "Propriétaire" },
  { valeur: 2, label: "Locataire" },
  { valeur: 3, label: "Propriétaire bailleur" },
  { valeur: 4, label: "Autre" },
] as const;

export const LOGEMENTS = [
  { valeur: 1, label: "Maison" },
  { valeur: 2, label: "Appartement" },
  { valeur: 3, label: "Local professionnel" },
  { valeur: 4, label: "Autre" },
] as const;

export const DELAIS = [
  { valeur: 1, label: "Dès que possible" },
  { valeur: 2, label: "Sous 1 mois" },
  { valeur: 3, label: "Sous 3 mois" },
  { valeur: 4, label: "Dans 3 à 6 mois" },
  { valeur: 5, label: "Plus de 6 mois" },
] as const;

export const BUDGETS = [
  { valeur: 1, label: "Moins de 1 500 €" },
  { valeur: 2, label: "1 500 à 6 000 €" },
  { valeur: 3, label: "Plus de 6 000 €" },
  { valeur: 4, label: "Je ne sais pas encore" },
] as const;

export type Civilite = (typeof CIVILITES)[number]["valeur"];

export type DemandeDevis = {
  worktype: number | null;
  isowner: number | null;
  housingtype: number | null;
  delay: number | null;
  budget: number | null;
  comment: string;
  civility: Civilite | null;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  zipcode: string;
  city: string;
  address: string;
  consentement: boolean;
  /** Page d'origine de la demande : sert au suivi d'acquisition côté n8n. */
  source: string;
  /**
   * Leurre anti-robot : un champ caché qu'aucun humain ne remplit. Les
   * soumissions qui le renseignent sont acceptées en apparence puis jetées.
   */
  piege: string;
  /** Horodatage d'affichage du formulaire, pour écarter les envois instantanés. */
  ouvertureMs: number;
};

export const demandeVide = (source: string): DemandeDevis => ({
  worktype: null,
  isowner: null,
  housingtype: null,
  delay: null,
  budget: null,
  comment: "",
  civility: null,
  firstname: "",
  lastname: "",
  email: "",
  telephone: "",
  zipcode: "",
  city: "",
  address: "",
  consentement: false,
  source,
  piege: "",
  ouvertureMs: Date.now(),
});

/**
 * Code postal : le motif est repris à l'identique de l'OpenAPI HelloArtisan.
 * Il couvre la métropole et la Corse, mais **exclut les DOM** (97xxx, 98xxx) —
 * un lead ultramarin est refusé par l'API avec le code 3. Mieux vaut le dire
 * dans le formulaire que laisser l'API rejeter la demande après coup.
 */
export const REGEX_CODE_POSTAL = /^0[1-9]\d{3}$|^[1-8]\d{4}$|^9[0-5]\d{3}$/;

export const estOutreMer = (zipcode: string) => /^9[6-9]\d{3}$/.test(zipcode);

/** Validation volontairement permissive : l'API tranche, elle refait le test. */
export const emailValide = (valeur: string) =>
  /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valeur.trim());

/**
 * Ramène une saisie française libre (« 06 12 34 56 78 », « +33 6 12 34 56 78 »)
 * au format national à dix chiffres attendu par HelloArtisan, et indique s'il
 * s'agit d'un mobile : l'API sépare `cellphone` et `landline`, là où le
 * visiteur ne saisit qu'un numéro.
 */
export function normaliserTelephone(
  saisie: string,
): { numero: string; mobile: boolean } | null {
  const brut = saisie.replace(/[^\d+]/g, "");
  let national = brut;
  if (national.startsWith("+33")) national = `0${national.slice(3)}`;
  else if (national.startsWith("0033")) national = `0${national.slice(4)}`;
  else if (/^33\d{9}$/.test(national)) national = `0${national.slice(2)}`;
  national = national.replace(/\D/g, "");
  if (!/^0[1-9]\d{8}$/.test(national)) return null;
  return { numero: national, mobile: /^0[67]/.test(national) };
}

export type ChampDevis = keyof DemandeDevis;
export type Erreurs = Partial<Record<ChampDevis, string>>;

/**
 * Les étapes du formulaire, dans l'ordre. La validation est découpée de la même
 * façon : on ne bloque jamais le visiteur sur une erreur qui concerne un écran
 * qu'il n'a pas encore vu.
 */
export const ETAPES = [
  { titre: "Votre projet", champs: ["worktype"] },
  { titre: "Votre logement", champs: ["isowner", "housingtype"] },
  { titre: "Votre besoin", champs: ["delay", "budget", "comment"] },
  {
    titre: "Vos coordonnées",
    champs: [
      "civility",
      "firstname",
      "lastname",
      "email",
      "telephone",
      "zipcode",
      "city",
      "address",
      "consentement",
    ],
  },
] as const satisfies readonly { titre: string; champs: readonly ChampDevis[] }[];

export function validerDemande(d: DemandeDevis): Erreurs {
  const e: Erreurs = {};

  if (!d.worktype || !prestationParWorktype(d.worktype))
    e.worktype = "Choisissez le type de travaux.";

  if (!d.isowner) e.isowner = "Précisez votre situation.";
  if (!d.housingtype) e.housingtype = "Précisez le type de logement.";
  if (!d.delay) e.delay = "Précisez votre échéance.";
  if (!d.budget) e.budget = "Précisez votre budget, même approximatif.";

  if (!d.lastname.trim()) e.lastname = "Indiquez votre nom.";
  if (!emailValide(d.email)) e.email = "Indiquez une adresse e-mail valide.";
  if (!normaliserTelephone(d.telephone))
    e.telephone = "Indiquez un numéro de téléphone français à 10 chiffres.";

  const cp = d.zipcode.trim();
  if (!cp) e.zipcode = "Indiquez votre code postal.";
  else if (estOutreMer(cp))
    e.zipcode =
      "Notre réseau d'artisans ne couvre pas encore les départements d'outre-mer.";
  else if (!REGEX_CODE_POSTAL.test(cp))
    e.zipcode = "Ce code postal ne correspond à aucune commune française.";

  if (!d.consentement)
    e.consentement =
      "Votre accord est nécessaire pour transmettre la demande aux artisans.";

  return e;
}

/** Erreurs limitées aux champs d'une étape : utilisé pour bloquer « Continuer ». */
export function validerEtape(d: DemandeDevis, etape: number): Erreurs {
  const champs = ETAPES[etape]?.champs ?? [];
  const toutes = validerDemande(d);
  return Object.fromEntries(
    Object.entries(toutes).filter(([champ]) =>
      (champs as readonly string[]).includes(champ),
    ),
  );
}
