import { notFound } from "next/navigation";
import {
  dateDonnees,
  departementParCode,
  sitemapDepartement,
  tousDepartements,
  toutesRegions,
} from "@/lib/db";
import {
  absolu,
  urlDepartement,
  urlFiche,
  urlRegion,
  urlVille,
} from "@/lib/site";
import { reponseXml, urlset, type Entree } from "@/lib/xml";

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { fichier: "zones.xml" },
    ...tousDepartements().map((d) => ({ fichier: `${d.code}.xml` })),
  ];
}

const PAGES_FIXES = [
  "/",
  "/regions",
  "/departements",
  "/mentions-legales",
  "/confidentialite",
  "/retrait",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fichier: string }> },
) {
  const { fichier } = await params;
  const modifie = dateDonnees();

  if (fichier === "zones.xml") {
    const entrees: Entree[] = [
      ...PAGES_FIXES.map((p) => ({ loc: absolu(p), priorite: p === "/" ? 1 : 0.4 })),
      ...toutesRegions().map((r) => ({ loc: absolu(urlRegion(r.slug)), priorite: 0.7 })),
      ...tousDepartements().map((d) => ({
        loc: absolu(urlDepartement(d.slug)),
        priorite: 0.7,
      })),
    ];
    return reponseXml(urlset(entrees, modifie));
  }

  const code = fichier.replace(/\.xml$/, "");
  if (!departementParCode(code)) notFound();

  const { communes, fiches } = sitemapDepartement(code);
  const entrees: Entree[] = [
    ...communes.map((c) => ({ loc: absolu(urlVille(c.slug)), priorite: 0.8 })),
    ...fiches.map((f) => ({ loc: absolu(urlFiche(f.ville, f.fiche)), priorite: 0.5 })),
  ];
  return reponseXml(urlset(entrees, modifie));
}
