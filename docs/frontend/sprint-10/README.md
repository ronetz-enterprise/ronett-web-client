# Sprint 10 — Délivrance sécurisée des identifiants WiFi et suivi de l’activation

Verdict : **BLOCKED** pour le parcours client. Verdict préalable du protocole de délivrance :
**BLOCKED**. Le frontend n’expose **aucun** écran de délivrance, aucun jeton de réclamation, aucune
clé de reprise et aucun secret : il n’existe pas de contrat public permettant de les produire. Ce
sprint livre en revanche le suivi réellement contractuel côté propriétaire d’organisation : liste des
droits d’accès, détail, dimensions d’état séparées, suivi borné de la projection technique et
relance de provisioning. Les [matrices de contrats et le verdict](audit-and-contracts.md) ont été
produits avant toute modification.

## 1. Parcours Payment → Access réel

```
POST /api/payments (X-Checkout-Token)          navigateur
  → redirection fournisseur Flutterwave
webhook /api/webhooks/flutterwave              serveur à serveur
  → PaymentConfirmed (payment)
commerce.PaymentPurchaseListener                achat PAID
access.PaymentAccessListener (durable Modulith) droit PENDING_PROVISIONING + credential + projection PENDING
  → projection RADIUS (LOCAL)                    droit ACTIVE + projection APPLIED + AccessProvisioned
  → projection distante (REMOTE_TEST seulement) enveloped chiffrée + remote_intents
```

Ce qui est observable par le navigateur après la redirection : **rien**. Aucun contrat public ne
retourne l’identifiant du droit d’accès, son statut, l’état de la projection, ni l’existence d’un
credential livrable. Le frontend ne peut donc pas afficher « paiement confirmé → accès créé →
identifiants prêts » pour le client final.

Ce qui est implémenté dans ce sprint est la colonne **propriétaire** de ce parcours :
`GET /api/access-grants/{id}` et `GET /api/organizations/{organizationId}/access-grants`, qui
exposent `sourceType` (dont `PAID_ORDER`), `status`, `projectionStatus`, la politique et les dates.

## 2. Distinction des états

Trois dimensions, jamais fusionnées, jamais recalculées :

| Dimension            | Origine                              | Traitement                                                              |
| -------------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| Droit d’accès        | `AccessGrantView.status`             | libellé + ton, union ouverte avec repli `Statut non documenté (VALEUR)` |
| Projection technique | `AccessGrantView.projectionStatus`   | badge distinct suffixé « Projection : … »                               |
| Source               | `AccessGrantView.sourceType`         | libellé, displayed à côté du site et de la date d’émission              |
| Identifiant attribué | `AccessGrantView.username`           | présent/absent ; ne dit rien du mot de passe                            |
| Délivrance           | **inexposée**                        | aucune notion de « disponible », « réclamé », « expiré »                |
| Paiement             | **non exposé** par `AccessGrantView` | jamais reconstitué ; seule la source `PAID_ORDER` est affirmée          |

`PROVISIONING_FAILED` existe dans l’énumération mais n’est jamais assigné par le service : un échec
de projection laisse le droit en `PENDING_PROVISIONING` avec `projectionStatus = FAILED`. L’interface
refuse donc de présenter ce droit comme activable, sans le déclarer « en échec » sur la dimension
métier.

La décision d’utilisabilité reste celle du backend : `isUsableAccess` exige `status === "ACTIVE"`
**et** `projectionStatus === "APPLIED"`, et ne reproduit pas `hasActiveAccess` (qui vérifie en plus
organisation, site et échéance côté serveur).

## 3. Protocole de délivrance

**Aucun protocole public.** `POST /api/public/access-grants/{id}/credential-delivery` existe, mais :

- l’identifiant du droit n’est retourné par aucun contrat public ;
- la preuve exigée (jeton de délivrance dédié, ou `checkoutToken`) n’est distribuée à personne ;
- l’enveloppe chiffrée n’est écrite qu’en mode `REMOTE_TEST`, profil Spring `test`, propriété
  `ronetz.access.remote-qualification-enabled=true` ;
- vérifié à l’exécution : sur un droit `ACTIVE`/`APPLIED`, l’endpoint répond **403** et la table
  `access.credential_envelopes` est vide.

`src/features/access/delivery/public-delivery.ts` décrit cet état et ne contient aucune fonction de
requête, aucun conteneur de secret, aucun jeton d’exemple. `credentialExposure()` ne connaît que deux
états : `credential-missing` et `credential-issued` (présence d’un username, qui n’est pas un secret).

