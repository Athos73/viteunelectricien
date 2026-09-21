import type { MetadataRoute } from "next";
import { absolu } from "@/lib/site";

/**
 * Robots d'IA, déclarés explicitement.
 *
 * Attention au piège : d'après la spécification robots.txt, un agent applique
 * UNIQUEMENT le groupe le plus spécifique qui le concerne - les groupes ne se
 * cumulent pas. Dès qu'on nomme « GPTBot », il cesse de lire le groupe « * » et
 * n'hérite donc plus de son `Disallow`. Chaque groupe ci-dessous doit reprendre
 * les mêmes exclusions, sans quoi nommer un robot reviendrait à lui ouvrir
 * /api/ par mégarde.
 */
const EXCLUSIONS = ["/api/"];

/**
 * Robots d'entraînement : ils alimentent les corpus des modèles. Les bloquer
 * n'empêche pas d'être cité dans les réponses, mais retire le site des futurs
 * entraînements.
 */
const IA_ENTRAINEMENT = [
  "GPTBot", // OpenAI
  "ClaudeBot", // Anthropic
  "Google-Extended", // Google (jeton robots.txt pour Gemini, pas un crawler)
  "Applebot-Extended", // Apple Intelligence
  "meta-externalagent", // Meta
  "Amazonbot", // Amazon
  "Bytespider", // ByteDance
  "cohere-ai", // Cohere
  "CCBot", // Common Crawl, qui alimente de nombreux corpus
];

/**
 * Robots de réponse : ceux qui vont chercher une page au moment où un
 * utilisateur pose sa question, pour la citer. Ce sont eux qui apportent de la
 * visibilité - les bloquer revient à disparaître des réponses.
 */
const IA_REPONSE = [
  "OAI-SearchBot", // index de recherche ChatGPT
  "ChatGPT-User", // navigation déclenchée par un utilisateur
  "Claude-SearchBot", // index de recherche Claude
  "Claude-User", // navigation déclenchée par un utilisateur
  "PerplexityBot", // index Perplexity
  "Perplexity-User",
  "MistralAI-User",
  "DuckAssistBot", // DuckDuckGo
  "Applebot", // Siri et Spotlight
  "YouBot", // You.com
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Les pages 2+ portent déjà noindex, follow : on les laisse crawler
        // pour que Google atteigne les fiches au-delà de la 30e.
        disallow: EXCLUSIONS,
      },
      { userAgent: IA_REPONSE, allow: "/", disallow: EXCLUSIONS },
      { userAgent: IA_ENTRAINEMENT, allow: "/", disallow: EXCLUSIONS },
    ],
    sitemap: absolu("/sitemap.xml"),
    host: absolu(""),
  };
}
