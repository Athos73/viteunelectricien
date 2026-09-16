# Orchestration n8n des leads

Deux workflows, à importer depuis `docs/n8n/` :

| Fichier | Déclencheur | Rôle |
| --- | --- | --- |
| `01-reception-des-leads.json` | Webhook `POST /webhook/devis` | Archive la demande dans Google Sheets, puis notifie — ou alerte si HelloArtisan a refusé le lead |
| `02-suivi-du-statut.json` | Planifié, toutes les 6 h | Rappelle `/json/lead/status` sur les leads encore en attente et met le classeur à jour |

Le site n'appelle que le premier. Le second lit et écrit dans le même classeur :
c'est le classeur, et non n8n, qui porte l'état.

## 1. Le classeur Google Sheets

Créez un classeur, nommez l'onglet **Leads**, et collez cette ligne d'en-tête en
**A1** — les noms doivent être exacts, le nœud Google Sheets fait
correspondre les colonnes par leur intitulé :

```
reference	recu_le	source	statut	statut_maj	civilite	prenom	nom	email	telephone	code_postal	ville	adresse	metier	worktype	occupation	logement	delai	budget	commentaire	ha_code	ha_message	ha_id	ha_token
```

(les séparateurs sont des tabulations : un collage direct remplit 24 colonnes)

`statut` prend « Non traité » à l'arrivée, puis « Validé » ou « Annulé » une fois
que le suivi a interrogé HelloArtisan. « Doublon » et « Échec » sont des états
terminaux posés dès la réception, que le suivi ignore.

L'**ID du classeur** est le segment de son URL entre `/d/` et `/edit`. Reportez-le
dans les deux workflows, à la place de `REMPLACER_PAR_ID_DU_CLASSEUR` (trois
nœuds Google Sheets au total).

## 2. Les trois identifiants n8n

**Header Auth** — protège le webhook. Créez une credential de type *Header Auth* :

- Name : `Authorization`
- Value : `Bearer <votre-jeton>` — le même que `N8N_LEAD_WEBHOOK_TOKEN` côté Vercel

**Google Sheets OAuth2** — sur les trois nœuds Google Sheets.

**SMTP** — sur les deux nœuds e-mail. Remplacez aussi `REMPLACER@votredomaine.fr`
dans le champ *From Email*. Si vous préférez passer par Gmail en OAuth, remplacez
les nœuds *Send Email* par des nœuds *Gmail* : le corps du message se recopie tel
quel.

## 3. Le suivi n'a besoin d'aucun identifiant HelloArtisan

Le nœud *Statut du lead* n'appelle pas HelloArtisan : il appelle
`POST /api/devis/statut` sur le site, qui interroge la plateforme pour lui et
recopie la réponse telle quelle. Les identifiants HelloArtisan restent donc au
seul endroit où ils vivent déjà, les variables d'environnement Vercel.

L'authentification se fait avec la **même credential *Header Auth*** que le
webhook de réception : sélectionnez-la dans le champ *Credential for Header
Auth* du nœud. Un seul jeton sécurise les deux sens, entrant et sortant.

> Une version antérieure de ce workflow appelait `lead-ws.helloartisan.com`
> directement, avec les identifiants lus par `{{ $env.… }}`. n8n bloque par
> défaut la lecture de l'environnement dans les expressions
> (`[ERROR: access to env vars denied]`), et cette voie imposait de recopier les
> identifiants dans un troisième endroit. Elle a été abandonnée.

## 4. Brancher le site

Dans Vercel, **Settings → Environments → Production**, ajoutez :

| Clé | Valeur | Type |
| --- | --- | --- |
| `N8N_LEAD_WEBHOOK_URL` | `https://<votre-n8n>/webhook/devis` | Config |
| `N8N_LEAD_WEBHOOK_TOKEN` | le jeton du *Header Auth* | Secret |

Puis **Redeploy** : une variable ajoutée après coup n'atteint jamais un
déploiement déjà construit.

**Attention à l'URL.** n8n en expose deux par webhook :

- `/webhook-test/devis` ne répond **que** pendant que vous avez cliqué sur
  « Listen for test event », et une seule fois ;
- `/webhook/devis` est l'URL de production, active dès que le workflow est
  **Active**.

C'est la seconde qu'il faut donner à Vercel. Un workflow importé arrive
désactivé : pensez à l'activer, sinon le site recevra un 404 sur chaque lead.

## 5. Ce que le site envoie

Charge utile détaillée dans [helloartisan.md](helloartisan.md). L'essentiel :

```json
{
  "reference": "vue-0f2c1b9a4d3e5",
  "recuLe": "2026-09-16T20:11:04.882Z",
  "site": "viteunelectricien.fr",
  "source": "ville:nantes-44000",
  "lead": { "…": "la charge utile envoyée à HelloArtisan" },
  "helloartisan": { "code": 0, "message": "…", "id": "…", "token": "…" }
}
```

Le nœud *Préparer la ligne* fait deux choses qui méritent d'être connues :

- il traduit les entiers de l'API en libellés lisibles (`isowner: 1` devient
  « Propriétaire », `budget: 2` devient « 1 500 à 6 000 € ») ;
- il fusionne `cellphone` et `landline` en une seule colonne `telephone`,
  l'API n'en renseignant jamais qu'un des deux.

## 6. Le cas du doublon

HelloArtisan dédoublonne sur le couple contact + métier. Un `code: 5` signifie
que **rien n'a été créé** : `id` et `token` reviennent à `null`. La ligne est
tout de même archivée, avec le statut « Doublon », et part vers l'alerte plutôt
que vers la notification de nouveau lead. Le suivi planifié l'ignore, faute de
jeton à interroger.

## 7. Vérifier la chaîne

Une fois les deux workflows actifs et le site redéployé, envoyez une demande de
test. Le plus propre est de rejouer un lead déjà importé : HelloArtisan répond
`code 5`, **aucun nouveau lead n'est créé**, et vous voyez tout de même la ligne
apparaître dans le classeur et l'alerte partir.

```bash
curl -s https://viteunelectricien.fr/api/devis -H 'Content-Type: application/json' -d '{"worktype":218,"isowner":1,"housingtype":2,"delay":1,"budget":1,"comment":"TEST - NE PAS TRAITER","civility":"Mme","firstname":"TEST","lastname":"TEST-NE-PAS-TRAITER-2","email":"test-integration@viteunelectricien.fr","telephone":"+33 6 39 98 00 03","zipcode":"44000","city":"Nantes","consentement":true,"source":"verif:n8n"}'
```

Pour éprouver le chemin nominal (`code 0`, notification de nouveau lead), changez
l'adresse e-mail : un contact inconnu de la plateforme crée un vrai lead, à
supprimer ensuite au back-office.
