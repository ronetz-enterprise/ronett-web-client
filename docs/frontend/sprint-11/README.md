# Sprint 11 — Administration des accès Internet et consultation de l’Accounting

Verdict : **PARTIAL**. L’administration des droits d’accès est livrée et vérifiée manuellement sur
backend réel. L’espace **Accounting (sessions réseau, consommation observée) est `BLOCKED`** : le
module `accounting` du backend est **financier** (soldes, grand livre, retraits) et son autorisation
tenant est absente ; aucun contrat de session, de volume, d’IP, de MAC, d’export réseau ni de
déconnexion forcée n’existe. Aucun écran, aucune route, aucune clé de cache n’a été créé pour lui.

Les [matrices de contrats, la maturité des capacités et le constat technique](audit-and-contracts.md)
ont été produits avant toute modification.

## 1. Séparation Access / Accounting

| Espace       | Question                                                                                                           | Modèle frontend                   | État              |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------- | ----------------- |
| `access`     | Qui possède un droit, pour quel site, quelle source, quelle politique, quel état métier, quelle projection ?       | `AccessGrant` (`AccessGrantView`) | Implémenté        |
| `accounting` | Une connexion a-t-elle commencé, est-elle active, quel routeur, quels volumes, quelle IP/MAC, quelle terminaison ? | **aucun**                         | Bloqué, documenté |

Aucun type n’est commun aux deux : il n’existe pas de modèle frontend unifié. Rien dans le code ne
fait coexister un `AccessGrant` et une session de consommation.

## 2. Contrats utilisés

| Usage                            | Route                                                                                              |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| Liste organisation               | `GET /api/organizations/{organizationId}/access-grants?page&size`                                  |
| Liste site (seul filtre serveur) | `GET /api/organizations/{organizationId}/sites/{siteId}/access-grants?page&size`                   |
| Détail                           | `GET /api/access-grants/{id}`                                                                      |
| Suspension                       | `POST /api/access-grants/{id}/suspension` (corps vide)                                             |
| Reprise                          | `DELETE /api/access-grants/{id}/suspension` (corps vide)                                           |
| Révocation                       | `POST /api/access-grants/{id}/revocation` (corps vide)                                             |
| Relance de projection            | `POST /api/access-grants/{id}/projection-retries` (corps vide)                                     |
| Attribution manuelle             | `POST /api/organizations/{organizationId}/sites/{siteId}/access-grants/manual` + `Idempotency-Key` |

