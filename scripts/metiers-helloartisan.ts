import { listerMetiers, type Metier } from "../src/lib/helloartisan";
import { PRESTATIONS } from "../src/config/prestations";

/**
 * Imprime le catalogue des métiers HelloArtisan et signale les écarts avec
 * src/config/prestations.ts.
 *
 * Les `worktype` sont figés dans la configuration — un appel réseau à chaque
 * affichage du formulaire serait absurde pour une liste qui bouge deux fois par
 * an. Ce script est le garde-fou : à relancer quand la plateforme annonce une
 * évolution de sa nomenclature.
 *
 *   npm run metiers
 */
async function main() {
  const reponse = await listerMetiers();

  if (!Array.isArray(reponse)) {
    console.error(
      `Échec (code ${reponse.code}) : ${reponse.message ?? "sans message"}`,
    );
    process.exitCode = 1;
    return;
  }

  const metiers = reponse as Metier[];
  console.log(`${metiers.length} métiers disponibles :\n`);
  for (const m of metiers) console.log(String(m.id).padStart(4), m.label);

  const connus = new Map(metiers.map((m) => [m.id, m.label]));
  const ecarts = PRESTATIONS.filter(
    (p) => connus.get(p.worktype) !== p.libelleApi,
  );

  console.log(`\n--- ${PRESTATIONS.length} prestations du formulaire ---`);
  if (ecarts.length === 0) {
    console.log("Aucun écart : tous les worktype et libellés correspondent.");
    return;
  }
  for (const p of ecarts) {
    const officiel = connus.get(p.worktype);
    console.log(
      officiel
        ? `worktype ${p.worktype} : « ${p.libelleApi} » côté site, « ${officiel} » côté API`
        : `worktype ${p.worktype} (« ${p.titre} ») n'existe plus dans le catalogue`,
    );
  }
  process.exitCode = 1;
}

void main();
