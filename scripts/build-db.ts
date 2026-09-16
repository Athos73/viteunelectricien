import Database from "better-sqlite3";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { slugify, villeSlug } from "../src/lib/slug";
import { metier } from "../src/config/metier";
import type { Fiche } from "./fetch-entreprises";

const RAW = join(process.cwd(), "data", "raw");
const DB_PATH = join(process.cwd(), "data", "annuaire.db");

type Commune = {
  code: string;
  nom: string;
  codesPostaux: string[];
  population?: number;
  codeDepartement: string;
  codeRegion: string;
  centre: { coordinates: [number, number] };
};

const CELL = 0.2;
const cellKey = (lat: number, lng: number) =>
  `${Math.floor(lat / CELL)}:${Math.floor(lng / CELL)}`;

function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * L'API renvoie nom_complet sous la forme « RAISON SOCIALE (SIGLE) ». Le sigle
 * répète souvent la raison sociale — « ARTISAN ROBERT (ARTISAN ROBERT) » — et
 * n'apporte alors rien. On le sépare pour pouvoir l'écarter.
 */
function baseEtSigle(nom: string): [string, string | null] {
  const m = nom.match(/^(.+?)\s*\((.+)\)\s*$/);
  return m ? [m[1].trim(), m[2].trim()] : [nom.trim(), null];
}

function nomAffiche(nom: string): string {
  const [base, sigle] = baseEtSigle(nom);
  if (!sigle || slugify(sigle) === slugify(base)) return base;
  return `${base} (${sigle})`;
}

/** Le sigle est toujours exclu du slug : des URL courtes se partagent mieux. */
function slugBase(f: Fiche): string {
  return slugify(f.enseigne ?? baseEtSigle(f.nom)[0]) || "entreprise";
}

