import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { metier } from "../src/config/metier";
import {
  sitemapDepartement,
  tousDepartements,
  toutesRegions,
} from "../src/lib/db";
import {
  absolu,
  urlDepartement,
  urlFiche,
  urlRegion,
  urlVille,
} from "../src/lib/site";

/**
 * Signale les URL modifiées à IndexNow — le protocole que Bing, Yandex, Seznam
 * et Naver partagent. Google ne le lit pas : pour lui, seul le sitemap compte.
 *
 * À lancer après une reconstruction de la base :
 *
 *   npm run indexnow          les pages transverses (~125 URL)
 *   npm run indexnow -- --tout   tout l'annuaire, par lots de 10 000
 *
 * IndexNow demande de ne soumettre que ce qui a changé. Par défaut on se limite
 * donc aux pages de zone : elles affichent des comptages, elles changent à
 * chaque import. Les fiches, elles, bougent rarement — d'où le drapeau explicite
 * pour les inclure, à réserver à une première soumission ou à un import massif.
 */

const POINT_DE_TERMINAISON = "https://api.indexnow.org/IndexNow";
const PAR_LOT = 10_000; // maximum autorisé par requête
const PUBLIC = join(process.cwd(), "public");

/**
 * La clé se lit depuis `public/` plutôt que d'être recopiée ici : le protocole
 * exige un fichier `<clé>.txt` contenant la clé elle-même, donc le fichier est
 * déjà la source de vérité. Le chercher évite qu'une constante en dur finisse
 * par diverger du fichier publié — auquel cas les soumissions seraient rejetées
 * en 403 sans que rien ne l'explique.
 */
async function cle(): Promise<string> {
  for (const nom of await readdir(PUBLIC)) {
    if (!nom.endsWith(".txt")) continue;
    const attendue = nom.slice(0, -4);
    const contenu = (await readFile(join(PUBLIC, nom), "utf8")).trim();
    if (contenu === attendue) return attendue;
  }
  throw new Error(
    `Aucune clé IndexNow dans public/ : il y faut un fichier <clé>.txt dont le contenu est la clé.`,
  );
}

function urlsZones(): string[] {
  return [
    absolu("/"),
    absolu("/regions"),
    absolu("/departements"),
    ...toutesRegions().map((r) => absolu(urlRegion(r.slug))),
    ...tousDepartements().map((d) => absolu(urlDepartement(d.slug))),
  ];
}

function urlsCompletes(): string[] {
  const urls = urlsZones();
  for (const d of tousDepartements()) {
    const { communes, fiches } = sitemapDepartement(d.code);
    urls.push(...communes.map((c) => absolu(urlVille(c.slug))));
    urls.push(...fiches.map((f) => absolu(urlFiche(f.ville, f.fiche))));
  }
  return urls;
}

/** Les codes qu'IndexNow renvoie sont muets : on les traduit une fois pour toutes. */
function explique(statut: number): string {
  switch (statut) {
    case 200:
      return "accepté";
    case 202:
      return "accepté, validation de la clé en attente";
    case 400:
      return "requête invalide";
    case 403:
      return "clé refusée — le fichier <clé>.txt est-il bien en ligne ?";
    case 422:
      return "URL hors du domaine déclaré, ou clé incohérente";
    case 429:
      return "trop de requêtes, réessayer plus tard";
    default:
      return "réponse inattendue";
  }
}

async function main() {
  const tout = process.argv.includes("--tout");
  const clef = await cle();
  const urls = tout ? urlsCompletes() : urlsZones();

  console.log(
    `IndexNow — ${urls.length} URL (${tout ? "annuaire complet" : "pages de zone"})`,
  );
  console.log(`Clé : ${clef}\n`);

  let echecs = 0;
  for (let i = 0; i < urls.length; i += PAR_LOT) {
    const lot = urls.slice(i, i + PAR_LOT);
    const reponse = await fetch(POINT_DE_TERMINAISON, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: metier.domaine,
        key: clef,
        keyLocation: absolu(`/${clef}.txt`),
        urlList: lot,
      }),
    });

    const numero = Math.floor(i / PAR_LOT) + 1;
    const ok = reponse.status === 200 || reponse.status === 202;
    if (!ok) echecs++;
    console.log(
      `Lot ${numero} — ${lot.length} URL — ${reponse.status} ${explique(reponse.status)}`,
    );
  }

  if (echecs) {
    console.error(`\n${echecs} lot(s) refusé(s).`);
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