## 4. Protocole de résultat inconnu

Sans endpoint de délivrance, il n’y a rien à reprendre. Le module
`src/features/access/recovery/access-recovery.ts` formalise la reprise réelle : toutes les données de
la page sont relues depuis le backend, rien n’est stocké localement, aucune action n’est rejouée
automatiquement, et l’identifiant du droit dans l’URL est un UUID opaque déjà visible dans la barre
d’adresse. Les politiques du backend observées (relecture bornée à 5 tentatives, incrémentées avant
vérification du jeton et commitées même en cas de refus, fenêtre `min(900 s, validité)`) sont
documentées dans l’audit comme besoins backend, pas implémentées.

## 5. Expiration

`expiresAt` est affiché tel que le backend le retourne, jamais recalculé. Aucun compteur local
n’est utilisé comme source de vérité. Aucune expiration de délivrance n’est exposée par l’API : rien
à temporiser, donc aucun compte à rebours dans l’interface.

## 6. Reprise

| Situation                    | Comportement réel                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Actualisation sur la liste   | page relue depuis le backend, `page` conservée dans l’URL                                            |
| Actualisation sur le détail  | droit relu ; aucun secret n’est restauré car aucun n’existe                                          |
| Erreur réseau                | dernier état conservé, bandeau « la liste affichée peut être incomplète », aucune action automatique |
| Réponse perdue d’une relance | `invalidateQueries` recharge liste et détail ; l’état réel est réaffiché                             |

## 7. Accusé de sauvegarde

Inexistant côté backend. Aucun écran de confirmation n’est créé : pas de bouton « J’ai sauvegardé mes
identifiants », pas d’appel, pas d’état local.

## 8. Politique de cache et de logs

- Aucune persistance TanStack Query n’est configurée dans l’application ; rien n’est écrit dans
  `localStorage` ni `sessionStorage` par ce module (vérifié : `localStorage` vide,
  `sessionStorage` ne contient que `react-router-scroll-positions`).
- Le client HTTP impose déjà `cache: "no-store"` et `redirect: "error"`.
- Aucune requête du module ne porte de secret : il n’y a pas de champ correspondant dans
  `AccessGrantView`.
- Aucun `console.*` dans le code livré (le `console.error` temporaire utilisé pour le diagnostic a été
  retiré). Aucune analytique, aucun breadcrumb, aucun rapport d’erreur tiers.
- Les erreurs affichées sont un message sûr + la référence de corrélation ; ni `detail` métier du
  backend, ni trace SQL, ni donnée d’infrastructure.

## 9. Query keys

| Clé                                                            | Contenu                               |
| -------------------------------------------------------------- | ------------------------------------- |
| `["organization", orgId, "access"]`                            | racine du module, pour l’invalidation |
| `["organization", orgId, "access", "list", { page, size }]`    | pagination, 20 par page               |
| `["organization", orgId, "access", "detail", accessGrantId]`   | détail                                |
| `["organization", orgId, "access", "tracking", accessGrantId]` | suivi de projection                   |
| `["organization", orgId, "access-mutation"]`                   | clé de mutation de relance            |

Aucun nom d’utilisateur, mot de passe, jeton, secret, `organizationId` interne inutile, fencing token
ou clé privée n’apparaît dans une clé de cache. Les clés restent préfixées par l’organisation, donc
isolées par tenant.

## 10. Données sensibles

| Donnée                     | Traitement                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Mot de passe WiFi          | jamais reçu, jamais généré, jamais déduit, jamais stocké, jamais affiché                                                      |
| Secret RADIUS / `radcheck` | jamais lu, jamais demandé                                                                                                     |
| Jeton de délivrance        | jamais reçu, jamais construit, jamais mis en URL                                                                              |
| Username (`rz_` + 32 hex)  | affiché et copiable ; ce n’est pas un secret, et le backend l’expose volontairement dans `AccessGrantView`                    |
| `organizationId`           | présent dans l’URL de l’application (contexte tenant), jamais dans un payload de credential ni dans une requête de délivrance |

## 11. Instructions de connexion

Non implémentées, faute de contrat. Aucun contrat ne fournit d’URL de portail captif ; en construire
une côté client serait une redirection ouverte et une promesse non vérifiable. Aucune affirmation
n’est faite sur le contrôle d’un portail par Ronetz.

