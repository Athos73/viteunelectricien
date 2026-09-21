# Blog — WordPress headless + Wisewand

```
Wisewand ──(connexion WordPress native)──┐
                                         ▼
Vous ──(éditeur WordPress)──────► WordPress  (Hostinger)
                                         │  API REST  + webhook de publication
                                         ▼
                            Next.js sur Vercel  viteunelectricien.fr/blog
```

WordPress ne sert que d'**outil d'écriture**. Les lecteurs et Google ne voient
que `viteunelectricien.fr/blog/…`. Le front du WordPress redirige (301) vers le
site public.

| Fichier | Rôle |
| --- | --- |
| `src/lib/blog.ts` | Client de l'API REST WordPress, cache et nettoyage du HTML |
| `src/app/blog/…` | Liste, pagination, catégories et articles |
| `src/app/api/blog/revalidate/route.ts` | Webhook appelé par WordPress à chaque publication |
| `src/app/sitemaps/[fichier]/route.ts` | Ajoute `sitemaps/blog.xml` à l'index |
| `docs/wordpress/viteunelectricien-headless.php` | Extension à déposer dans WordPress |

## Mise en place (une seule fois)

### 1. WordPress

Le WordPress est installé sur Hostinger, sur le sous-domaine gratuit
**`https://lightsalmon-shrew-903823.hostingersite.com`**.

*Optionnel, plus tard :* pour lui donner une adresse plus lisible
(`cms.viteunelectricien.fr`), rattachez ce domaine au site dans hPanel. Ajoutez
ensuite chez Gandi l'enregistrement `cms` qu'indique Hostinger, sans toucher aux
enregistrements qui pointent vers Vercel. Mettez enfin à jour `WORDPRESS_URL`
sur Vercel et redéployez.

### 3. Réglages WordPress

- **Réglages → Général → Titre du site** : `Vite un électricien`. Yoast
  l'ajoute à la fin des titres SEO.
- **Réglages → Permaliens** : « Titre de la publication » (`/%postname%/`).
- **Réglages → Lecture** : ne cochez **PAS** « Demander aux moteurs de
  recherche de ne pas indexer ce site ». Yoast transmettrait ce `noindex`.
  C'est l'extension qui se charge de désindexer le CMS.
- Installez **Yoast SEO**. Wisewand y dépose le titre SEO et la méta-description,
  que le site reprend.
- Renommez la catégorie « Non classé » (elle est masquée côté site) et créez
  vos catégories : Normes, Dépannage, Rénovation, Prix…

### 4. Extension headless

1. Archivez `docs/wordpress/viteunelectricien-headless.php` dans un dossier du
   même nom, en `.zip`. Dans WordPress : **Extensions → Ajouter → Téléverser**,
   puis **Activer**.
2. **Réglages → Vite un électricien** : collez le secret
   (`BLOG_REVALIDATE_TOKEN` de `.env.local`, ou un nouveau généré par
   `openssl rand -hex 32`), puis enregistrez.
3. Une fois le site déployé, cliquez sur **Tester la connexion avec le site** :
   le message « Connexion réussie » doit s'afficher.

### 5. Variables Vercel

Dans **Vercel → Project → Settings → Environment Variables** :

| Variable | Valeur |
| --- | --- |
| `WORDPRESS_URL` | `https://lightsalmon-shrew-903823.hostingersite.com` |
| `BLOG_REVALIDATE_TOKEN` | le même secret que dans Réglages → Vite un électricien |

Redéployez ensuite. C'est **obligatoire**, car `WORDPRESS_URL` est lue au build
pour autoriser les images du CMS.

### 6. Connecter Wisewand

1. Dans WordPress, créez un utilisateur dédié `wisewand` avec le rôle **Éditeur**.
2. Sur son profil : **Mots de passe d'application**, puis nommez-le « Wisewand »
   et copiez le mot de passe généré.
3. Dans Wisewand : **Connections → Add → WordPress**, avec l'URL
   l'adresse du WordPress, l'identifiant `wisewand` et le mot de
   passe d'application.
4. Choisissez la catégorie par défaut et le statut. Commencez par
   **Brouillon**, pour relire avant publication.

## Au quotidien

- **Écrire à la main** : WordPress → Articles → Ajouter. Renseignez l'image mise
  en avant, la catégorie, puis le titre SEO et la méta dans Yoast.
- **Wisewand** : les articles arrivent dans WordPress (en brouillon ou publiés
  selon le réglage). Un clic sur « Publier » suffit.
- Dès la publication, l'extension prévient le site. L'article est en ligne sur
  `/blog/<slug>` en quelques secondes et apparaît dans `sitemaps/blog.xml`.
  Si l'appel échoue, le cache expire de toute façon au bout d'une heure.
- **Liens internes** : les liens vers le CMS sont réécrits automatiquement vers
  `viteunelectricien.fr/blog/…`. Les liens vers les pages de l'annuaire
  (`/electricien/lyon`…) peuvent être posés tels quels.

## Vérifier

```bash
curl -s https://lightsalmon-shrew-903823.hostingersite.com/wp-json/wp/v2/posts?per_page=1 | head -c 300
curl -s -X POST https://viteunelectricien.fr/api/blog/revalidate -H "Authorization: Bearer <secret>"
```

La seconde commande doit répondre `{"ok":true,…}`.
