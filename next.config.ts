import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 est un module natif : il doit rester hors du bundle, et le
  // fichier .db doit être embarqué dans les fonctions serverless Vercel.
  serverExternalPackages: ["better-sqlite3"],
  outputFileTracingIncludes: {
    "/**": ["./data/annuaire.db", "./data/annuaire.meta.json"],
  },
};

export default nextConfig;
