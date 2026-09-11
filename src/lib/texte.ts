import { metier } from "@/config/metier";
import type { Commune, Fiche, Zone } from "@/lib/db";
import { rgeDe } from "@/lib/db";
import { anciennete, nombre } from "@/lib/site";

/**
 * Le texte est composé à partir des données réelles de la commune plutôt que
 * dupliqué d'une page à l'autre : c'est ce qui distingue une page indexable
 * d'une page de remplissage.
 */
export function introVille(
  commune: Commune,
  fiches: Fiche[],
  dep: Zone | undefined,
): string {
  const nbRge = fiches.filter((f) => rgeDe(f).length > 0).length;
  const anciens = fiches
    .map((f) => anciennete(f.date_creation))
    .filter((a): a is number => a !== null);
  const moyenne = anciens.length
    ? Math.round(anciens.reduce((s, a) => s + a, 0) / anciens.length)
    : null;

  const phrases: string[] = [];

  if (commune.nb === 1) {
    phrases.push(
      `Un seul ${metier.labelSingulier} est enregistré à ${commune.nom} (${commune.code_postal}).`,
    );
  } else {
    phrases.push(
      `${nombre(commune.nb)} ${metier.labelPluriel} sont en activité à ${commune.nom} (${commune.code_postal}).`,
    );
  }

  if (commune.population > 0) {
    const situe = `La commune compte ${nombre(commune.population)} habitants${
      dep ? ` dans ${prefixeDepartement(dep.nom)}` : ""
    }`;
    // Avec un seul artisan, le « ratio » ne ferait que répéter la population.
    phrases.push(
      commune.nb > 1
        ? `${situe}, soit environ un professionnel pour ${nombre(
            Math.round(commune.population / commune.nb),
          )} habitants.`
        : `${situe}.`,
    );
  }

  if (nbRge > 0) {
    phrases.push(
      nbRge === 1
        ? `Un artisan dispose de la qualification RGE, requise pour ouvrir droit aux aides à la rénovation énergétique.`
        : `${nombre(nbRge)} d'entre eux disposent de la qualification RGE, requise pour ouvrir droit aux aides à la rénovation énergétique.`,
    );
  }

  if (moyenne !== null && moyenne > 0) {
    phrases.push(
      anciens.length === 1
        ? `L'entreprise est en activité depuis ${accord(moyenne, "an", "ans")}.`
        : `Les entreprises listées ont en moyenne ${accord(moyenne, "an", "ans")} d'ancienneté.`,
    );
  }

  return phrases.join(" ");
}

export function prefixeDepartement(nom: string): string {
  if (/^(Ain|Aisne|Allier|Ardèche|Ariège|Aube|Aude|Aveyron|Essonne|Eure|Hérault|Indre|Isère|Oise|Orne|Yonne)$/.test(nom))
    return `l'${nom}`;
  if (/^(Alpes|Ardennes|Bouches|Côtes|Deux|Hautes|Landes|Pyrénées|Vosges|Yvelines|Hauts|Îles)/.test(nom))
    return `les ${nom}`;
  if (/^(Corrèze|Creuse|Dordogne|Drôme|Gironde|Haute|Loire|Manche|Marne|Mayenne|Meuse|Moselle|Nièvre|Réunion|Sarthe|Savoie|Seine|Somme|Vendée|Vienne|Charente|Corse|Meurthe|Saône|Guadeloupe|Martinique|Guyane)/.test(nom))
    return `la ${nom}`;
  return `le ${nom}`;
}

/** « 1 électriciens » sur 7 626 communes, c'est 7 626 pages qui sonnent faux. */
export function accord(n: number, singulier: string, pluriel: string): string {
  return `${nombre(n)} ${n > 1 ? pluriel : singulier}`;
}

/** Le libellé métier accordé : « 1 électricien » / « 12 électriciens ». */
export function comptageMetier(n: number): string {
  return accord(n, metier.labelSingulier, metier.labelPluriel);
}

export function titreVille(commune: Commune, page: number): string {
  const base = `${capitale(metier.labelSingulier)} à ${commune.nom} (${commune.code_postal}) — ${accord(commune.nb, "professionnel", "professionnels")}`;
  return page > 1 ? `${base} — page ${page}` : base;
}

export function descriptionVille(commune: Commune, page: number): string {
  const base = `Trouvez un ${metier.labelSingulier} à ${commune.nom} (${commune.code_postal}) parmi ${accord(commune.nb, "entreprise en activité", "entreprises en activité")}. Coordonnées, ancienneté, qualification RGE et demande de devis gratuite.`;
  return page > 1 ? `Page ${page} — ${base}` : base;
}

export const capitale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function motCleWidget(commune: Commune): string {
  return `${capitale(metier.labelSingulier)} ${commune.nom} ${commune.code_postal}`;
}