## 12. Limites administratives

Implémenté : liste paginée, détail, suivi de projection, relance du provisioning sur projection en
échec. Interdit par construction : aucun mot de passe, aucun secret RADIUS, aucun credential en
clair, aucun jeton de délivrance, aucune donnée de projection RADIUS ou de Node Agent. Un OWNER ne
voit donc pas les secrets de ses clients — le frontend n’a aucun moyen de les afficher.

Différé Sprint 11 : suspension, reprise, révocation, émission manuelle, administration de la
projection, filtres avancés, accounting et sessions.

## 13. Composants shadcn utilisés

Button, Card (via `AccessPanel`), Badge (via `StatusBadge`), Alert, Skeleton (`PageLoading`),
Progress, Separator, Tooltip, AlertDialog, Breadcrumb, Pagination, Empty (via `EmptyState`). Un seul
composant a été ajouté au registre officiel : `src/shared/ui/progress.tsx` (`@base-ui/react/progress`,
style `base-mira` du dépôt). Aucun composant existant n’a été remplacé, aucune dépendance ajoutée.
`Sonner` n’est pas installé : le dépôt fournit déjà `notificationManager` (`@base-ui/react/toast`),
utilisé pour la seule confirmation non bloquante (relance demandée).

## 14. Vérifications manuelles

Chromium, frontend de développement et backend Spring réel (`profile=local`, PostgreSQL local). Aucun
mock, aucun test ajouté. Les droits d’accès de qualification ont été créés **directement en base**
parce que la projection RADIUS est désactivée dans cet environnement
(`RONETZ_ACCESS_RADIUS_DEPLOYMENT_VERIFIED=false` : l’émission manuelle répond 503), puis supprimés.
Un relais CORS local temporaire a permis d’inspecter le parcours sur un second port ; il est arrêté.

| Point vérifié                                                             | Résultat                                                                                                                                                                                  |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Paiement confirmé côté client                                             | **Non vérifiable** : aucun parcours public de paiement dans ce dépôt, aucun contrat de statut                                                                                             |
| Accès en préparation (droit `PENDING_PROVISIONING`, projection `PENDING`) | Étape « Configuration réseau appliquée » en cours, message « non encore appliquée : cet accès n’est pas utilisable »                                                                      |
| Suivi de statut                                                           | 4 lectures en 20 s (intervalle 5 s) sur projection en cours ; **0** lecture en 15 s sur un droit `ACTIVE`/`APPLIED` (arrêt sur état terminal)                                             |
| Accès actif                                                               | 3 étapes validées, conditions réelles, dates backend, identifiant copiable                                                                                                                |
| Provisioning échoué                                                       | Alerte destructive, état `FAILED` distinct du statut métier, relance proposée                                                                                                             |
| Relance de provisioning                                                   | 1 seule requête `POST …/projection-retries` pour 3 clics rapides ; le backend rejoue l’action en attente et l’état réel est réaffiché                                                     |
| Double clic                                                               | Empêché (verrou local + état de mutation partagé)                                                                                                                                         |
| Copie de l’identifiant                                                    | Presse-papiers = `rz_…`, confirmation `role="status"`, repli textuel si l’API Clipboard échoue                                                                                            |
| Copie du mot de passe                                                     | **Sans objet** : aucun mot de passe n’existe dans le code                                                                                                                                 |
| Actualisation avant délivrance                                            | Détail relu depuis le backend, même contenu                                                                                                                                               |
| Actualisation après délivrance                                            | **Sans objet** : aucune délivrance n’existe                                                                                                                                               |
| Identifiant déjà réclamé                                                  | **Sans objet** : aucun état de réclamation exposé                                                                                                                                         |
| Livraison expirée                                                         | **Sans objet** : aucune fenêtre de délivrance exposée                                                                                                                                     |
| Réponse de délivrance perdue                                              | **Sans objet côté frontend** ; le comportement du backend est documenté dans l’audit                                                                                                      |
| Droit inconnu / UUID invalide en URL                                      | État « Accès introuvable » avec référence de corrélation, aucune fuite                                                                                                                    |
| Isolation                                                                 | Un droit d’une autre organisation est rejeté par le schéma, pas filtré à l’affichage                                                                                                      |
| Absence de secret en URL, cache, logs, stockage                           | URL = UUID opaque ; `localStorage` vide ; `sessionStorage` = `react-router-scroll-positions` ; aucun `console.*` ; aucune clé de cache ne contient de credential                          |
| Mode mobile 360 px                                                        | Colonne unique, aucun débordement horizontal (0 px)                                                                                                                                       |
| Rotation 780×360                                                          | Aucun débordement                                                                                                                                                                         |
| Mode sombre                                                               | Listes et détails lisibles, contrastes conservés                                                                                                                                          |
| Clavier                                                                   | Premier tab = lien d’évitement, puis navigation ; focus visible sur le bouton de copie ; dialogue de confirmation focalisé                                                                |
| `prefers-reduced-motion`                                                  | Page rendue sans animation imposée                                                                                                                                                        |
| Thème                                                                     | `src/app/styles/app.css` inchangé, SHA-256 `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`                                                                             |
| Réseau navigateur                                                         | Uniquement `GET /api/organizations/{org}/sites`, `GET /api/organizations/{org}/access-grants?page&size`, `GET /api/access-grants/{id}`, `POST /api/access-grants/{id}/projection-retries` |
| Accès direct à RADIUS / Node Agent / routeur                              | Aucun : le frontend ne connaît que `/api/**`                                                                                                                                              |

