import Link from "next/link";
import { EnTeteSection, Question } from "@/components/Ui";

/**
 * Questions pratiques sur les travaux électriques.
 *
 * Elles répondent à ce que cherche un particulier avant d'appeler un artisan —
 * prix, panne, obligations — et non au fonctionnement de l'annuaire. Deux
 * précautions y reviennent, parce qu'elles engagent la sécurité et le
 * portefeuille du lecteur : on renvoie vers un professionnel dès qu'il faut
 * toucher au tableau, et on ne chiffre jamais une aide publique dont le montant
 * change d'une loi de finances à l'autre.
 */
export function Faq() {
  return (
    <section className="border-b border-hairline/80 bg-slate-50/70 py-20">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <EnTeteSection
          pastille="FAQ"
          titre="Questions fréquentes sur l'électricité"
          className="mb-10"
        />
        {/* Deux colonnes indépendantes : l'ouverture d'une réponse ne décale
            que sa propre colonne. */}
        <div className="grid w-full gap-3.5 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-3.5">
            <Question titre="Quel budget prévoir pour une mise aux normes ?" ouvert>
              Comptez 1 500 à 3 500 € pour un logement de 50 m², et 3 500 à
              6 500 € pour 100 m², main-d&apos;œuvre, fournitures et attestation
              Consuel comprises. Le montant dépend surtout de l&apos;état de
              l&apos;installation existante et de la difficulté à faire passer
              les gaines.{" "}
              <Link href="#prix" className="font-semibold text-primary underline">
                Le détail par prestation figure dans nos prix indicatifs
              </Link>
              .
            </Question>

            <Question titre="Pourquoi mon compteur disjoncte-t-il souvent ?">
              Le plus souvent il s&apos;agit d&apos;une surcharge : trop
              d&apos;appareils puissants sur le même circuit. Si le disjoncteur
              retombe alors que vous consommez peu, cherchez plutôt un appareil
              défectueux, en les débranchant un par un. Un déclenchement répété
              de l&apos;interrupteur différentiel 30 mA signale en revanche une
              fuite de courant : faites intervenir un électricien, c&apos;est ce
              dispositif qui protège les personnes.
            </Question>

            <Question titre="Que faire en cas de coupure de courant partielle ?">
              Ouvrez votre tableau : si un disjoncteur a sauté, débranchez les
              appareils du circuit concerné avant de le relever. S&apos;il saute
              de nouveau, un appareil est défectueux ou la ligne est en
              court-circuit. N&apos;intervenez pas vous-même sur les conducteurs
              ni à l&apos;intérieur du tableau — l&apos;arrivée reste sous
              tension même disjoncteur abaissé.
            </Question>

            <Question titre="Quelle est la durée de vie d'un tableau électrique ?">
              Un tableau correctement dimensionné tient vingt à trente ans, mais
              un contrôle tous les dix ans reste recommandé. S&apos;il comporte
              encore des fusibles à fil, ou aucun interrupteur différentiel
              30 mA, il n&apos;est plus conforme à la norme NF C 15-100 et son
              remplacement s&apos;impose.
            </Question>
          </div>

          <div className="flex flex-col gap-3.5">
            <Question titre="Peut-on installer une borne de recharge chez soi ?">
              Oui. Au-delà de 3,7 kW, la pose doit être confiée à un électricien
              qualifié IRVE, en maison comme en copropriété — où le « droit à la
              prise » vous permet d&apos;exiger un raccordement à vos frais. Un
              crédit d&apos;impôt pour les bornes pilotables et une TVA réduite
              allègent la facture&nbsp;; leurs conditions changeant chaque année,
              vérifiez celles en vigueur au moment des travaux.
            </Question>

            <Question titre="Le diagnostic électrique est-il obligatoire pour vendre ?">
              Oui, dès lors que l&apos;installation a plus de quinze ans. Le
              diagnostic de l&apos;état de l&apos;installation intérieure
              d&apos;électricité rejoint alors le dossier de diagnostic technique
              remis à l&apos;acquéreur. Il vaut trois ans pour une vente, six ans
              pour une location, et signale les défauts sans vous obliger à les
              corriger avant la transaction.
            </Question>

            <Question titre="Comment réduire sa facture de chauffage électrique ?">
              Remplacer de vieux convecteurs par des radiateurs à inertie, puis
              programmer les températures pièce par pièce, fait gagner jusqu&apos;à
              25 % sur le poste chauffage. L&apos;isolation reste toutefois le
              premier levier : dans un logement qui fuit, le radiateur le plus
              performant ne rattrapera pas les déperditions.
            </Question>

            <Question titre="Pourquoi choisir un électricien certifié RGE ?">
              RGE — Reconnu Garant de l&apos;Environnement — est une
              qualification délivrée par un organisme accrédité, exigée pour que
              vos travaux ouvrent droit à MaPrimeRénov&apos; ou aux certificats
              d&apos;économies d&apos;énergie. Sans elle, ces aides vous sont
              refusées même si les travaux sont irréprochables. Chaque fiche
              concernée le signale dans notre annuaire.
            </Question>
          </div>
        </div>
      </div>
    </section>
  );
}
