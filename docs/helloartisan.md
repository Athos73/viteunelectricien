# Intégration HelloArtisan (API d'import de leads)

Le formulaire de devis du site n'est plus un widget en marque blanche : c'est un
formulaire maison qui poste sur `/api/devis`, lequel appelle l'API REST
HelloArtisan côté serveur.

- Spécification : <https://portal.swaggerhub.com/apis/batiweb/api-import-leads/latest>
- Base : `https://lead-ws.helloartisan.com`
- Contact éditeur : technique@helloartisan.com

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/components/FormulaireDevis.tsx` | Formulaire en quatre étapes (client) |
| `src/lib/devis.ts` | Types, énumérations et validation partagés client/serveur |
| `src/config/prestations.ts` | Les 9 métiers `worktype` proposés sur le site |
| `src/app/api/devis/route.ts` | Endpoint REST : validation, import, recopie n8n |
| `src/lib/helloartisan.ts` | Client de l'API (serveur uniquement) |
| `scripts/metiers-helloartisan.ts` | `npm run metiers` : catalogue + contrôle de dérive |

## Variables d'environnement

Voir `.env.example`. En production, les reporter dans les *Environment
Variables* du projet Vercel.

```
HELLOARTISAN_LOGIN=…
HELLOARTISAN_PASSWORD=…
HELLOARTISAN_ENV=PROD        # ou PREP
N8N_LEAD_WEBHOOK_URL=        # facultatif
N8N_LEAD_WEBHOOK_TOKEN=      # facultatif, envoyé en Bearer
```

## Trois pièges de cette API

1. **Le statut HTTP est toujours 200**, même sur identifiants invalides ou lead
   refusé. Seul le champ `code` de la charge utile fait foi. Ne jamais se fier à
   `response.ok` pour décider d'un succès.
2. **Les identifiants voyagent dans le corps de la requête** (objet `security`),
   y compris sur `GET /activities` — un GET *avec* body, que la spécification
   Fetch interdit. `fetch()` lève avant d'ouvrir la connexion ; `listerMetiers()`
   passe donc par `node:https`.
3. **Les DOM ne sont pas couverts.** Le motif de `zipcode` s'arrête à 95999 :
   un code postal en 97xxx / 98xxx est refusé avec le code 3. Le formulaire le
   dit avant l'envoi (`estOutreMer` dans `src/lib/devis.ts`).

### Codes de retour

| `code` | Sens | Traitement dans `/api/devis` |
| --- | --- | --- |
| 0 | Succès | 201, `id` et `token` renvoyés par la plateforme |
| 1 | Identifiants invalides | 502, message générique, trace en log |
| 2 | Champ requis manquant | 422 |
| 3 | Valeur invalide (JSON, code postal, métier) | 422 |
| 4 | Lead non vendable | 422, message dédié : personne à qui vendre le lead |
| 5 | Lead déjà importé | 201, traité comme un succès pour le visiteur |
| 9 | Erreur technique | 502 ; **une nouvelle tentative est planifiée côté HelloArtisan**, ne pas renvoyer la requête |

Le code 5 ne se déclenche pas sur le seul `supplierleadid`, qui est unique à
chaque envoi : la plateforme dédoublonne sur le contact et le métier. Une même
adresse e-mail qui redemande le même `worktype` à quelques heures d'intervalle
est refusée. Du point de vue du visiteur c'est un succès — sa demande est bien
chez HelloArtisan — d'où le 201 ; mais **aucun nouveau lead n'est créé**, et
`id` comme `token` reviennent à `null`. Un flux n8n qui attend un `token` doit
donc tester `helloartisan.code`.

## L'endpoint `/api/devis`

`POST https://viteunelectricien.fr/api/devis`, `Content-Type: application/json`.
Rien n'y est spécifique au navigateur : n8n peut l'appeler tel quel.

```json
{
  "worktype": 219,
  "isowner": 1,
  "housingtype": 1,
  "delay": 2,
  "budget": 2,
  "comment": "Tableau électrique à refaire",
  "civility": "M",
  "firstname": "Nicolas",
  "lastname": "Dupont",
  "email": "nicolas.dupont@exemple.fr",
  "telephone": "06 12 34 56 78",
  "zipcode": "75001",
  "city": "Paris",
  "address": "41 rue du Centre",
  "consentement": true,
  "source": "ville:paris"
}
```

Le téléphone est accepté sous toutes ses formes françaises (`06 12 34 56 78`,
`+33612345678`, `0033612345678`) puis normalisé, et aiguillé vers `cellphone`
ou `landline` selon l'indicatif — l'API exige l'un des deux.

Réponses :

| Statut | Charge utile |
| --- | --- |
| 201 | `{ "ok": true, "reference": "vue-…", "message": "Demande transmise." }` |
| 400 | `{ "ok": false, "message": "…", "erreurs": { "email": "…" } }` |
| 422 | `{ "ok": false, "message": "…" }` — refus métier de la plateforme |
| 429 | Plus de 5 envois par minute depuis la même IP |
| 502 / 503 | Plateforme injoignable, ou identifiants absents de l'environnement |