async function main() {
  const regions = JSON.parse(await readFile(join(RAW, "regions.json"), "utf8"));
  const departements = JSON.parse(
    await readFile(join(RAW, "departements.json"), "utf8"),
  );
  const communes: Commune[] = JSON.parse(
    await readFile(join(RAW, "communes.json"), "utf8"),
  );

  const files = await readdir(join(RAW, "entreprises"));
  const fiches: Fiche[] = [];
  for (const f of files.filter((f) => f.endsWith(".json"))) {
    fiches.push(
      ...(JSON.parse(await readFile(join(RAW, "entreprises", f), "utf8")) as Fiche[]),
    );
  }
  // L'API filtre le NAF au niveau de l'entreprise : ses établissements peuvent
  // exercer une tout autre activité (élevage, restauration...). On ne garde que
  // ceux dont le NAF propre est celui du métier.
  const dedupes = [...new Map(fiches.map((f) => [f.siret, f])).values()];
  const uniques = dedupes.filter((f) => f.naf && metier.nafCodes.includes(f.naf));
  const rejetes = dedupes.length - uniques.length;

  // Sirene conserve des codes INSEE de communes fusionnées (ex. 93059
  // Pierrefitte-sur-Seine, absorbée par Saint-Denis). On les rattrape via le
  // code postal, sinon leurs fiches disparaissent du site.
  const codesConnus = new Set(communes.map((c) => c.code));
  const parCodePostal = new Map<string, Commune[]>();
  for (const c of communes) {
    for (const cp of c.codesPostaux) {
      const l = parCodePostal.get(cp);
      if (l) l.push(c);
      else parCodePostal.set(cp, [c]);
    }
  }
  let reaffectees = 0;
  for (const f of uniques) {
    if (codesConnus.has(f.codeCommune)) continue;
    const candidats = parCodePostal.get(f.codePostal);
    if (!candidats?.length) continue;
    const cible =
      candidats.find(
        (c) => slugify(c.nom) === slugify(f.libelleCommune),
      ) ??
      [...candidats].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
    f.codeCommune = cible.code;
    reaffectees++;
  }

  // Une adresse qui héberge des dizaines d'entreprises est un domiciliataire,
  // pas une présence locale réelle (ex. 505 fiches au 41 Grande Rue à Étalans,
  // village de 1643 habitants). On les écarte des listings.
  const SEUIL_DOMICILIATION = 20;
  const parAdresse = new Map<string, number>();
  for (const f of uniques) {
    parAdresse.set(f.adresse, (parAdresse.get(f.adresse) ?? 0) + 1);
  }
  const estDomiciliation = (f: Fiche) =>
    (parAdresse.get(f.adresse) ?? 0) >= SEUIL_DOMICILIATION;
  const nbDomiciliation = uniques.filter(estDomiciliation).length;

  const parCommune = new Map<string, Fiche[]>();
  for (const f of uniques) {
    if (estDomiciliation(f)) continue;
    const list = parCommune.get(f.codeCommune);
    if (list) list.push(f);
    else parCommune.set(f.codeCommune, [f]);
  }

  // Paris, Lyon et Marseille : les fiches sont rattachées aux arrondissements.
  // La commune mère agrège ses arrondissements plutôt que d'être redirigée.
  const MERES: Record<string, [number, number]> = {
    "75056": [75101, 75120],
    "13055": [13201, 13216],
    "69123": [69381, 69389],
  };
  function parentDe(code: string): string | null {
    const n = Number(code);
    for (const [mere, [min, max]] of Object.entries(MERES)) {
      if (n >= min && n <= max) return mere;
    }
    return null;
  }

  const db = new Database(DB_PATH);
  // WAL pendant l'écriture : les insertions en masse y sont nettement plus
  // rapides. La base repasse en mode « delete » avant fermeture (voir plus bas).
  db.pragma("journal_mode = WAL");
  db.exec(`
    DROP TABLE IF EXISTS regions;
    DROP TABLE IF EXISTS departements;
    DROP TABLE IF EXISTS communes;
    DROP TABLE IF EXISTS fiches;
    DROP TABLE IF EXISTS voisins;

    CREATE TABLE regions (code TEXT PRIMARY KEY, nom TEXT, slug TEXT UNIQUE, nb INTEGER);
    CREATE TABLE departements (code TEXT PRIMARY KEY, nom TEXT, slug TEXT UNIQUE, code_region TEXT, nb INTEGER);
    CREATE TABLE communes (
      code TEXT PRIMARY KEY, nom TEXT, slug TEXT UNIQUE, code_postal TEXT,
      population INTEGER, lat REAL, lng REAL,
      code_departement TEXT, code_region TEXT, nb INTEGER, redirige_vers TEXT,
      parent TEXT
    );
    CREATE TABLE fiches (
      siret TEXT PRIMARY KEY, siren TEXT, nom TEXT, slug TEXT, enseigne TEXT,
      adresse TEXT, code_commune TEXT, code_postal TEXT, lat REAL, lng REAL,
      date_creation TEXT, tranche_effectif TEXT, rge TEXT, naf TEXT,
      domiciliation INTEGER
    );
    CREATE TABLE voisins (code_commune TEXT, code_voisin TEXT, distance REAL);

    CREATE INDEX idx_communes_dep ON communes(code_departement);
    CREATE INDEX idx_communes_nb ON communes(nb);
    CREATE INDEX idx_fiches_commune ON fiches(code_commune);
    CREATE INDEX idx_voisins ON voisins(code_commune);
  `);

  const slugsVus = new Set<string>();
  const communesRows = communes.map((c) => {
    const cp = c.codesPostaux[0];
    // Paris/Lyon/Marseille hériteraient du CP de leur 1er arrondissement
    // (paris-75001), ce qui prête à confusion avec la page de cet arrondissement.
    let slug = c.code in MERES ? slugify(c.nom) : villeSlug(c.nom, cp);
    if (slugsVus.has(slug)) slug = `${slug}-${c.code}`;
    slugsVus.add(slug);
    return {
      code: c.code,
      nom: c.nom,
      slug,
      code_postal: cp,
      population: c.population ?? 0,
      lat: c.centre.coordinates[1],
      lng: c.centre.coordinates[0],
      code_departement: c.codeDepartement,
      code_region: c.codeRegion,
      nb: parCommune.get(c.code)?.length ?? 0,
      parent: parentDe(c.code),
    };
  });

  for (const [mere] of Object.entries(MERES)) {
    const ligne = communesRows.find((c) => c.code === mere);
    if (ligne) {
      ligne.nb = communesRows
        .filter((c) => c.parent === mere)
        .reduce((s, c) => s + c.nb, 0);
    }
  }

  const couvertes = communesRows.filter((c) => c.nb > 0);

  const grille = new Map<string, typeof communesRows>();
  for (const c of couvertes) {
    const k = cellKey(c.lat, c.lng);
    const b = grille.get(k);
    if (b) b.push(c);
    else grille.set(k, [c]);
  }

  function autour(lat: number, lng: number, rayonCellules: number) {
    const out: typeof communesRows = [];
    const ci = Math.floor(lat / CELL);
    const cj = Math.floor(lng / CELL);
    for (let i = ci - rayonCellules; i <= ci + rayonCellules; i++) {
      for (let j = cj - rayonCellules; j <= cj + rayonCellules; j++) {
        const b = grille.get(`${i}:${j}`);
        if (b) out.push(...b);
      }
    }
    return out;
  }

  const insertRegion = db.prepare(
    "INSERT INTO regions VALUES (@code, @nom, @slug, @nb)",
  );
  const insertDep = db.prepare(
    "INSERT INTO departements VALUES (@code, @nom, @slug, @code_region, @nb)",
  );
  const insertCommune = db.prepare(
    `INSERT INTO communes VALUES (@code, @nom, @slug, @code_postal, @population,
     @lat, @lng, @code_departement, @code_region, @nb, @redirige_vers, @parent)`,
  );
  const insertFiche = db.prepare(
    `INSERT OR IGNORE INTO fiches VALUES (@siret, @siren, @nom, @slug, @enseigne,
     @adresse, @code_commune, @code_postal, @lat, @lng, @date_creation,
     @tranche_effectif, @rge, @naf, @domiciliation)`,
  );
  const insertVoisin = db.prepare("INSERT INTO voisins VALUES (?, ?, ?)");

  db.transaction(() => {
    for (const r of regions) {
      const nb = communesRows
        .filter((c) => c.code_region === r.code)
        .reduce((s, c) => s + c.nb, 0);
      insertRegion.run({ code: r.code, nom: r.nom, slug: slugify(r.nom), nb });
    }
    for (const d of departements) {
      const nb = communesRows
        .filter((c) => c.code_departement === d.code)
        .reduce((s, c) => s + c.nb, 0);
      insertDep.run({
        code: d.code,
        nom: d.nom,
        slug: slugify(d.nom),
        code_region: d.codeRegion,
        nb,
      });
    }

    for (const c of communesRows) {
      let redirige: string | null = null;
      if (c.nb === 0) {
        let candidats: typeof communesRows = [];
        for (let r = 1; r <= 12 && candidats.length === 0; r++) {
          candidats = autour(c.lat, c.lng, r);
        }
        let best: { code: string; d: number } | null = null;
        for (const v of candidats) {
          const d = haversine(c.lat, c.lng, v.lat, v.lng);
          if (!best || d < best.d) best = { code: v.code, d };
        }
        redirige = best?.code ?? null;
      }
      insertCommune.run({ ...c, redirige_vers: redirige });
    }

    for (const c of couvertes) {
      const proches = autour(c.lat, c.lng, 2)
        .filter((v) => v.code !== c.code)
        .map((v) => ({ code: v.code, d: haversine(c.lat, c.lng, v.lat, v.lng) }))
        .filter((v) => v.d <= 30)
        .sort((a, b) => a.d - b.d)
        .slice(0, 8);
      for (const p of proches) insertVoisin.run(c.code, p.code, p.d);
    }

    // Une fiche parisienne est rattachée à un arrondissement mais s'affiche
    // aussi sur la page mère : son slug doit être unique à l'échelle de Paris
    // entier, sinon /electricien/paris/artisan-robert désigne neuf sociétés.
    const scopeDe = new Map(
      communesRows.map((c) => [c.code, c.parent ?? c.code] as const),
    );
    const scope = (f: Fiche) => scopeDe.get(f.codeCommune) ?? f.codeCommune;

    const homonymes = new Map<string, number>();
    for (const f of uniques) {
      const cle = `${scope(f)}/${slugBase(f)}`;
      homonymes.set(cle, (homonymes.get(cle) ?? 0) + 1);
    }

    // Tous les homonymes reçoivent le NIC, pas seulement les suivants : le
    // suffixe reste ainsi stable même si l'un d'eux cesse son activité.
    const candidat = (f: Fiche) => {
      const base = slugBase(f);
      return (homonymes.get(`${scope(f)}/${base}`) ?? 0) > 1
        ? `${base}-${f.siret.slice(-5)}`
        : base;
    };

    // Deux SIREN distincts peuvent partager le même NIC (deux frères créant
    // leur entreprise le même jour à la même adresse). Il reste alors le SIRET.
    const restantes = new Map<string, number>();
    for (const f of uniques) {
      const cle = `${scope(f)}/${candidat(f)}`;
      restantes.set(cle, (restantes.get(cle) ?? 0) + 1);
    }

    for (const f of uniques) {
      const c = candidat(f);
      const slug =
        (restantes.get(`${scope(f)}/${c}`) ?? 0) > 1
          ? `${slugBase(f)}-${f.siret}`
          : c;
      insertFiche.run({
        siret: f.siret,
        siren: f.siren,
        nom: nomAffiche(f.nom),
        slug,
        enseigne: f.enseigne,
        adresse: f.adresse,
        code_commune: f.codeCommune,
        code_postal: f.codePostal,
        lat: f.lat,
        lng: f.lng,
        date_creation: f.dateCreation,
        tranche_effectif: f.trancheEffectif,
        rge: JSON.stringify(f.rge),
        naf: f.naf,
        domiciliation: estDomiciliation(f) ? 1 : 0,
      });
    }
  })();

  const orphelines = communesRows.filter((c) => c.nb === 0).length;
  const sansRedirect = db
    .prepare("SELECT COUNT(*) n FROM communes WHERE nb = 0 AND redirige_vers IS NULL")
    .get() as { n: number };
  const avecRge = uniques.filter((f) => f.rge.length > 0).length;

  console.log(`
Établissements actifs      : ${uniques.length}
Rejetés (NAF hors métier)  : ${rejetes}
Écartés (domiciliation)    : ${nbDomiciliation}
Communes fusionnées rattr. : ${reaffectees}
Communes couvertes (pages) : ${couvertes.length} / ${communesRows.length}
Communes sans électricien  : ${orphelines} (redirection 301)
  dont sans cible          : ${sansRedirect.n}
Fiches labellisées RGE     : ${avecRge}
Base                       : ${DB_PATH}
`);

  // Vercel exécute les fonctions serverless sur un système de fichiers en
  // lecture seule. Une base en WAL y est inouvrable même en lecture : SQLite
  // doit créer les fichiers -wal et -shm à côté du .db. On rebascule donc en
  // journal « delete », qui ne demande aucune écriture à l'ouverture.
  db.pragma("wal_checkpoint(TRUNCATE)");
  db.pragma("journal_mode = DELETE");

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
