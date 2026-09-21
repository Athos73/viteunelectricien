import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { metier } from "@/config/metier";
import { prestationParWorktype } from "@/config/prestations";
import {
  normaliserTelephone,
  validerDemande,
  type DemandeDevis,
} from "@/lib/devis";
import {
  CODE,
  ErreurConfiguration,
  importerLead,
  type LeadHelloArtisan,
} from "@/lib/helloartisan";

/**
 * Point d'entrée REST de la demande de devis.
 *
 * Le formulaire du site l'appelle en `fetch`, mais rien n'y est spécifique au
 * navigateur : c'est un endpoint JSON ordinaire, appelable depuis n8n ou
 * n'importe quel autre orchestrateur (voir docs/helloartisan.md).
 *
 * Il fait trois choses que le client ne peut pas faire :
 *   - porter les identifiants HelloArtisan, qui ne doivent jamais être exposés ;
 *   - rejouer la validation, la version client n'étant qu'un confort d'usage ;
 *   - recopier le lead vers n8n une fois l'import confirmé.
 */

/** Les identifiants sont lus à l'exécution : pas de pré-rendu possible. */
export const dynamic = "force-dynamic";

type Corps = Partial<DemandeDevis>;

type Resultat =
  | { ok: true; reference: string; message: string }
  | { ok: false; message: string; erreurs?: Record<string, string> };

