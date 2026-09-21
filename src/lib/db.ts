import Database from "better-sqlite3";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const PAR_PAGE = 30;

export type Commune = {
  code: string;
  nom: string;
  slug: string;
  code_postal: string;
  population: number;
  lat: number;
  lng: number;
  code_departement: string;
  code_region: string;
  nb: number;
  redirige_vers: string | null;
  parent: string | null;
};

export type Fiche = {
  siret: string;
  siren: string;
  nom: string;
  slug: string;
  enseigne: string | null;
  adresse: string;
  code_commune: string;
  code_postal: string;
  lat: number | null;
  lng: number | null;
  date_creation: string | null;
  tranche_effectif: string | null;
  rge: string;
  naf: string;
  domiciliation: number;
};

export type Zone = {
  code: string;
  nom: string;
  slug: string;
  nb: number;
  code_region?: string;
};

let instance: Database.Database | null = null;

const CHEMIN_DB = join(process.cwd(), "data", "annuaire.db");
const CHEMIN_META = join(process.cwd(), "data", "annuaire.meta.json");

function db() {
  if (!instance) {
    instance = new Database(CHEMIN_DB, {
      readonly: true,
      fileMustExist: true,
    });
    instance.pragma("query_only = true");
  }
  return instance;
}

/**
 * Paris, Lyon et Marseille n'ont pas de fiches en propre : elles sont portées
 * par leurs arrondissements. Leurs pages doivent donc interroger les enfants.
 */
function codesPortants(commune: Commune): string[] {
  const enfants = db()
    .prepare("SELECT code FROM communes WHERE parent = ?")
    .all(commune.code) as { code: string }[];
  return enfants.length ? enfants.map((e) => e.code) : [commune.code];
}

export function communeParSlug(slug: string): Commune | undefined {
  return db().prepare("SELECT * FROM communes WHERE slug = ?").get(slug) as
    | Commune
    | undefined;
}

export function communeParCode(code: string): Commune | undefined {
  return db().prepare("SELECT * FROM communes WHERE code = ?").get(code) as
    | Commune
    | undefined;
}

/** Les artisans labellisés RGE puis les plus anciens : les plus crédibles d'abord. */
export function fichesDeCommune(commune: Commune, page = 1): Fiche[] {
  const codes = codesPortants(commune);
  const placeholders = codes.map(() => "?").join(",");
  return db()
    .prepare(
      `SELECT * FROM fiches
       WHERE code_commune IN (${placeholders}) AND domiciliation = 0
       ORDER BY (rge != '[]') DESC, date_creation ASC, nom ASC
       LIMIT ? OFFSET ?`,
    )
    .all(...codes, PAR_PAGE, (page - 1) * PAR_PAGE) as Fiche[];
}

export function ficheParSlug(commune: Commune, slug: string): Fiche | undefined {
  const codes = codesPortants(commune);
  const placeholders = codes.map(() => "?").join(",");
  return db()
    .prepare(
      `SELECT * FROM fiches WHERE code_commune IN (${placeholders}) AND slug = ?`,
    )
    .get(...codes, slug) as Fiche | undefined;
}

export function voisines(commune: Commune): (Commune & { distance: number })[] {
  return db()
    .prepare(
      `SELECT c.*, v.distance FROM voisins v
       JOIN communes c ON c.code = v.code_voisin
       WHERE v.code_commune = ? ORDER BY v.distance LIMIT 8`,
    )
    .all(commune.code) as (Commune & { distance: number })[];
}

export function departement(slug: string): Zone | undefined {
  return db().prepare("SELECT * FROM departements WHERE slug = ?").get(slug) as
    | Zone
    | undefined;
}

export function region(slug: string): Zone | undefined {
  return db().prepare("SELECT * FROM regions WHERE slug = ?").get(slug) as
    | Zone
    | undefined;
}

export function departementParCode(code: string): Zone | undefined {
  return db().prepare("SELECT * FROM departements WHERE code = ?").get(code) as
    | Zone
    | undefined;
}

export function regionParCode(code: string): Zone | undefined {
  return db().prepare("SELECT * FROM regions WHERE code = ?").get(code) as
    | Zone
    | undefined;
}

export function communesDuDepartement(code: string): Commune[] {
  return db()
    .prepare(
      `SELECT * FROM communes
       WHERE code_departement = ? AND nb > 0 AND parent IS NULL
       ORDER BY nb DESC, nom ASC`,
    )
    .all(code) as Commune[];
}

export function departementsDeRegion(code: string): Zone[] {
  return db()
    .prepare("SELECT * FROM departements WHERE code_region = ? ORDER BY nom")
    .all(code) as Zone[];
}

export function toutesRegions(): Zone[] {
  return db().prepare("SELECT * FROM regions ORDER BY nom").all() as Zone[];
}

export function tousDepartements(): Zone[] {
  return db().prepare("SELECT * FROM departements ORDER BY code").all() as Zone[];
}

