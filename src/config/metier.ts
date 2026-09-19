export type MetierConfig = {
  slug: string;
  nafCodes: string[];
  labelSingulier: string;
  labelPluriel: string;
  domaine: string;
  nomSite: string;
  email: string;
};

export const metier: MetierConfig = {
  slug: "electricien",
  nafCodes: ["43.21A"],
  labelSingulier: "électricien",
  labelPluriel: "électriciens",
  domaine: "viteunelectricien.fr",
  nomSite: "Vite un électricien",
  email: "viteunelectricien@gmail.com",
};
