import type { MetadataRoute } from "next";
import { absolu } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Les pages 2+ portent déjà noindex, follow : on les laisse crawler
        // pour que Google atteigne les fiches au-delà de la 30e.
        disallow: ["/api/"],
      },
    ],
    sitemap: absolu("/sitemap.xml"),
    host: absolu(""),
  };
}
