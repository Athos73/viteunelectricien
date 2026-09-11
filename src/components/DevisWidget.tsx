"use client";

import { useEffect, useRef, useState } from "react";
import { metier } from "@/config/metier";

const ENDPOINT = "https://www.viteundevis.com/marqueblanche/";

declare global {
  interface Window {
    vud_partenaire_id?: string;
    vud_box_id?: string;
    vud_keyword?: string;
  }
}

type Props = {
  /** Sert de mot-clé de ciblage et d'attribution côté plateforme d'affiliation. */
  motCle: string;
};

export function DevisWidget({ motCle }: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [echec, setEchec] = useState(false);

  useEffect(() => {
    const cible = conteneur.current;
    if (!cible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(cible);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    window.vud_partenaire_id = metier.widget.partenaireId;
    window.vud_box_id = metier.widget.boxId;
    window.vud_keyword = encodeURI(motCle);

    const url = `${ENDPOINT}?b=${metier.widget.boxId}&p=${metier.widget.partenaireId}&c=${encodeURIComponent(motCle)}`;
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.async = true;
    script.onerror = () => setEchec(true);
    document.body.appendChild(script);

    return () => {
      script.remove();
      const hote = document.getElementById(metier.widget.containerId);
      if (hote) hote.innerHTML = "";
    };
  }, [visible, motCle]);

  return (
    <div ref={conteneur} className="min-h-[420px]">
      <div id={metier.widget.containerId} />
      {echec && (
        <p className="text-sm text-slate-600">
          Le formulaire de devis est momentanément indisponible.{" "}
          <a href="/contact" className="underline">
            Décrivez-nous votre besoin
          </a>{" "}
          et nous vous mettons en relation.
        </p>
      )}
    </div>
  );
}
