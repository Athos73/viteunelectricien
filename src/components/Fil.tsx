import Link from "next/link";
import { Icone } from "@/components/Icone";
import { absolu } from "@/lib/site";

export type Maillon = { nom: string; href?: string };

export function Fil({ maillons }: { maillons: Maillon[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: maillons.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nom,
      ...(m.href ? { item: absolu(m.href) } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Fil d'Ariane" className="text-xs font-medium">
        <ol className="flex flex-wrap items-center gap-1">
          {maillons.map((m, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && (
                <Icone nom="chevron" className="size-3.5 text-slate-400" />
              )}
              {m.href ? (
                <Link
                  href={m.href}
                  className="text-ink-muted transition-colors hover:text-primary"
                >
                  {m.nom}
                </Link>
              ) : (
                <span className="text-ink-soft">{m.nom}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
