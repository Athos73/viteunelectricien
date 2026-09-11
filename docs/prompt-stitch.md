# Prompt Google Stitch — Vite un électricien

> **Mode d'emploi.** Stitch génère un écran à la fois. Collez d'abord la section
> **1. Système de design** dans le premier message, puis **un seul écran par
> message** (sections 2 à 6). Gardez la même conversation : Stitch conserve le
> style entre les écrans.

---

## 1. Système de design (à coller en premier)

Crée un design system pour un annuaire professionnel français d'électriciens,
nommé **Vite un électricien**. Style : moderne, dense en information, très
« data-driven », inspiré des annuaires B2B de confiance. Ni festif, ni
minimaliste : on doit sentir la donnée officielle et le sérieux administratif.

**Palette**

| Rôle | Couleur | Usage |
|---|---|---|
| Bleu électrique (primaire) | `#0EA5E9` | Boutons, liens, accents, soulignés |
| Bleu électrique foncé | `#0284C7` | Survol des boutons |
| Bleu nuit (fond héros) | `#0F2942` | Bandeaux héros, pied de page |
| Bleu nuit profond | `#0A1F33` | Dégradé bas des héros |
| Gris ardoise 900 | `#0F172A` | Titres |
| Gris ardoise 600 | `#475569` | Texte courant |
| Gris ardoise 400 | `#94A3B8` | Métadonnées, légendes |
| Gris ardoise 200 | `#E2E8F0` | Bordures |
| Gris ardoise 50 | `#F8FAFC` | Fond de page |
| Vert émeraude | `#059669` | Badge « Vérifié SIRENE », statut actif |
| Vert émeraude clair | `#ECFDF5` | Fond des badges verts |
| Blanc | `#FFFFFF` | Cartes |

**Typographie** — une seule famille sans-serif géométrique (Inter, Manrope ou
Plus Jakarta Sans).
- H1 héros : 56–64 px, **800**, interlignage serré (1.05), `letter-spacing: -0.02em`, blanc
- H2 section : 32–36 px, **700**, gris ardoise 900, centré, avec un **trait bleu de 48 px × 3 px** centré dessous
- H3 carte : 16–18 px, **600**
- Corps : 16 px, 400, interlignage 1.7, gris ardoise 600
- Sur-titre pastille : 11 px, **700**, MAJUSCULES, `letter-spacing: 0.1em`

**Composants**
- **Pastille de section** : petite capsule arrondie, fond `#F1F5F9`, bordure `#E2E8F0`, une icône 14 px + texte en majuscules bleu ardoise. Centrée au-dessus des H2. Exemples : `COUVERTURE NATIONALE`, `L'ANNUAIRE DE CONFIANCE`, `FAQ`.
- **Boutons** : capsule pleinement arrondie (`border-radius: 9999px`), fond bleu électrique, texte blanc **600**, padding 14 px × 28 px. Pas de dégradé.
- **Cartes** : blanches, `border-radius: 12px`, bordure 1 px `#E2E8F0`, aucune ombre au repos. Au survol : bordure bleu électrique + ombre douce + translation verticale de −2 px.
- **Bandeau de statistiques** : sur fond bleu nuit, 3 colonnes séparées par un filet vertical 1 px blanc à 20 % d'opacité. Chiffre en 36 px **800** blanc, libellé dessous en 11 px majuscules espacées, bleu clair `#7DD3FC`.
- **Grilles** : 4 colonnes sur desktop, 2 sur tablette, 1 sur mobile. Gouttière 16 px.
- **Conteneur** : largeur max 1200 px, marges latérales 24 px.

**En-tête** (identique sur toutes les pages) — barre blanche collante, ombre
très légère au défilement. À gauche : carré arrondi 36 px en bleu électrique
avec un éclair blanc, suivi du mot-symbole « **Vite un électricien** » (« Vite
un » en gris ardoise 900, « électricien » en bleu électrique). À droite :
`Accueil` · `Régions` (avec chevron) · `Recherche`, puis un bouton capsule bleu
« 🔍 Trouver un pro ». L'onglet actif est une capsule au fond bleu très pâle.

