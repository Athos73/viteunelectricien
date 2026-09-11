import { tousDepartements } from "@/lib/db";
import { absolu } from "@/lib/site";
import { reponseXml, sitemapindex } from "@/lib/xml";

export const revalidate = 86400;

/**
 * ~125 000 URL au total : très au-delà de la limite de 50 000 par fichier.
 * D'où un index qui pointe vers un sitemap par département, plus un fichier
 * « zones » pour les pages transverses.
 */
export function GET() {
  const modifie = new Date().toISOString();
  const locs = [
    absolu("/sitemaps/zones.xml"),
    ...tousDepartements().map((d) => absolu(`/sitemaps/${d.code}.xml`)),
  ];
  return reponseXml(sitemapindex(locs, modifie));
}
