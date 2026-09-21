import type { NextConfig } from "next";

/**
 * Les images du blog (à la une et dans les articles) sont servies par le
 * WordPress headless : `next/image` doit être autorisé à les optimiser.
 */
const wordpress = process.env.WORDPRESS_URL
  ? new URL(process.env.WORDPRESS_URL)
  : null;

const nextConfig: NextConfig = {
  // better-sqlite3 est un module natif : il doit rester hors du bundle, et le
  // fichier .db doit être embarqué dans les fonctions serverless Vercel.
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/**": ["./data/annuaire.db", "./data/annuaire.meta.json"],
  },
  images: {
    remotePatterns: wordpress
      ? [
          {
            protocol: wordpress.protocol.replace(":", "") as "http" | "https",
            hostname: wordpress.hostname,
            pathname: `${wordpress.pathname.replace(/\/$/, "")}/wp-content/uploads/**`,
          },
          // CDN d'images Jetpack (i0.wp.com…), activé par défaut chez
          // plusieurs hébergeurs WordPress.
          { protocol: "https", hostname: "*.wp.com" },
        ]
      : [],
  },
};

export default nextConfig;
