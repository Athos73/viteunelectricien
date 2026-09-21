/**
 * Client de l'API d'import de leads HelloArtisan (groupe Batiweb).
 *
 * Spécification : https://portal.swaggerhub.com/apis/batiweb/api-import-leads
 *
 * Deux particularités de cette API conditionnent tout ce fichier :
 *
 * 1. **Le statut HTTP est toujours 200**, y compris sur erreur d'authentifi-
 *    cation ou de validation. Seul le champ `code` de la charge utile fait foi.
 *    On ne teste donc jamais `response.ok` pour décider du succès.
 * 2. **Les identifiants voyagent dans le corps de la requête** (objet
 *    `security`), y compris sur le `GET /activities`. Ils ne doivent jamais
 *    atteindre le navigateur : ce module est réservé au serveur et n'est
 *    importé que par la route `/api/devis`.
 */

import { request } from "node:https";

const BASE_URL = "https://lead-ws.helloartisan.com";
const DELAI_MS = 15_000;

/** Codes de retour de la plateforme, communs à tous les points d'entrée. */
export const CODE = {
  SUCCES: 0,
  IDENTIFIANTS_INVALIDES: 1,
  CHAMP_MANQUANT: 2,
  VALEUR_INVALIDE: 3,
  NON_VENDABLE: 4,
  DEJA_IMPORTE: 5,
  ERREUR_TECHNIQUE: 9,
} as const;

export type Securite = {
  login: string;
  password: string;
  environment: "PROD" | "PREP";
};

/** Charge utile d'un lead : `RequestVO` de la spécification. */
export type LeadHelloArtisan = {
  civility?: "M" | "Mme" | null;
  firstname?: string | null;
  lastname: string;
  email: string;
  address?: string | null;
  zipcode: string;
  city?: string | null;
  cellphone?: string | null;
  landline?: string | null;
  isowner: number;
  housingtype?: number | null;
  delay?: number | null;
  budget?: number | null;
  comment?: string | null;
  worktype: number;
  workdescription?: string | null;
  supplierleadid?: string | null;
};

export type ReponseHelloArtisan = {
  code: number;
  message?: string | null;
  /** Identifiant interne du lead, renseigné par `/json/lead/import` (code 0). */
  id?: string | null;
  /** Jeton du lead, à conserver pour interroger `/json/lead/status`. */
  token?: string | null;
};

export class ErreurConfiguration extends Error {}

/**
 * L'environnement par défaut est la production : le compte partenaire n'a pas
 * de bac à sable distinct, et `PREP` pointe vers une plateforme séparée qu'il
 * faut demander explicitement via `HELLOARTISAN_ENV`.
 */
function securite(): Securite {
  const login = process.env.HELLOARTISAN_LOGIN;
  const password = process.env.HELLOARTISAN_PASSWORD;
  if (!login || !password)
    throw new ErreurConfiguration(
      "HELLOARTISAN_LOGIN et HELLOARTISAN_PASSWORD doivent être définis.",
    );
  return {
    login,
    password,
    environment: process.env.HELLOARTISAN_ENV === "PREP" ? "PREP" : "PROD",
  };
}

async function appeler(
  chemin: string,
  requete: unknown,
): Promise<ReponseHelloArtisan> {
  const reponse = await fetch(`${BASE_URL}${chemin}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ security: securite(), request: requete }),
    cache: "no-store",
    signal: AbortSignal.timeout(DELAI_MS),
  });

  // Un statut non-200 sort du contrat documenté : c'est une panne de la
  // plateforme (502 de leur reverse proxy, maintenance…), pas une erreur métier.
  if (!reponse.ok)
    throw new Error(`HelloArtisan ${chemin} : HTTP ${reponse.status}`);

  return reponse.json();
}

/** `POST /json/lead/import` - crée le lead et le met en vente. */
export async function importerLead(
  lead: LeadHelloArtisan,
): Promise<ReponseHelloArtisan> {
  return appeler("/json/lead/import", lead);
}

/**
 * `POST /json/lead/is_sellable` - vérifie qu'un couple code postal / métier
 * trouvera preneur, sans rien créer. Seuls `zipcode` et `worktype` sont requis.
 */
export async function leadVendable(
  zipcode: string,
  worktype: number,
): Promise<ReponseHelloArtisan> {
  return appeler("/json/lead/is_sellable", { zipcode, worktype });
}

/**
 * `POST /json/lead/status` - statut d'un lead déjà importé, par `token` ou par
 * `supplierLeadId`. Non utilisé par le formulaire : c'est le point d'entrée
 * qu'interrogera l'orchestration n8n pour savoir si un lead a été validé.
 */
export async function statutLead(
  critere: { token: string } | { supplierLeadId: string },
): Promise<ReponseHelloArtisan> {
  return appeler("/json/lead/status", critere);
}

export type Metier = { id: number; label: string };

/**
 * `GET /activities` - catalogue des métiers, avec leur `worktype`.
 *
 * Ce point d'entrée attend ses identifiants dans le corps d'une requête **GET**,
 * ce que la spécification Fetch interdit (« Request with GET/HEAD method cannot
 * have body ») : `fetch()` lève avant même d'ouvrir la connexion. On descend
 * donc d'un étage, sur le client HTTP de Node.
 *
 * Appelé à la main lors d'une mise à jour du catalogue (`npm run metiers`),
 * jamais dans le chemin d'une demande de devis : les `worktype` sont figés dans
 * src/config/prestations.ts.
 */
export function listerMetiers(): Promise<Metier[] | ReponseHelloArtisan> {
  const corps = JSON.stringify({ security: securite() });

  return new Promise((resoudre, rejeter) => {
    const requete = request(
      `${BASE_URL}/activities`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(corps),
        },
        timeout: DELAI_MS,
      },
      (reponse) => {
        let brut = "";
        reponse.setEncoding("utf8");
        reponse.on("data", (bloc) => (brut += bloc));
        reponse.on("end", () => {
          try {
            resoudre(JSON.parse(brut));
          } catch {
            rejeter(new Error(`Réponse illisible : ${brut.slice(0, 200)}`));
          }
        });
      },
    );
    requete.on("timeout", () => requete.destroy(new Error("Délai dépassé")));
    requete.on("error", rejeter);
    requete.end(corps);
  });
}
