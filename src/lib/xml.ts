/** Une URL de commune peut contenir & ou ' : à échapper avant injection XML. */
export function echappe(valeur: string): string {
  return valeur
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type Entree = { loc: string; priorite?: number };

export function urlset(entrees: Entree[], modifie: string): string {
  const corps = entrees
    .map(
      (e) =>
        `<url><loc>${echappe(e.loc)}</loc><lastmod>${modifie}</lastmod>` +
        (e.priorite !== undefined ? `<priority>${e.priorite}</priority>` : "") +
        `</url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${corps}</urlset>`;
}

export function sitemapindex(locs: string[], modifie: string): string {
  const corps = locs
    .map(
      (loc) =>
        `<sitemap><loc>${echappe(loc)}</loc><lastmod>${modifie}</lastmod></sitemap>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${corps}</sitemapindex>`;
}

export function reponseXml(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