export function arrondissements(commune: Commune): Commune[] {
  return db()
    .prepare("SELECT * FROM communes WHERE parent = ? ORDER BY code")
    .all(commune.code) as Commune[];
}

export function topCommunes(limite: number): Commune[] {
  return db()
    .prepare(
      "SELECT * FROM communes WHERE nb > 0 ORDER BY nb DESC LIMIT ?",
    )
    .all(limite) as Commune[];
}

export function communesCouvertes(): Commune[] {
  return db()
    .prepare("SELECT * FROM communes WHERE nb > 0 ORDER BY nb DESC")
    .all() as Commune[];
}

export function fichesDeCommuneToutes(commune: Commune): Fiche[] {
  const codes = codesPortants(commune);
  const placeholders = codes.map(() => "?").join(",");
  return db()
    .prepare(
      `SELECT * FROM fiches WHERE code_commune IN (${placeholders}) AND domiciliation = 0`,
    )
    .all(...codes) as Fiche[];
}

/** Recherche par nom de commune ou code postal, communes couvertes uniquement. */
export function rechercheCommunes(q: string, limite: number) {
  const terme = `${q.replace(/[%_]/g, "")}%`;
  return db()
    .prepare(
      `SELECT nom, code_postal, slug, nb FROM communes
       WHERE nb > 0 AND (nom LIKE ? OR code_postal LIKE ?)
       ORDER BY nb DESC LIMIT ?`,
    )
    .all(terme, terme, limite) as {
    nom: string;
    code_postal: string;
    slug: string;
    nb: number;
  }[];
}

/**
 * Date des données, pour le <lastmod> des sitemaps.
 *
 * Le lastmod servait jusqu'ici l'heure de génération : à chaque revalidation,
 * les ~125 000 URL déclaraient toutes avoir changé le jour même alors que leur
 * contenu ne bougeait pas. Google documente qu'il cesse d'exploiter un lastmod
 * dès qu'il le juge peu fiable - le signal était donc perdu.
 *
 * Le contenu ne change qu'à la reconstruction de la base. On lit donc la date
 * que `scripts/build-db.ts` dépose à côté d'elle. À défaut de ce fichier, on
 * retombe sur la date de modification du .db : moins fiable - un `git clone`
 * la réécrit, elle vaut donc l'heure du build sur Vercel - mais toujours
 * préférable à une date qui bouge à chaque revalidation.
 */
let dateDonneesMemo: string | null = null;

export function dateDonnees(): string {
  if (dateDonneesMemo) return dateDonneesMemo;

  let date: string | undefined;
  try {
    const meta = JSON.parse(readFileSync(CHEMIN_META, "utf8"));
    if (typeof meta.genere_le === "string") date = meta.genere_le;
  } catch {
    /* fichier absent ou illisible : on bascule sur le mtime */
  }

  dateDonneesMemo = date ?? statSync(CHEMIN_DB).mtime.toISOString();
  return dateDonneesMemo;
}

export function statsGlobales() {
  const d = db();
  return {
    fiches: (d.prepare("SELECT COUNT(*) n FROM fiches WHERE domiciliation = 0").get() as { n: number }).n,
    communes: (d.prepare("SELECT COUNT(*) n FROM communes WHERE nb > 0").get() as { n: number }).n,
    rge: (d.prepare("SELECT COUNT(*) n FROM fiches WHERE domiciliation = 0 AND rge != '[]'").get() as { n: number }).n,
  };
}

/**
 * Une fiche parisienne est rattachée à un arrondissement mais s'affiche aussi
 * sur la page mère. Une seule de ces deux URL doit être canonique : celle de
 * la commune qui porte réellement le code.
 */
export function communePorteuse(commune: Commune, fiche: Fiche): Commune {
  if (fiche.code_commune === commune.code) return commune;
  return communeParCode(fiche.code_commune) ?? commune;
}

/** Toutes les URL indexables d'un département, pour le sitemap. */
export function sitemapDepartement(codeDepartement: string) {
  const d = db();
  const communes = d
    .prepare(
      "SELECT slug FROM communes WHERE code_departement = ? AND nb > 0 ORDER BY nb DESC",
    )
    .all(codeDepartement) as { slug: string }[];
  const fiches = d
    .prepare(
      `SELECT c.slug AS ville, f.slug AS fiche FROM fiches f
       JOIN communes c ON c.code = f.code_commune
       WHERE c.code_departement = ? AND f.domiciliation = 0`,
    )
    .all(codeDepartement) as { ville: string; fiche: string }[];
  return { communes, fiches };
}

export function nbPages(commune: Commune): number {
  return Math.max(1, Math.ceil(commune.nb / PAR_PAGE));
}

export function rgeDe(f: Fiche): string[] {
  try {
    return JSON.parse(f.rge) as string[];
  } catch {
    return [];
  }
}