Non vérifié : autres navigateurs, lecteurs d’écran, organisation sans membership OWNER, parcours de
succès de la relance (impossible sans projection RADIUS déployée), environnement `REMOTE_TEST`
(profil Spring `test`).

## 15. Fonctions bloquées

1. Récupération du mot de passe par le client.
2. Écran de préparation à la réclamation et bouton « Afficher mes identifiants ».
3. Masquage/affichage du mot de passe, copie du mot de passe.
4. Expiration de la délivrance, compteur, conséquence de l’expiration.
5. Accusé de sauvegarde.
6. Reprise d’une réponse de délivrance perdue.
7. Régénération de credential.
8. Suivi public achat → accès pour le client final.
9. Instructions de connexion et lien de portail captif.
10. Téléchargement, QR code (exclus par le cahier des charges, aucun contrat).

## 16. Travaux différés au Sprint 11

Administration complète des accès (suspension, reprise, révocation, émission manuelle), accounting,
historique de sessions, consommation, et la totalité du parcours client si et quand le backend
expose un contrat de délivrance sécurisé.

## 17. Inventaire

Fichiers ajoutés (18) :

- `src/features/access/api/access-endpoints.ts`
- `src/features/access/model/access-grant.ts`
- `src/features/access/queries/access-grants.ts`
- `src/features/access/mutations/projection-retry.ts`
- `src/features/access/delivery/public-delivery.ts`
- `src/features/access/recovery/access-recovery.ts`
- `src/features/access/formatters/access.ts`
- `src/features/access/components/access-shared.tsx`
- `src/features/access/components/access-preparation-steps.tsx`
- `src/features/access/components/access-credential-panel.tsx`
- `src/features/access/components/access-grant-list.tsx`
- `src/features/access/components/access-grant-details.tsx`
- `src/features/access/index.ts`
- `src/pages/access/access-grants-page.tsx`
- `src/pages/access/access-grant-details-page.tsx`
- `src/shared/ui/progress.tsx`
- `docs/frontend/sprint-10/audit-and-contracts.md`
- `docs/frontend/sprint-10/README.md`

Aucun dossier `schemas/` : les schémas Zod vivent avec leur modèle, comme dans les modules `site`,
`router` et `offer`. Aucun dossier `common`, aucun store global.

Fichiers modifiés (3) : `src/app/routes.ts` (2 routes), `src/app/router/navigation.tsx` (1 entrée de
menu), `docs/frontend/sprint-8/README.md` (alignement de tableau imposé par `prettier --check`, aucune
modification de fond).

Routes ajoutées : `/app/:organizationId/access` et `/app/:organizationId/access/:accessGrantId`.
Aucune route publique : sans contrat public, une route `/access/...` exposerait un écran menteur.

## 18. Défaut préexistant constaté (hors périmètre)

`src/features/router/queries/routers.ts:89` construit `/api/organizations/{id}/routers?page=…&size=…`.
`session.request` refuse tout chemin contenant `?` (`Chemin de ressource authentifiée requis`), donc la
liste des routeurs échoue en Sprint 5. Le correctif est d’utiliser l’option `query` du client, comme
fait ce module. Non corrigé ici pour ne pas réécrire un parcours antérieur.