**Pied de page** — fond bleu nuit, 4 colonnes : le mot-symbole + une phrase sur
la source des données ; « Régions » ; « Départements populaires » ; « Informations »
(Mentions légales, Confidentialité, Retrait d'une fiche). Ligne du bas :
« Données issues de la base Sirene de l'INSEE — Licence Ouverte Etalab 2.0 ».

**Langue** : tout en français, avec les accents et les espaces insécables avant
les `?` et `:`.

---

## 2. Écran « Accueil »

Page d'accueil de l'annuaire.

**Héros** — pleine largeur, hauteur ~620 px. Photographie en fond : mains d'un
électricien travaillant sur un tableau électrique / multimètre, recouverte d'un
voile bleu nuit `#0F2942` à 88 % d'opacité, dégradé plus sombre vers le bas.
Contenu aligné à gauche dans le conteneur :
- H1 sur deux lignes : **« Trouvez un électricien professionnel certifié »**
- Paragraphe 18 px, blanc à 80 %, largeur max 560 px : « L'annuaire de référence basé sur les données officielles SIRENE. Accédez instantanément à plus de 106 000 entreprises d'installation électrique en activité partout en France. »
- **Barre de recherche** : champ blanc pleinement arrondi, hauteur 64 px, ombre portée large et douce, placeholder « Code postal, ville ou nom d'entreprise… », et à l'intérieur à droite un bouton capsule bleu « Rechercher ».
- **Bandeau de statistiques** sous la recherche, 3 colonnes : `106 292` / ENTREPRISES — `18 334` / COMMUNES COUVERTES — `100 %` / DONNÉES SIRENE

**Section « L'annuaire de confiance »** — fond blanc, 2 colonnes (7/5).
À gauche : pastille `ⓘ L'ANNUAIRE DE CONFIANCE`, H2 aligné à gauche « Vite un
électricien, l'annuaire le plus complet de France », puis 3 paragraphes.
À droite : une carte bordée avec un petit en-tête « Code NAF 4321A », le
libellé « Travaux d'installation électrique dans tous locaux », un filet
séparateur, puis 3 lignes clé/valeur : `Source` → INSEE Sirene ; `Mise à jour`
→ Quotidienne ; `Établissements RGE` → 5 625.

**Section « Villes les plus recherchées »** — fond gris ardoise 50. Pastille
`🔥 FORTE DEMANDE`, H2 centré. Grille de 4 × 3 cartes compactes : nom de ville
en **600**, dessous « 370 électriciens » en 13 px gris. Petit chevron à droite.

**Section « Trouver un électricien par région »** — fond blanc, reprendre la
grille de régions décrite à l'écran 3.

**Section FAQ** — fond gris ardoise 50, pastille `FAQ`, H2 centré « Questions
fréquentes », accordéon sur 4 lignes, largeur max 820 px centrée :
- Comment les entreprises sont-elles sélectionnées ?
- Que signifie le label RGE ?
- Le service est-il payant ?
- Je suis électricien, comment modifier ou retirer ma fiche ?

**Bloc d'appel à l'action** — pleine largeur, fond bleu nuit. Titre blanc
centré « Recevez jusqu'à 3 devis gratuits », sous-titre, et un encadré blanc
arrondi de 680 px de large réservé à un formulaire (afficher un cadre avec la
mention « zone widget partenaire »). Sous l'encadré, en 12 px bleu clair :
« Gratuit et sans engagement ».

---

## 3. Écran « Page région »

Exemple : Auvergne-Rhône-Alpes.

**Héros compact** — hauteur 340 px, fond bleu nuit (sans photo), fil d'Ariane
en 13 px bleu clair : `Accueil › Auvergne-Rhône-Alpes`. H1 « Électriciens en
Auvergne-Rhône-Alpes », paragraphe d'introduction, puis bandeau de statistiques
3 colonnes : `12 847` / ÉLECTRICIENS — `12` / DÉPARTEMENTS — `1 842` / CERTIFIÉS RGE

**Grille des départements** — fond blanc, pastille `⊞ COUVERTURE RÉGIONALE`,
H2 centré « Les départements d'Auvergne-Rhône-Alpes » avec trait bleu dessous,
sous-titre centré. Grille 4 colonnes de cartes : à gauche un carré arrondi
44 px au fond bleu très pâle contenant une icône, puis le nom du département en
**600** et dessous « Voir les électriciens → » en 13 px bleu électrique ; un
chevron `›` gris à l'extrême droite. Une carte en état survolé : bordure bleue,
fond bleu à 3 %.

**Section « Comment choisir votre électricien »** — fond gris ardoise 50, 4
étapes numérotées en 2 × 2. Chaque étape : un cercle plein bleu électrique de
32 px avec le chiffre en blanc **700**, à droite un titre **600** et deux lignes
de texte. Étapes : 1 · Vérifiez l'immatriculation — 2 · Comparez plusieurs
devis — 3 · Contrôlez les certifications — 4 · Demandez un Consuel.

**FAQ régionale** — fond blanc, pastille `FAQ`, H2 centré sur deux lignes
« Questions fréquentes — Électriciens en Auvergne-Rhône-Alpes », accordéon de 4
questions : « Combien coûte un électricien en Auvergne-Rhône-Alpes ? »,
« Comment trouver un électricien disponible rapidement ? », « Quelles aides
financières pour mes travaux électriques ? », « Quelle différence entre un
artisan électricien et une entreprise d'électricité générale ? ».

---

## 4. Écran « Page département »

Exemple : Allier (03).

Héros compact identique à l'écran 3, fil d'Ariane
`Accueil › Auvergne-Rhône-Alpes › Allier`, statistiques : `1 284` /
ÉLECTRICIENS — `203` / COMMUNES — `03` / CODE DÉPARTEMENT.

**Corps de page** — pastille `📍 TOUTES LES COMMUNES`, H2 « Les communes de
l'Allier ». Sous le H2, une **barre de filtre alphabétique** : une rangée de
capsules A B C D … Z, celle active en bleu plein.

**Grille des communes** — 4 colonnes, cartes compactes (hauteur ~72 px) :
nom de la commune en **600** gris ardoise 900, dessous en 12 px gris ardoise
400 « 03500 · 7 électriciens », et une petite icône d'épingle de localisation
gris clair à droite. Tri alphabétique. Montrer une carte survolée : fond bleu
très pâle, bordure bleue.

Sous la grille, une **pagination** discrète et une phrase en 13 px gris :
« 203 communes couvertes dans l'Allier ».

---

## 5. Écran « Page ville »

Exemple : Abrest (03200). **C'est l'écran le plus important du site.**

**Héros compact** — fond bleu nuit, fil d'Ariane
`Accueil › Auvergne-Rhône-Alpes › Allier › Abrest`. H1 « Électricien à Abrest
(03200) », paragraphe « Trouvez un électricien qualifié pour vos travaux
d'installation, dépannages et mises aux normes à Abrest. Données vérifiées
SIRENE. », bandeau de statistiques : `11` / PROS TROUVÉS — `03200` / CODE
POSTAL — `100 %` / SIRENE.

**Section éditoriale** — fond blanc, 2 colonnes (7/5).
À gauche : pastille `📍 ABREST (03200)`, H2 aligné à gauche « Électriciens
professionnels à Abrest », puis 3 paragraphes de texte courant (mentionner
**INSEE (SIRENE)** en gras).
À droite : carte bordée titrée « Services disponibles à Abrest » contenant une
liste à puces de coches vertes : Installation électrique neuve · Rénovation &
mise aux normes · Dépannage & urgence 24 h · Tableau électrique · Panneaux
solaires (RGE) · Borne de recharge · Domotique & automatismes · Diagnostic
électrique.

**Bloc devis** — encadré pleine largeur, fond bleu très pâle `#F0F9FF`, bordure
bleu clair, `border-radius: 16px` : titre « Demandez plusieurs devis à Abrest »,
sous-titre, et une zone rectangulaire réservée au formulaire partenaire.

**Section « Artisans électriciens à Abrest »** — fond gris ardoise 50, H2 aligné
à gauche. **Grille de 3 colonnes de fiches entreprise** :

Chaque carte (blanche, arrondie 12 px, bordure fine, padding 20 px) :
- **Rangée du haut** : à gauche un badge capsule vert pâle « ● Actif » ; à droite un badge capsule vert pâle avec une coche « Vérifié SIRENE »
- **Nom de l'entreprise** en 16 px **700**, gris ardoise 900, sur deux lignes maximum
- **Adresse** avec une petite icône d'épingle : « 37 RUE DE LA LIBERTÉ 03200 ABREST » en 13 px gris ardoise 600
- **Rangée de badges** : capsule grise « 12 ans d'activité », capsule grise « 1 ou 2 salariés », et si applicable une capsule **vert émeraude** « RGE · 2 qualifications »
- **Filet séparateur**, puis rangée du bas : « SIREN : 428586796 » en 12 px gris ardoise 400 à gauche, « Voir le profil → » en 13 px bleu électrique **600** à droite

**Section « Électriciens à proximité »** — fond blanc, rangée de capsules
cliquables : nom de commune + « (7 · 4 km) » en gris.

---

## 6. Écran « Fiche entreprise »

**Héros compact** bleu nuit, fil d'Ariane complet jusqu'au nom de l'entreprise.
H1 = nom de l'entreprise. Sous le H1, une rangée de badges : « ● Actif »,
« ✓ Vérifié SIRENE », et « RGE » en vert émeraude. Sous-titre : « Électricien à
Abrest (03200) ».

**Corps** — 2 colonnes (8/4).

Colonne principale :
- **Encadré RGE** (si applicable) : fond vert très pâle, bordure vert clair, une icône feuille, titre « Qualification RGE — Reconnu Garant de l'Environnement », puis deux lignes expliquant l'accès à MaPrimeRénov' et aux CEE.
- **Carte « Informations légales »** : liste de définitions sur deux colonnes, chaque ligne séparée par un filet — Adresse, SIRET, SIREN, Date de création, Ancienneté, Effectif, Activité (NAF 43.21A).
- **Carte « Zone d'intervention »** : un aplat de carte stylisé avec une épingle, et dessous les communes limitrophes en capsules.

Colonne latérale (collante au défilement) :
- **Carte d'appel à l'action** : fond bleu nuit, texte blanc, titre « Obtenir un devis », sous-titre, bouton capsule blanc à texte bleu « Demander un devis gratuit ».
- **Carte « Sources »** : petit texte gris expliquant l'origine Sirene, avec un lien « Demander le retrait de cette fiche ».

**Bas de page** — H2 « Autres électriciens à Abrest » et 4 fiches entreprise au
format de l'écran 5.

---

## 7. Règles transverses (à rappeler si Stitch dérive)

- **Aucune note en étoiles, aucun avis client, aucun compteur d'avis.** L'annuaire ne collecte pas d'avis : les seuls signaux de confiance sont le statut d'activité, le label RGE, l'ancienneté et l'effectif.
- **Aucun numéro de téléphone ni adresse e-mail** sur les fiches entreprise.
- Pas de photographie de personne sur les fiches entreprise ni sur les cartes de commune — uniquement dans le héros de l'accueil.
- Pas de dégradés criards, pas d'ombres marquées, pas de coins complètement carrés.
- Densité : ces pages contiennent beaucoup d'entités, la mise en page doit rester compacte et lisible plutôt qu'aérée.
- Prévoir les états **survol** et **actif** pour toutes les cartes cliquables.
- Concevoir en **desktop 1440 px**, puis décliner en **mobile 390 px**.
