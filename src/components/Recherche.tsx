"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icone } from "@/components/Icone";
import { urlVille } from "@/lib/site";

type Suggestion = { nom: string; code_postal: string; slug: string; nb: number };

export function Recherche() {
  const [q, setQ] = useState("");
  const [resultats, setResultats] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const conteneur = useRef<HTMLDivElement>(null);

  // Vider la liste est dérivé de la saisie, pas d'un setState dans l'effet :
  // React n'a pas besoin d'un second rendu pour savoir qu'il n'y a rien à voir.
  const court = q.trim().length < 2;
  const visibles = court ? [] : resultats;

  useEffect(() => {
    if (court) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/recherche?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          setResultats(await res.json());
          setOuvert(true);
        }
      } catch {
        /* requête annulée */
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, court]);

  useEffect(() => {
    const hors = (e: MouseEvent) => {
      if (!conteneur.current?.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener("mousedown", hors);
    return () => document.removeEventListener("mousedown", hors);
  }, []);

  return (
    <div ref={conteneur} className="relative w-full">
      <label htmlFor="recherche" className="sr-only">
        Rechercher une commune
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-2.5 pl-5 shadow-float transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-sky-100 sm:rounded-full">
        <Icone nom="recherche" className="size-6 shrink-0 text-primary" />
        <input
          id="recherche"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => visibles.length > 0 && setOuvert(true)}
          placeholder="Votre ville ou code postal…"
          autoComplete="off"
          className="w-full bg-transparent py-2.5 text-base text-ink placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {ouvert && visibles.length > 0 && (
        <ul className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-hairline bg-white py-1.5 text-left shadow-float">
          {visibles.map((r) => (
            <li key={r.slug}>
              <Link
                href={urlVille(r.slug)}
                className="flex items-baseline justify-between gap-3 px-5 py-2.5 text-sm transition-colors hover:bg-sky-50"
              >
                <span className="font-medium text-ink">
                  {r.nom}{" "}
                  <span className="font-normal text-ink-muted">
                    ({r.code_postal})
                  </span>
                </span>
                <span className="shrink-0 text-xs text-ink-muted">
                  {r.nb} pro{r.nb > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
