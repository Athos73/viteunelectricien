export type MetierConfig = {
  slug: string;
  nafCodes: string[];
  labelSingulier: string;
  labelPluriel: string;
  domaine: string;
  nomSite: string;
  widget: {
    partenaireId: string;
    boxId: string;
    containerId: string;
  };
};

export const metier: MetierConfig = {
  slug: "electricien",
  nafCodes: ["43.21A"],
  labelSingulier: "électricien",
  labelPluriel: "électriciens",
  domaine: "viteunelectricien.fr",
  nomSite: "Vite un électricien",
  widget: {
    partenaireId: "2663",
    boxId: "d64c5f7fdf",
    containerId: "vd64c5f7fdfd",
  },
};
