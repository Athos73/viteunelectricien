import { metier } from "@/config/metier";

export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? `https://${metier.domaine}`;

export const urlVille = (slug: string) => `/${metier.slug}/${slug}`;
export const urlVillePage = (slug: string, n: number) =>
  n <= 1 ? urlVille(slug) : `/${metier.slug}/${slug}/page/${n}`;
export const urlFiche = (villeSlug: string, ficheSlug: string) =>
  `/${metier.slug}/${villeSlug}/${ficheSlug}`;
export const urlDepartement = (slug: string) =>
  `/${metier.slug}/departement/${slug}`;
export const urlRegion = (slug: string) => `/${metier.slug}/region/${slug}`;

export const absolu = (chemin: string) => `${BASE_URL}${chemin}`;

const TRANCHES: Record<string, string> = {
  NN: "Effectif non renseigné",
  "00": "Aucun salarié",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés ou plus",
};

export const libelleEffectif = (code: string | null) =>
  code ? (TRANCHES[code] ?? null) : null;

export function anciennete(dateCreation: string | null): number | null {
  if (!dateCreation) return null;
  const an = Number(dateCreation.slice(0, 4));
  if (!an || an < 1800) return null;
  const diff = new Date().getFullYear() - an;
  return diff >= 0 ? diff : null;
}

/**
 * Nombre au format français.
 *
 * `toLocaleString("fr-FR")` sépare les milliers par U+202F (espace fine
 * insécable). Ce glyphe est absent de Plus Jakarta Sans : dans les titres, le
 * repli se fait sur une chasse quasi nulle et « 3 213 » se lit « 3213 ». On
 * retombe donc sur l'espace insécable U+00A0, présente dans les deux polices
 * et typographiquement admise en français.
 */
export const nombre = (n: number) =>
  n.toLocaleString("fr-FR").replace(/ /g, " ");