Non exposés, faute de contrat ou d’autorisation : historique des changements, diagnostic détaillé de
projection (tentatives, prochaine tentative, code d'erreur), et l'intégralité du périmètre
`accounting`.

## 3. Statuts intégrés

Droits : `PENDING_PROVISIONING`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `QUOTA_EXHAUSTED`, `REVOKED`,
`PROVISIONING_FAILED` (jamais assigné par le service, conservé avec repli explicite). Projection :
`NOT_REQUESTED`, `PENDING`, `APPLIED`, `REMOVAL_PENDING`, `REMOVED`, `FAILED`. Source :
`PAID_ORDER`, `VOUCHER`, `MANUAL_GRANT`, `ORGANIZATION_USER`, `PROMOTIONAL_CAMPAIGN`. Bénéficiaire :
`ANONYMOUS`, `IDENTITY`, `SUBSCRIBER`, `DEVICE`. Les champs d'état sont des chaînes non vides
(union ouverte) avec libellé de repli : aucun statut n'est déduit d'un autre.

## 4. Sources

Chaque droit affiche sa source avec un libellé humain. `sourceId` (UUID de l'achat, du voucher ou de
l'acte d'émission) n'est utilisé que pour la recherche locale ; **aucun lien vers un achat** n'est
fiable : le contrat Purchase expose un achat par UUID mais l'écran d'achat n'est pas atteint depuis
une source, et le droit d'achat n'est pas un achat. Aucun identifiant interne de paiement n'est
affiché.

## 5. Accès manuel

Formulaire : site (sites actifs de l'organisation uniquement), type de bénéficiaire, identifiant du
bénéficiaire (exigé sauf `ANONYMOUS`), durée en secondes, quota en octets, débit descendant, débit
ascendant, sessions simultanées. L'organisation vient du contexte validé ; le site est relu dans le
cache des sites et son appartenance est revérifiée par le backend.

`Idempotency-Key` : un UUID généré par tentative, affiché dans le formulaire, **stable** tant que la
tentative vit, régénéré seulement après une émission acceptée. Conséquences réelles et affichées :

- un rejeu de la même clé renvoie `created=false` **sans** mot de passe ;
- un rejeu avec une politique différente produit `409` ;
- le navigateur ne génère ni ne devine aucun secret.

`ON_FIRST_USE` n'est pas proposé : le service le refuse explicitement.

## 6. Politique des secrets

- Le mot de passe n'existe dans le frontend que dans l'état du composant qui affiche une émission
  réussie : jamais dans une query TanStack, un store, une URL, `localStorage`, `sessionStorage`, un
  log ou une analytique.
- Le jeton de récupération présent dans la réponse n'est **jamais lu** : le schéma de validation
  n'en retient que `created` et `credentialDelivery`.
- Le panneau d'émission est annoncé une seule fois, avec copie explicite et séparée pour
  l'identifiant et le mot de passe, masquage accessible, avertissement sur le presse-papiers et
  absence de promesse d'effacement.
- **Aucun mot de passe existant n'est lisible**, ni par un client, ni par un administrateur, y compris
  un OWNER : le backend n'a aucun endpoint de relecture. L'écran de détail affiche l'identifiant
  réseau (qui n'est pas un secret) et l'indisponibilité du mot de passe.
- Après navigation, le secret disparaît ; l'accès reste consultable, son secret non.

## 7. Modèle Accounting et fraîcheur des sessions

**Sans objet, faute de contrat.** Aucun modèle, aucune unité de consommation, aucun rafraîchissement
et aucune politique de fraîcheur ne sont implémentés : il n'existe aucun `AccountingSession` à
modéliser. La documentation backend (`platform/docs/access.md`) confirme que le quota et la
consommation relèvent de travaux différés et qu'aucun compteur `radacct` n'est projeté.

## 8. Unités

`features/access/formatters/access.ts` centralise les unités : durées (secondes → j/h/min), volumes
(octets → ko/Mo/Go, calculés en `BigInt` pour rester exacts), débits (bit/s → kbit/s/Mbit/s/Gbit/s,
SI), dates ISO-8601 (instant UTC, format `fr-FR`). `null` = illimité, jamais `-1` ni `0`. Une seule
convention par page. Les compteurs RADIUS n'existent pas dans le contrat : aucune règle de
consolidation, de gigaword ou de donnée tardive n'est implémentée côté frontend.

## 9. Agrégats

Seuls des agrégats **de la page affichée** sont affichés, dans les cartes de la liste : accès actifs
et appliqués, droits en préparation, projections en échec. Chaque carte indique sa portée
(« Page affichée · … »), sans période inventée, sans pourcentage ni tendance. Aucun agrégat de
sessions, de volume ou de durée n'existe côté backend ; aucun n'est recalculé dans le navigateur et
aucun graphique n'a été créé.

## 10. Query keys

| Clé                                                                        | Contenu                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------- |
| `["organization", orgId, "access-grants"]`                                 | racine du module                                  |
| `["organization", orgId, "access-grants", "list", { page, size, siteId }]` | liste (site dans la clé car il change d'endpoint) |
| `["organization", orgId, "access-grants", "detail", accessGrantId]`        | détail                                            |
| `["organization", orgId, "access-grants", "tracking", accessGrantId]`      | suivi de projection (Sprint 10)                   |
| `["organization", orgId, "access-grant-mutation"]`                         | mutations                                         |

Aucun nom d'utilisateur, mot de passe, jeton, IP, MAC ou donnée personnelle n'entre dans une clé.

> **Correction d'un collision de namespaces découverte en qualification.** Le préfixe
> `tenantKeys.resource(orgId, "access")` était déjà utilisé par `membershipKeys.access`, sur lequel
> s'appuie la garde d'organisation. Toute mutation du module invalidait donc la lecture de
> membership, ce qui faisait remplacer toute la page par un écran de chargement : dialogues fermés,
> état local perdu. Le module utilise désormais son propre préfixe `access-grants`.
>
> **Boucle de requêtes croisée corrigée.** Invalider la membership sur un `403` de ressource
> produisait un cycle mesuré à **687 requêtes en 8 s** (403 → membership → démontage de la page →
> nouvelle requête). Un refus porte sur la ressource, pas sur la session : le module n'invalide plus
> la membership ; son rafraîchissement reste à la garde. Le même schéma existe dans les modules
> `site` et `router` : **constat à traiter dans un sprint dédié**, hors périmètre ici.

## 11. Permissions

Une source unique, `features/access/permissions/access-permissions.ts`, consommée par les queries,
les mutations et les composants (aucun rôle n'est dispatché dans l'UI) :

`canViewAccessGrants`, `canViewAccessDetails`, `canCreateManualAccess`, `canSuspendAccess`,
`canResumeAccess`, `canRevokeAccess`, `canRetryProvisioning`.

Elles reflètent le contrat serveur (membership active, rôle OWNER, organisation et site actifs) et
les transitions du domaine : suspension seulement depuis `ACTIVE`, reprise seulement depuis
`SUSPENDED`, révocation depuis tout état non terminal, relance seulement sur une projection `FAILED`
et jamais à l'état terminal. **Aucune capacité ne permet de lire un mot de passe.** Les capacités
Accounting ne sont pas créées : aucun contrat ne les confirmerait.

## 12. Composants shadcn utilisés

Button, Card, Badge, Alert, Skeleton, Table, Dropdown Menu, Alert Dialog, Sheet, Dialog (via le
composant partagé), Select, Input, Tabs (non utilisé ici), Breadcrumb, Pagination, Separator,
Progress, Tooltip, Empty, Sonner (via `notificationManager`, base-ui Toast du dépôt).
**Aucun composant ajouté** : `progress` avait déjà été installé au Sprint 10. Popover, Command, Chart
et Field n'ont pas été installés car non utilisés.

## 13. Limites techniques affichées

La politique est présentée comme **condition commerciale enregistrée**, avec un encart « Conditions
enregistrées, pas nécessairement appliquées » et la mention « non appliqué » sur le quota, les deux
débits et les sessions simultanées, chacun avec une infobulle expliquant la raison technique. Cette
distinction vient de `platform/docs/access.md` : la projection RADIUS n'écrit aucun attribut de
débit, de quota ni de simultanéité, et « une politique limitée n'implique pas que cette limite soit
appliquée par le réseau ». Seuls le mot de passe, le `NAS-Identifier` du site, l'expiration et le
rejet de suspension sont réellement projetés.

Également affiché : le statut métier et l'état de projection sont deux badges distincts ; un droit
suspendu reste `SUSPENDED` tant que la reprise n'est pas confirmée ; une relance peut rejouer une
action inconnue (y compris une révocation) et le dialogue le dit ; l'historique et le diagnostic de
projection ne sont pas exposés et ne sont pas reconstitués.

## 14. Vérifications manuelles

Chromium, frontend de développement et backend Spring réel (profil `local`, PostgreSQL local), sans
mock et sans test ajouté. Les droits de qualification ont été créés directement en base (la
projection RADIUS est désactivée dans cet environnement :
`RONETZ_ACCESS_RADIUS_DEPLOYMENT_VERIFIED=false`) puis supprimés.

| Point                                                               | Résultat                                                                                                                                                                     |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liste Access                                                        | 5 lignes, colonnes Référence / Site / Source / Statut métier / Projection / Émis le / Expire le                                                                              |
| Filtre serveur de site                                              | `GET …/sites/{siteId}/access-grants` émis, liste rechargée, `?site=` dans l'URL                                                                                              |
| Filtres de page (statut, source, projection, expiration, recherche) | Appliqués à la page, mention explicite affichée, sélecteurs avec libellés humains                                                                                            |
| Pagination                                                          | 20/page, boutons désactivés hors bornes, total et page affichés                                                                                                              |
| Détail Access                                                       | Identité, policy, conditions enregistrées, identifiants, cycle de vie, projection                                                                                            |
| Menus selon l'état                                                  | `ACTIVE` → suspendre + révoquer ; `SUSPENDED` → reprendre + révoquer ; `PENDING` → révoquer ; projection `FAILED` → relancer ; `REVOKED` → aucune action                     |
| Suspension                                                          | 1 appel, `POST …/suspension`, 503 « intention enregistrée, application technique en attente » affiché avec correlationId, état réel rechargé (Suspendu / En échec)           |
| Reprise                                                             | 1 appel, `DELETE …/suspension`, échec réseau affiché, droit **resté suspendu** (aucun état actif optimiste)                                                                  |
| Révocation                                                          | 1 appel, `POST …/revocation` depuis `PENDING_PROVISIONING`, dialogue annonçant l'irréversibilité et l'absence de restauration                                                |
| Relance de projection                                               | 1 appel, `POST …/projection-retries`, dialogue expliquant que l'action rejouée est inconnue                                                                                  |
| Double clic / triple clic                                           | 3 clics rapides → **1 seule requête**, confirmation désactivée et pastille « Demande envoyée »                                                                               |
| Création manuelle                                                   | Formulaire validé (site obligatoire, bornes de la policy), 1 `POST …/access-grants/manual` avec `Idempotency-Key`, 503 traité sans état optimiste                            |
| Secret initial non persisté                                         | `localStorage` vide, `sessionStorage` = `react-router-scroll-positions`, URL sans paramètre ; le panneau d'émission n'a pas pu être atteint (projection RADIUS indisponible) |
| Sessions Accounting                                                 | **Sans objet** : aucun contrat, aucun écran                                                                                                                                  |
| Filtres / pagination                                                | Vérifiés sur la liste (voir ci-dessus)                                                                                                                                       |
| Session active / terminée                                           | **Sans objet** : aucune session exposée                                                                                                                                      |
| Agrégats / graphique                                                | **Sans objet** : seuls les compteurs de page, aucun graphique                                                                                                                |
| Changement d'organisation                                           | Contexte B : liste B vide, aucune donnée de A                                                                                                                                |
| Refus interorganisation                                             | `GET /api/access-grants/{grantA]` avec un jeton OWNER de B → **403** backend, écran « Accès refusé » sans donnée ; boucle de requêtes corrigée (8 requêtes au lieu de 687)   |
| Absence de lecture directe de RADIUS                                | Le navigateur n'appelle que `/api/**` : aucun `radcheck`, `radacct`, `radreply`, Node Agent, routeur ou Actuator                                                             |
| Responsive                                                          | 360 px, 900×420, 1440 px : débordement horizontal 0 ; tableau ≥ `md`, cartes en dessous ; filtres en Sheet sur mobile                                                        |
| Modes clair et sombre                                               | Vérifiés sur liste et détail                                                                                                                                                 |
| Clavier                                                             | Lien d'évitement en premier tab, focus visible, dialogues avec libellés et actions nommées                                                                                   |
| `prefers-reduced-motion`                                            | Page rendue, aucune animation imposée                                                                                                                                        |
| Thème                                                               | `src/app/styles/app.css` inchangé, SHA-256 `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`                                                                |

Non vérifié : chemin de **succès** des mutations (toutes les transitions renvoient 503 dans cet
environnement, faute de projection RADIUS déployée) ; panneau d'émission d'un credential réel pour
la même raison ; autres navigateurs ; lecteurs d'écran.

## 15. Fonctionnalités bloquées ou différées

Bloquées par absence de contrat : sessions réseau (liste, détail, agrégats), volumes entrants et
sortants observés, durées réelles, dernière mise à jour d'une session, état stale, identifiants IP et
MAC, routeur d'une session, export Accounting, déconnexion forcée (CoA), historique
des changements métier, diagnostic de projection (tentatives, prochaine tentative), lecture d'un mot
de passe existant.

Différé : conservation de `withdrawal`/grand livre non exposée (autorisation tenant absente),
reporting opérationnel, notifications, support, administration plateforme.

## 16. Inventaire

Fichiers ajoutés (13) :

- `src/features/access/permissions/access-permissions.ts`
- `src/features/access/model/manual-access.ts`
- `src/features/access/mutations/access-changes.ts`
- `src/features/access/mutations/manual-access.ts`
- `src/features/access/components/access-filters.tsx`
- `src/features/access/components/access-grant-table.tsx`
- `src/features/access/components/access-transitions.tsx`
- `src/features/access/components/access-policy-enforcement.tsx`
- `src/features/access/components/issued-credential-panel.tsx`
- `src/features/access/components/manual-access-form.tsx`
- `src/pages/access/manual-access-page.tsx`
- `docs/frontend/sprint-11/audit-and-contracts.md`
- `docs/frontend/sprint-11/README.md`

Fichiers modifiés (7) : `src/features/access/api/access-endpoints.ts`, `.../model/access-grant.ts`,
`.../queries/access-grants.ts`, `.../components/access-shared.tsx`, `.../components/access-grant-list.tsx`,
`.../components/access-grant-details.tsx`, `.../index.ts`, `src/features/site/index.ts` (export de
`siteKeys`), `src/app/routes.ts` (route `access/new`). `src/features/access/mutations/projection-retry.ts`
a été supprimé, remplacé par `access-changes.ts` (source unique des mutations).

Routes : `/app/:organizationId/access`, `/app/:organizationId/access/new`,
`/app/:organizationId/access/:accessGrantId`. **Aucune route Accounting** : sans contrat, une route
serait un écran menteur.