function json(resultat: Resultat, statut: number) {
  return Response.json(resultat, {
    status: statut,
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Garde-fou de débit, volontairement rudimentaire : la mémoire d'une fonction
 * serverless n'est partagée ni entre instances ni entre régions, ce compteur ne
 * bloque donc qu'un envoi répété depuis une même instance. Il suffit à absorber
 * un doigt qui s'emballe sur « Envoyer » ; une attaque distribuée se traite en
 * amont, au niveau du pare-feu applicatif.
 */
const FENETRE_MS = 60_000;
const MAX_PAR_FENETRE = 5;
const envois = new Map<string, number[]>();

function tropDEnvois(ip: string): boolean {
  const maintenant = Date.now();
  const recents = (envois.get(ip) ?? []).filter(
    (t) => maintenant - t < FENETRE_MS,
  );
  recents.push(maintenant);
  envois.set(ip, recents);
  if (envois.size > 5_000) envois.clear();
  return recents.length > MAX_PAR_FENETRE;
}

const texte = (valeur: unknown, max = 500) =>
  typeof valeur === "string" ? valeur.trim().slice(0, max) : "";

const entier = (valeur: unknown) =>
  typeof valeur === "number" && Number.isInteger(valeur) ? valeur : null;

export async function POST(requete: NextRequest) {
  let corps: Corps;
  try {
    corps = (await requete.json()) as Corps;
  } catch {
    return json({ ok: false, message: "Corps de requête illisible." }, 400);
  }

  const ip =
    requete.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
  if (tropDEnvois(ip))
    return json(
      {
        ok: false,
        message:
          "Trop de demandes envoyées coup sur coup. Réessayez dans une minute.",
      },
      429,
    );

  const demande: DemandeDevis = {
    worktype: entier(corps.worktype),
    isowner: entier(corps.isowner),
    housingtype: entier(corps.housingtype),
    delay: entier(corps.delay),
    budget: entier(corps.budget),
    comment: texte(corps.comment, 2000),
    civility: corps.civility === "M" || corps.civility === "Mme" ? corps.civility : null,
    firstname: texte(corps.firstname, 80),
    lastname: texte(corps.lastname, 80),
    email: texte(corps.email, 150),
    telephone: texte(corps.telephone, 30),
    zipcode: texte(corps.zipcode, 5),
    city: texte(corps.city, 100),
    address: texte(corps.address, 200),
    consentement: corps.consentement === true,
    source: texte(corps.source, 200),
    piege: texte(corps.piege, 100),
    ouvertureMs: entier(corps.ouvertureMs) ?? 0,
  };

  // Robots : champ leurre rempli, ou formulaire renvoyé en moins de trois
  // secondes. On répond comme à un succès - un message d'erreur ne ferait
  // qu'indiquer au script ce qu'il doit corriger - mais rien n'est importé.
  //
  // L'horodatage vient de l'horloge du visiteur, pas de la nôtre : une durée
  // négative signale une horloge en avance, pas un envoi instantané. On ne
  // sanctionne donc que l'intervalle [0 s, 3 s[, sous peine de jeter les leads
  // de tous les navigateurs mal réglés.
  const ecoule = Date.now() - demande.ouvertureMs;
  const instantane = demande.ouvertureMs > 0 && ecoule >= 0 && ecoule < 3_000;
  if (demande.piege || instantane)
    return json(
      { ok: true, reference: "-", message: "Demande enregistrée." },
      201,
    );

  const erreurs = validerDemande(demande);
  if (Object.keys(erreurs).length > 0)
    return json(
      {
        ok: false,
        message: "Certaines informations sont incomplètes.",
        erreurs: erreurs as Record<string, string>,
      },
      400,
    );

  const telephone = normaliserTelephone(demande.telephone)!;
  const prestation = prestationParWorktype(demande.worktype!)!;
  const reference = `vue-${randomUUID().slice(0, 13)}`;

  const lead: LeadHelloArtisan = {
    civility: demande.civility,
    firstname: demande.firstname || null,
    lastname: demande.lastname,
    email: demande.email,
    address: demande.address || null,
    zipcode: demande.zipcode,
    city: demande.city || null,
    // L'API attend deux champs distincts et en exige au moins un ; le visiteur
    // n'en saisit qu'un, on l'aiguille sur l'indicatif.
    cellphone: telephone.mobile ? telephone.numero : null,
    landline: telephone.mobile ? null : telephone.numero,
    isowner: demande.isowner!,
    housingtype: demande.housingtype,
    delay: demande.delay,
    budget: demande.budget,
    comment: demande.comment || null,
    worktype: prestation.worktype,
    workdescription: prestation.libelleApi,
    supplierleadid: reference,
  };

  let reponse;
  try {
    reponse = await importerLead(lead);
  } catch (erreur) {
    if (erreur instanceof ErreurConfiguration) {
      console.error("[devis] configuration HelloArtisan absente", erreur);
      return json(
        {
          ok: false,
          message:
            "Le service de mise en relation est momentanément indisponible.",
        },
        503,
      );
    }
    console.error("[devis] appel HelloArtisan en échec", erreur);
    return json(
      {
        ok: false,
        message:
          "Le service de mise en relation ne répond pas. Réessayez dans quelques instants.",
      },
      502,
    );
  }

  if (reponse.code === CODE.SUCCES || reponse.code === CODE.DEJA_IMPORTE) {
    await versN8n({ reference, demande, lead, reponse });
    return json(
      {
        ok: true,
        reference,
        message:
          reponse.code === CODE.DEJA_IMPORTE
            ? "Cette demande nous est déjà parvenue : les artisans vont vous recontacter."
            : "Demande transmise.",
      },
      201,
    );
  }

  // À partir d'ici, `code` est non nul : la demande n'a pas été importée.
  console.error("[devis] refus HelloArtisan", {
    reference,
    code: reponse.code,
    message: reponse.message,
  });

  if (reponse.code === CODE.NON_VENDABLE)
    return json(
      {
        ok: false,
        message: `Aucun ${metier.labelSingulier} partenaire n'est disponible pour ce projet dans votre secteur. Vous pouvez contacter directement les entreprises listées sur cette page.`,
      },
      422,
    );

  if (
    reponse.code === CODE.VALEUR_INVALIDE ||
    reponse.code === CODE.CHAMP_MANQUANT
  )
    return json(
      {
        ok: false,
        message:
          "Une information n'a pas été acceptée par notre partenaire. Vérifiez le code postal, l'e-mail et le téléphone.",
      },
      422,
    );

  // Codes 1 (identifiants) et 9 (erreur technique). Le code 9 déclenche une
  // nouvelle tentative planifiée côté HelloArtisan : le lead n'est pas perdu,
  // mais on ne peut pas encore le confirmer au visiteur.
  return json(
    {
      ok: false,
      message:
        "Le service de mise en relation rencontre un incident. Réessayez dans quelques instants.",
    },
    502,
  );
}

/**
 * Recopie du lead vers n8n, si `N8N_LEAD_WEBHOOK_URL` est défini.
 *
 * C'est la porte d'entrée de l'orchestration : n8n reçoit la demande complète
 * (y compris les champs que HelloArtisan ne stocke pas, comme la page
 * d'origine) et le jeton du lead, qui permettra d'interroger `/json/lead/status`
 * plus tard. L'échec de cette recopie n'invalide jamais la demande du
 * visiteur : le lead est déjà chez HelloArtisan, il est trop tard pour
 * l'annuler et ce n'est pas au visiteur d'en porter la conséquence.
 */
async function versN8n(charge: {
  reference: string;
  demande: DemandeDevis;
  lead: LeadHelloArtisan;
  reponse: { code: number; message?: string | null; id?: string | null; token?: string | null };
}) {
  const url = process.env.N8N_LEAD_WEBHOOK_URL;
  if (!url) return;

  const jeton = process.env.N8N_LEAD_WEBHOOK_TOKEN;
  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      },
      body: JSON.stringify({
        reference: charge.reference,
        recuLe: new Date().toISOString(),
        site: metier.domaine,
        source: charge.demande.source,
        lead: charge.lead,
        helloartisan: {
          code: charge.reponse.code,
          message: charge.reponse.message ?? null,
          id: charge.reponse.id ?? null,
          token: charge.reponse.token ?? null,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!reponse.ok)
      console.error("[devis] webhook n8n en erreur", reponse.status);
  } catch (erreur) {
    console.error("[devis] webhook n8n injoignable", erreur);
  }
}
