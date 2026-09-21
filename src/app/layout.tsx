import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import logoMarque from "@/assets/logo-marque.png";
import logoViteUnElectricien from "@/assets/logo-viteunelectricien.png";
import { CtaFlottant } from "@/components/CtaFlottant";
import { metier } from "@/config/metier";
import { BASE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

/** Source unique des liens d'en-tête : la nav desktop et la nav mobile la partagent. */
const LIENS_NAV = [
  { nom: "Accueil", href: "/" },
  { nom: "Régions", href: "/regions" },
  { nom: "Départements", href: "/departements" },
  { nom: "Blog", href: "/blog" },
] as const;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${metier.nomSite} - annuaire des ${metier.labelPluriel} en France`,
    template: `%s | ${metier.nomSite}`,
  },
  description: `Trouvez un ${metier.labelSingulier} près de chez vous et demandez un devis gratuit. Annuaire national des entreprises d'installation électrique en activité.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jakarta.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-surface font-sans text-ink-soft">
        <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-[0_2px_12px_rgb(15_23_42/0.03)] backdrop-blur-md">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/*
              Le logo porte déjà le nom du site : le texte vit dans l'image, on
              le restitue donc via l'alt plutôt que de le doubler en HTML. La
              hauteur pilote la taille (w-auto), l'import statique fournit le
              ratio à Next pour éviter tout décalage au chargement. Seul dans
              une barre de 80 px, il occupe les deux tiers de sa hauteur ; on
              le réduit sous 640 px pour laisser la place au bouton de devis.
            */}
            <Link href="/" className="group flex shrink-0 items-center">
              <Image
                src={logoViteUnElectricien}
                alt={metier.nomSite}
                loading="eager"
                sizes="(min-width: 640px) 192px, 151px"
                className="h-11 w-auto transition-transform group-hover:scale-[1.03] sm:h-14"
              />
            </Link>

            <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft lg:flex">
              {LIENS_NAV.map((lien) => (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className="transition-colors hover:text-primary"
                >
                  {lien.nom}
                </Link>
              ))}
            </nav>

            <Link
              href="/#devis"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:from-sky-600 hover:to-cyan-600 hover:shadow-lg hover:shadow-sky-500/30"
            >
              Demander un devis
            </Link>
          </div>

          {/*
            Sous 1024 px la nav ci-dessus est masquée. Plutôt qu'un menu
            burger - qui imposerait un composant client et du JS sur un site
            dont tout l'intérêt est d'être statique - on rappelle les mêmes
            liens sur une seconde ligne. Le trafic est majoritairement mobile :
            « Régions » doit rester atteignable depuis l'en-tête.
          */}
          <nav className="flex items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-ink-soft sm:px-6 lg:hidden">
            {LIENS_NAV.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="shrink-0 rounded-full border border-hairline px-3.5 py-1.5 transition-colors hover:border-primary/40 hover:text-primary"
              >
                {lien.nom}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <CtaFlottant />

        {/*
          Marge basse généreuse : sur les pages sans formulaire (régions,
          département, pages légales) le bouton flottant reste affiché et
          viendrait sinon masquer la mention de licence.
        */}
        <footer className="border-t border-slate-800 bg-ink pt-16 pb-28 text-slate-400 sm:pb-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              <div>
                {/*
                  Sur le fond sombre du pied de page, le bloc « Vite un » du
                  logo complet - bleu nuit - disparaîtrait : on n'y reprend que
                  le symbole, le nom restant du texte en blanc.
                */}
                <div className="flex items-center gap-3">
                  <Image
                    src={logoMarque}
                    alt=""
                    aria-hidden
                    sizes="44px"
                    className="h-10 w-auto"
                  />
                  <span className="font-heading text-lg font-bold text-white">
                    {metier.nomSite}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed">
                  L&apos;annuaire des entreprises d&apos;installation électrique
                  en activité en France, construit à partir de la base Sirene de
                  l&apos;INSEE.
                </p>
              </div>

              <div>
                <h2 className="font-heading text-sm font-bold tracking-wider text-white uppercase">
                  Découvrir
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li>
                    <Link href="/" className="transition-colors hover:text-sky-400">
                      Accueil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/regions"
                      className="transition-colors hover:text-sky-400"
                    >
                      Toutes les régions
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/departements"
                      className="transition-colors hover:text-sky-400"
                    >
                      Tous les départements
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="transition-colors hover:text-sky-400">
                      Blog : conseils et guides
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading text-sm font-bold tracking-wider text-white uppercase">
                  Informations légales
                </h2>
                <ul className="mt-4 space-y-2.5 text-sm">
                  <li>
                    <Link
                      href="/mentions-legales"
                      className="transition-colors hover:text-sky-400"
                    >
                      Mentions légales
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/confidentialite"
                      className="transition-colors hover:text-sky-400"
                    >
                      Confidentialité
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/retrait"
                      className="transition-colors hover:text-sky-400"
                    >
                      Retrait d&apos;une fiche
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-heading text-sm font-bold tracking-wider text-white uppercase">
                  Source des données
                </h2>
                <p className="mt-4 text-sm leading-relaxed">
                  Répertoire Sirene des entreprises et de leurs établissements,
                  code NAF 43.21A. Seuls les établissements en activité et
                  diffusibles sont publiés.
                </p>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-3 border-t border-slate-800 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} {metier.nomSite}. Tous droits
                réservés.
              </p>
              <p>
                Données Sirene · INSEE - Licence Ouverte 2.0. Ce site est
                indépendant des entreprises référencées.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
