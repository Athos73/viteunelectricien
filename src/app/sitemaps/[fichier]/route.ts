import { notFound } from "next/navigation";
import {
  dateDonnees,
  departementParCode,
  sitemapDepartement,
  tousDepartements,
  toutesRegions,
} from "@/lib/db";
import { categories, tousArticles, urlArticle, urlBlog, urlCategorie } from "@/lib/blog";
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
    { fichier: "blog.xml" },
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

  if (fichier === "blog.xml") {
    const [posts, cats] = await Promise.all([tousArticles(), categories()]);
    const recent = posts[0]?.modifie ?? modifie;
    const entrees: Entree[] = [
      { loc: absolu(urlBlog()), priorite: 0.6, modifie: recent },
      ...cats.map((c) => ({ loc: absolu(urlCategorie(c.slug)), priorite: 0.5 })),
      ...posts.map((p) => ({
        loc: absolu(urlArticle(p.slug)),
        priorite: 0.7,
        modifie: p.modifie,
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
