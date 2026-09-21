import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { metier } from "../src/config/metier";

const API = "https://recherche-entreprises.api.gouv.fr/search";
const RAW = join(process.cwd(), "data", "raw");
const OUT = join(RAW, "entreprises");
const PER_PAGE = 25;
const DELAY_MS = 200;

type Etablissement = {
  siret: string;
  adresse: string | null;
  commune: string | null;
  libelle_commune: string | null;
  code_postal: string | null;
  latitude: string | null;
  longitude: string | null;
  etat_administratif: string | null;
  statut_diffusion_etablissement: string | null;
  liste_enseignes: string[] | null;
  liste_rge: string[] | null;
  activite_principale: string | null;
  date_creation: string | null;
};

type Entreprise = {
  siren: string;
  nom_complet: string | null;
  nom_raison_sociale: string | null;
  sigle: string | null;
  date_creation: string | null;
  activite_principale: string | null;
  categorie_entreprise: string | null;
  siege?: { tranche_effectif_salarie: string | null };
  matching_etablissements?: Etablissement[];
};

export type Fiche = {
  siret: string;
  siren: string;
  nom: string;
  enseigne: string | null;
  adresse: string;
  codeCommune: string;
  libelleCommune: string;
  codePostal: string;
  lat: number | null;
  lng: number | null;
  dateCreation: string | null;
  trancheEffectif: string | null;
  rge: string[];
  naf: string | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(params: URLSearchParams): Promise<{
  results: Entreprise[];
  total_results: number;
  total_pages: number;
}> {
  for (let attempt = 1; attempt <= 6; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${API}?${params}`);
    } catch {
      await sleep(2000 * attempt);
      continue;
    }
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${res.status} - ${params}`);
  }
  throw new Error(`échec après 6 tentatives - ${params}`);
}

// L'API filtre etat_administratif au niveau de l'entreprise : un établissement
// fermé peut remonter sous une entreprise active. D'où le refiltrage ici.
function extraire(entreprises: Entreprise[]): Fiche[] {
  const fiches: Fiche[] = [];
  for (const e of entreprises) {
    const nom = e.nom_complet ?? e.nom_raison_sociale;
    if (!nom || nom.toUpperCase().includes("NON-DIFFUSIBLE")) continue;

    for (const et of e.matching_etablissements ?? []) {
      if (et.etat_administratif !== "A") continue;
      if (et.statut_diffusion_etablissement && et.statut_diffusion_etablissement !== "O") continue;
      if (!et.commune || !et.code_postal || !et.adresse) continue;

      fiches.push({
        siret: et.siret,
        siren: e.siren,
        nom,
        enseigne: et.liste_enseignes?.[0] ?? null,
        adresse: et.adresse,
        codeCommune: et.commune,
        libelleCommune: et.libelle_commune ?? "",
        codePostal: et.code_postal,
        lat: et.latitude ? Number(et.latitude) : null,
        lng: et.longitude ? Number(et.longitude) : null,
        dateCreation: et.date_creation ?? e.date_creation,
        trancheEffectif: e.siege?.tranche_effectif_salarie ?? null,
        rge: et.liste_rge ?? [],
        naf: et.activite_principale ?? e.activite_principale,
      });
    }
  }
  return fiches;
}

function buildParams(dep: string, page: number, codePostal?: string) {
  const p = new URLSearchParams({
    activite_principale: metier.nafCodes.join(","),
    etat_administratif: "A",
    per_page: String(PER_PAGE),
    page: String(page),
  });
  if (codePostal) p.set("code_postal", codePostal);
  else p.set("departement", dep);
  return p;
}

async function crawlDepartement(dep: string): Promise<Fiche[]> {
  const first = await search(buildParams(dep, 1));
  const total = first.total_results;

  // Le moteur plafonne la pagination : au-delà, on redécoupe par code postal.
  if (total >= 10000) {
    console.log(`\n  ${dep} : ${total} résultats, redécoupage par code postal`);
    const communes = JSON.parse(
      await readFile(join(RAW, "communes.json"), "utf8"),
    ) as { codeDepartement: string; codesPostaux: string[] }[];
    const cps = [
      ...new Set(
        communes.filter((c) => c.codeDepartement === dep).flatMap((c) => c.codesPostaux),
      ),
    ];
    const out: Fiche[] = [];
    for (const cp of cps) {
      let page = 1;
      for (;;) {
        const r = await search(buildParams(dep, page, cp));
        out.push(...extraire(r.results));
        if (page >= r.total_pages || r.results.length === 0) break;
        page++;
        await sleep(DELAY_MS);
      }
      await sleep(DELAY_MS);
    }
    return out;
  }

  const out = extraire(first.results);
  for (let page = 2; page <= first.total_pages; page++) {
    await sleep(DELAY_MS);
    const r = await search(buildParams(dep, page));
    out.push(...extraire(r.results));
    if (r.results.length === 0) break;
  }
  return out;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const departements = JSON.parse(
    await readFile(join(RAW, "departements.json"), "utf8"),
  ) as { code: string; nom: string }[];

  let totalFiches = 0;
  const t0 = Date.now();

  for (const [i, dep] of departements.entries()) {
    const file = join(OUT, `${dep.code}.json`);
    if (existsSync(file)) {
      const cached = JSON.parse(await readFile(file, "utf8")) as Fiche[];
      totalFiches += cached.length;
      continue;
    }

    const fiches = await crawlDepartement(dep.code);
    const uniques = [...new Map(fiches.map((f) => [f.siret, f])).values()];
    await writeFile(file, JSON.stringify(uniques));
    totalFiches += uniques.length;

    const pct = (((i + 1) / departements.length) * 100).toFixed(0);
    const min = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(
      `[${pct}%] ${dep.code} ${dep.nom} : ${uniques.length} actifs - cumul ${totalFiches} (${min} min)`,
    );
    await sleep(DELAY_MS);
  }

  console.log(`\nTerminé : ${totalFiches} établissements actifs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
