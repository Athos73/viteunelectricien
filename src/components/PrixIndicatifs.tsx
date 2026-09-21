import { Conteneur, EnTeteSection } from "@/components/Ui";

/**
 * Fourchettes de prix affichées sous le formulaire.
 *
 * Ce sont des ordres de grandeur du marché, pas des tarifs négociés avec les
 * entreprises de l'annuaire : la mention sous le tableau le dit au visiteur, et
 * rien ici n'est balisé en données structurées - un prix déclaré à un moteur
 * engagerait le site sur des montants qu'il ne pratique pas.
 *
 * Les espaces des montants sont insécables : « 1 500 € » ne doit jamais se
 * couper en fin de ligne.
 */
const LIGNES = [
  {
    prestation: "Mise aux normes (50 m²)",
    bas: "1 500 €",
    haut: "3 500 €",
    inclus: "Main-d'œuvre, fournitures, Consuel",
  },
  {
    prestation: "Mise aux normes (100 m²)",
    bas: "3 500 €",
    haut: "6 500 €",
    inclus: "Main-d'œuvre, fournitures, Consuel",
  },
  {
    prestation: "Tableau électrique (neuf)",
    bas: "800 €",
    haut: "2 500 €",
    inclus: "Tableau, disjoncteurs, câblage",
  },
  {
    prestation: "Rénovation complète (80 m²)",
    bas: "6 000 €",
    haut: "12 000 €",
    inclus: "Câblage complet, tableau, prises",
  },
  {
    prestation: "Borne de recharge (Wallbox)",
    bas: "800 €",
    haut: "2 000 €",
    inclus: "Borne + pose + mise en service",
  },
  {
    prestation: "Dépannage (1re heure)",
    bas: "80 €",
    haut: "200 €",
    inclus: "Déplacement + diagnostic inclus",
  },
  {
    prestation: "Tarif horaire artisan",
    bas: "40 €/h HT",
    haut: "80 €/h HT",
    inclus: "Variable selon région et chantier",
  },
] as const;

/**
 * Tableau des prix indicatifs.
 *
 * Le balisage reste un vrai tableau - c'est bien de la donnée tabulaire, et les
 * lecteurs d'écran comme les moteurs y lisent l'association ligne/colonne. Sous
 * 640 px, quatre colonnes deviendraient illisibles : chaque ligne bascule alors
 * en bloc, les deux montants côte à côte sous l'intitulé. Les en-têtes de
 * colonne disparaissant dans cette vue, chaque montant reprend son libellé -
 * seuls « Prix bas » et « Prix haut » sont répétés, jamais les données.
 */
export function PrixIndicatifs() {
  return (
    <section
      id="prix"
      className="scroll-mt-24 border-b border-hairline/80 bg-slate-50/70 py-20"
    >
      <Conteneur className="flex flex-col items-center">
        <EnTeteSection
          ton="ambre"
          pastille="Budget"
          titre="Prix indicatifs des travaux électriques en 2026"
          className="mb-4"
        />
        <p className="mb-12 max-w-3xl text-center leading-relaxed">
          Ces fourchettes de prix sont données à titre indicatif pour la France
          métropolitaine. Les tarifs réels dépendent de votre région, de
          l&apos;état de l&apos;installation et de l&apos;artisan choisi.
        </p>

        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-hairline bg-white shadow-soft">
          <table className="w-full text-left">
            <thead className="hidden bg-primary text-white sm:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-4 font-heading text-sm font-bold">
                  Prestation
                </th>
                <th scope="col" className="px-5 py-4 font-heading text-sm font-bold">
                  Prix bas
                </th>
                <th scope="col" className="px-5 py-4 font-heading text-sm font-bold">
                  Prix haut
                </th>
                <th scope="col" className="px-5 py-4 font-heading text-sm font-bold">
                  Inclus
                </th>
              </tr>
            </thead>
            <tbody>
              {LIGNES.map((ligne) => (
                <tr
                  key={ligne.prestation}
                  className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-t border-slate-100 px-5 py-4 first:border-t-0 sm:table-row sm:border-t sm:px-0 sm:py-0"
                >
                  <th
                    scope="row"
                    className="order-1 w-full font-heading text-[15px] font-semibold text-ink sm:table-cell sm:w-auto sm:px-5 sm:py-4 sm:text-left sm:font-medium"
                  >
                    {ligne.prestation}
                  </th>
                  <td className="order-3 font-heading font-bold whitespace-nowrap text-primary sm:table-cell sm:px-5 sm:py-4">
                    <span className="mr-1.5 text-xs font-medium text-ink-muted sm:hidden">
                      Prix bas
                    </span>
                    {ligne.bas}
                  </td>
                  <td className="order-4 font-heading font-bold whitespace-nowrap text-primary sm:table-cell sm:px-5 sm:py-4">
                    <span className="mr-1.5 text-xs font-medium text-ink-muted sm:hidden">
                      Prix haut
                    </span>
                    {ligne.haut}
                  </td>
                  <td className="order-2 w-full text-sm text-ink-soft sm:table-cell sm:w-auto sm:px-5 sm:py-4">
                    {ligne.inclus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-3xl text-center text-xs leading-relaxed text-ink-muted">
          Tarifs France métropolitaine 2026, TTC sauf mention HT. Source :
          moyennes professionnelles du secteur électrique.
        </p>
      </Conteneur>
    </section>
  );
}
