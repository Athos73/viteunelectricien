/**
 * Catalogue des prestations proposées en première étape du formulaire de devis.
 *
 * `worktype` est l'identifiant de métier HelloArtisan : c'est le seul champ que
 * la plateforme lit réellement pour router la demande. Les 136 métiers du
 * catalogue sont listés par `GET /activities` (voir docs/helloartisan.md pour
 * la commande de rafraîchissement) ; on n'expose ici que ceux qui relèvent d'un
 * électricien.
 *
 * `titre` est notre libellé - celui de la plateforme est souvent trop
 * administratif pour un visiteur (« Rénovation électrique complète ou
 * partielle »). `libelleApi` reprend en revanche l'intitulé officiel, renvoyé
 * tel quel dans `workdescription` : c'est ce que l'artisan verra côté
 * HelloArtisan, il doit donc rester aligné sur leur nomenclature.
 */
export type Prestation = {
  worktype: number;
  titre: string;
  detail: string;
  libelleApi: string;
};

export const PRESTATIONS: Prestation[] = [
  {
    worktype: 219,
    titre: "Rénovation électrique",
    detail: "Tableau, mise aux normes NF C 15-100, refonte d'installation",
    libelleApi: "Rénovation électrique complète ou partielle",
  },
  {
    worktype: 218,
    titre: "Dépannage & petits travaux",
    detail: "Panne, prises, interrupteurs, points lumineux",
    libelleApi: "Petits travaux électriques",
  },
  {
    worktype: 260,
    titre: "Borne de recharge",
    detail: "Installation d'une borne pour véhicule électrique",
    libelleApi: "Borne de recharge",
  },
  {
    worktype: 114,
    titre: "Panneaux photovoltaïques",
    detail: "Production solaire, autoconsommation, revente",
    libelleApi: "Panneaux photovoltaïques",
  },
  {
    worktype: 81,
    titre: "Alarme & vidéosurveillance",
    detail: "Alarme, télésurveillance, caméras",
    libelleApi: "Alarme, Télésurveillance, Vidéosurveillance",
  },
  {
    worktype: 217,
    titre: "Domotique",
    detail: "Pilotage de l'éclairage, des volets, du chauffage",
    libelleApi: "Domotique",
  },
  {
    worktype: 97,
    titre: "Chauffage électrique",
    detail: "Radiateurs, convecteurs, sèche-serviettes",
    libelleApi: "Chauffage Électrique",
  },
  {
    worktype: 221,
    titre: "Motorisation",
    detail: "Portail, porte de garage, volets roulants",
    libelleApi: "Motorisation portes, portails, volets",
  },
  {
    worktype: 103,
    titre: "VMC",
    detail: "Ventilation simple ou double flux",
    libelleApi: "VMC",
  },
];

export const prestationParWorktype = (worktype: number) =>
  PRESTATIONS.find((p) => p.worktype === worktype);
