import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const GEO = "https://geo.api.gouv.fr";
const OUT = join(process.cwd(), "data", "raw");

type Region = { code: string; nom: string };
type Departement = { code: string; nom: string; codeRegion: string };
type CommuneApi = {
  code: string;
  nom: string;
  codesPostaux?: string[];
  population?: number;
  codeDepartement: string;
  codeRegion: string;
  centre?: { type: string; coordinates: [number, number] };
};

async function get<T>(path: string): Promise<T> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`${GEO}${path}`);
    if (res.ok) return (await res.json()) as T;
    if (attempt === 5) throw new Error(`${path} -> HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error("unreachable");
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const regions = await get<Region[]>("/regions?fields=code,nom");
  const departements = await get<Departement[]>(
    "/departements?fields=code,nom,codeRegion",
  );

  const FIELDS = "code,nom,codesPostaux,population,centre,codeDepartement,codeRegion";

  const communes: CommuneApi[] = [];
  for (const dep of departements) {
    const batch = await get<CommuneApi[]>(
      `/communes?codeDepartement=${dep.code}&fields=${FIELDS}&format=json`,
    );
    communes.push(...batch);
    process.stdout.write(`\r${dep.code} ${dep.nom} - ${communes.length} communes`);
  }

  // Sirene rattache les établissements parisiens, lyonnais et marseillais aux
  // codes d'arrondissement (75108, 69383, 13215), absents de la liste des
  // communes. Sans eux, tout Paris est perdu.
  const arrondissements = await get<CommuneApi[]>(
    `/communes?type=arrondissement-municipal&fields=${FIELDS}&format=json`,
  );
  communes.push(...arrondissements);
  console.log(`\nArrondissements municipaux ajoutés : ${arrondissements.length}`);

  const sansCoord = communes.filter((c) => !c.centre).length;
  const sansCp = communes.filter((c) => !c.codesPostaux?.length).length;

  await writeFile(join(OUT, "regions.json"), JSON.stringify(regions, null, 2));
  await writeFile(
    join(OUT, "departements.json"),
    JSON.stringify(departements, null, 2),
  );
  await writeFile(join(OUT, "communes.json"), JSON.stringify(communes));

  console.log(
    `\n\nRégions: ${regions.length} | Départements: ${departements.length} | Communes: ${communes.length}`,
  );
  console.log(`Sans centroïde: ${sansCoord} | Sans code postal: ${sansCp}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
