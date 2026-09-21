import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { ErreurConfiguration, statutLead } from "@/lib/helloartisan";

/**
 * Statut d'un lead déjà importé, pour l'orchestration n8n.
 *
 * Miroir de `POST /json/lead/status` chez HelloArtisan, à une différence près :
 * les identifiants de la plateforme restent ici. n8n s'authentifie avec le
 * jeton qu'il possède déjà - celui qui protège le webhook de `/api/devis` - et
 * n'a jamais à connaître ceux de HelloArtisan.
 *
 * La réponse est recopiée telle quelle depuis la plateforme (`StatusResponseVO`,
 * champs `code`, `statusLabel`, `date`…) : un flux écrit contre l'API d'origine
 * fonctionne sans modification.
 */

export const dynamic = "force-dynamic";

const json = (charge: unknown, statut: number) =>
  Response.json(charge, {
    status: statut,
    headers: { "Cache-Control": "no-store" },
  });

/**
 * Comparaison à durée constante : sur un jeton, un `===` laisse fuir par son
 * temps de retour la longueur du préfixe correct, ce qui suffit à le
 * reconstituer caractère par caractère.
 */
function jetonValide(entete: string | null, attendu: string): boolean {
  const fourni = entete?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(fourni);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(requete: NextRequest) {
  const attendu = process.env.N8N_LEAD_WEBHOOK_TOKEN;
  // Sans jeton configuré, l'endpoint se ferme plutôt que de s'ouvrir : une
  // variable oubliée ne doit pas exposer le statut des leads à tout venant.
  if (!attendu)
    return json(
      { code: 9, message: "Point d'entrée non configuré." },
      503,
    );

  if (!jetonValide(requete.headers.get("authorization"), attendu))
    return json({ code: 1, message: "Jeton absent ou invalide." }, 401);

  let corps: { token?: unknown; supplierLeadId?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return json({ code: 3, message: "Corps de requête illisible." }, 400);
  }

  const token = typeof corps.token === "string" ? corps.token.trim() : "";
  const supplierLeadId =
    typeof corps.supplierLeadId === "string" ? corps.supplierLeadId.trim() : "";

  // L'API accepte l'un ou l'autre ; le jeton prime, c'est l'identifiant que la
  // plateforme renvoie à l'import.
  if (!token && !supplierLeadId)
    return json(
      { code: 2, message: "Fournissez « token » ou « supplierLeadId »." },
      400,
    );

  try {
    const reponse = await statutLead(
      token ? { token } : { supplierLeadId },
    );
    return json(reponse, 200);
  } catch (erreur) {
    if (erreur instanceof ErreurConfiguration) {
      console.error("[statut] configuration HelloArtisan absente", erreur);
      return json({ code: 9, message: "Service indisponible." }, 503);
    }
    console.error("[statut] appel HelloArtisan en échec", erreur);
    return json({ code: 9, message: "Plateforme injoignable." }, 502);
  }
}