`reference` est aussi le `supplierleadid` envoyé à HelloArtisan : c'est la clé
de corrélation entre le site, n8n et la plateforme.

## L'endpoint `/api/devis/statut`

`POST https://viteunelectricien.fr/api/devis/statut`, authentifié par
`Authorization: Bearer <N8N_LEAD_WEBHOOK_TOKEN>` — le même jeton que celui du
webhook n8n. Il existe pour que l'orchestration n'ait pas à porter les
identifiants HelloArtisan.

```json
{ "token": "2111_6aaaf615a50230.79608838" }
```

`supplierLeadId` est accepté à la place de `token`. La réponse est recopiée
telle quelle depuis `POST /json/lead/status` (`code`, `statusLabel`, `date`…) :
un flux écrit contre l'API d'origine fonctionne sans modification.

| Statut | Cas |
| --- | --- |
| 200 | Réponse de la plateforme transmise, y compris ses `code` non nuls |
| 400 | Corps illisible, ou ni `token` ni `supplierLeadId` |
| 401 | Jeton absent ou invalide (comparaison à durée constante) |
| 502 / 503 | Plateforme injoignable, ou `N8N_LEAD_WEBHOOK_TOKEN` absent |

Sans `N8N_LEAD_WEBHOOK_TOKEN` dans l'environnement, l'endpoint se **ferme**
(503) au lieu de s'ouvrir : une variable oubliée ne doit pas exposer le statut
des leads.

## Recopie vers n8n

Si `N8N_LEAD_WEBHOOK_URL` est défini, chaque import confirmé est recopié en
`POST` sur ce webhook. L'échec de la recopie n'invalide jamais la demande du
visiteur : le lead est déjà chez HelloArtisan, il est trop tard pour l'annuler.

```json
{
  "reference": "vue-0f2c1b9a4d3e5",
  "recuLe": "2026-09-16T20:11:04.882Z",
  "site": "viteunelectricien.fr",
  "source": "ville:paris",
  "lead": { "…": "la charge utile RequestVO envoyée à HelloArtisan" },
  "helloartisan": {
    "code": 0,
    "message": "Lead correctly imported",
    "id": "bGVhZC0yMDI2…",
    "token": "2111_6aaaf28d7397e1.78912853"
  }
}
```

Le `token` est la clé à conserver : c'est lui qui permet d'interroger le statut
du lead plus tard (`statutLead()` dans `src/lib/helloartisan.ts`, ou directement
en REST depuis n8n) :

```bash
curl -s https://lead-ws.helloartisan.com/json/lead/status \
  -H 'Content-Type: application/json' \
  -d '{"security":{"login":"…","password":"…","environment":"PROD"},
       "request":{"token":"2111_6aaaf28d7397e1.78912853"}}'
# {"token":"…","supplierleadid":"vue-…","status":null,
#  "statusLabel":"Non traité","date":"2026-09-16 21:48","code":0}
```

`status` vaut 0 (annulé / non validé) ou 1 (validé) ; `statusLabel` prend
« Validé », « Annulé » ou « Non traité ».

## Rafraîchir le catalogue des métiers

```bash
npm run metiers
```

Le script imprime les 136 métiers avec leur `worktype` et signale tout écart
entre `src/config/prestations.ts` et la nomenclature de la plateforme. Il sort
en code 1 en cas de dérive, ce qui permet de le brancher en CI.

## Vérifier l'éligibilité sans rien créer

`POST /json/lead/is_sellable` n'attend que `zipcode` et `worktype`, et
n'importe rien. C'est le bon outil pour sonder une zone sans polluer la
plateforme :

```bash
curl -s https://lead-ws.helloartisan.com/json/lead/is_sellable \
  -H 'Content-Type: application/json' \
  -d '{"security":{"login":"…","password":"…","environment":"PROD"},
       "request":{"zipcode":"75001","worktype":219}}'
# {"code":0,"message":"This lead can be sold"}
```

## Anti-spam

Trois garde-fous, tous dans `src/app/api/devis/route.ts` :

- un champ leurre (`piege`) hors du flux et du parcours clavier ;
- un envoi en moins de trois secondes après l'affichage est ignoré ;
- cinq envois par minute et par IP au maximum.

Les deux premiers répondent **201 comme un succès** : un message d'erreur ne
ferait qu'indiquer au script ce qu'il doit corriger. Rien n'est importé.

Le compteur d'IP vit en mémoire de l'instance serverless : il n'est ni partagé
entre régions ni persistant. Il absorbe un doigt qui s'emballe sur « Envoyer »,
pas une attaque distribuée — celle-ci se traite au niveau du pare-feu.
