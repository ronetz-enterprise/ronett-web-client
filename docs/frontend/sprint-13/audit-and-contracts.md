# Sprint 13 — Audit préalable, administration plateforme et audit

30 septembre 2026. Audit effectué avant toute modification : modules backend `platformadmin`, `audit`,
`organization`, `site`, `router`, `reporting`, `identity`, `authentication` (contrôleurs, API,
application, persistance, migrations), configuration Spring, et l'état réel du frontend
(routes, guards, shell, sidebar, composants shadcn). Aucun OpenAPI. Preuves :
`platform/src/main/java/com/ronetz/platform/`, `platform/src/main/resources/`.

## 1. Ce qui existe déjà (à compléter, pas à dupliquer)

| Capacité                              | État réel                                                                                                                                                                                                   | Preuve                                                                       |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Permissions plateforme                | `platform_admin.super_administrators(user_id, permissions[], active, must_change_password)` + `PlatformAdminAuthorizationService.require(user, permission)`                                                 | `V19__create_platform_admin_schema.sql`, `PlatformAdminAuthorizationService` |
| Provisionnement initial               | `SuperAdminBootstrap` : activé par variable d'environnement, exige une identité **préexistante** créée par l'inscription normale, refuse de démarrer si la table est déjà peuplée, aucun secret codé en dur | `SuperAdminBootstrap`, `application.yml:117-118`                             |
| Tableau de bord plateforme            | `GET /api/platform/overview` → `PlatformOverviewView` depuis la projection `reporting.organization_overviews` (alimentée par événements, avec `dataLastUpdatedAt`)                                          | `PlatformReportingQueryService`                                              |
| Recherche globale                     | `GET /api/platform/search?query&resourceType&size` via les API publiques des modules                                                                                                                        | `PlatformSearchService`                                                      |
| Fiche organisation                    | `GET /api/platform/organizations/{id}` → `OrganizationView`                                                                                                                                                 | `PlatformOperationsController`                                               |
| Suspension / réactivation / fermeture | `POST …/suspend`, `…/reactivate`, `…/close` avec `AdministrativeCommand(reason, confirmation, idempotencyKey)`                                                                                              | `PlatformOperationsController`                                               |
| Décisions d'action administratives    | `platform_admin.administrative_actions` : statut `EXECUTING` → `COMPLETED`/`FAILED`, motif, acteur, cible, correlationId, métriques                                                                         | `AdministrativeActionService`                                                |
| Audit des actions plateforme          | **Déjà branché** : `SUPER_ADMIN_ACTION_EXECUTED` avec `SUCCESS`/`FAILURE`, dans la même transaction que l'action                                                                                            | `AdministrativeActionService#audit`                                          |
| Audit des événements métier           | `AuditEventHandler` : organization, site, router, access, payment, accounting, support                                                                                                                      | `audit/application/handler`                                                  |
| Consultation audit organisation       | `GET /api/organizations/{organizationId}/audit-entries` avec 11 critères, pagination, 4 tris                                                                                                                | `OrganizationAuditController`                                                |
| Consultation audit plateforme         | `GET /api/platform/audit-entries` — **endpoint mort** : exige `ROLE_SUPER_ADMIN` alors que le filtre d'authentification n'accorde **aucune** autorité, et n'accepte **aucun** critère                       | `PlatformAuditController`                                                    |
| Intégrité / export audit              | `GET /api/platform/audit-integrity/status`, `GET /api/platform/audit-entries/export`                                                                                                                        | `AuditIntegrityController`, `AuditExportController`                          |
| État réseau des routeurs              | `ConnectivityStatus {UNKNOWN, ONLINE, OFFLINE}`, `lastSeenAt` renseigné si et seulement si la connectivité est connue                                                                                       | `router/domain/ConnectivityStatus.java`, `RadiusApiClient`                   |

## 2. Lacunes identifiées

1. **Permissions distinctes manquantes** : `platform:organization:read`, `platform:organization:reactivate`,
   `platform:network:read`. `platform:audit:read` existe dans l'amorçage mais n'est lu par aucun contrôleur.
   La réactivation est aujourd'hui protégée par `platform:organization:suspend`.
2. **Aucune liste globale d'organisations** : seulement `GET /{id}` et une recherche par UUID exact.
   Pas de pagination, pas de filtre par statut, pas de recherche par nom.
3. **Aucune vue globale des sites et routeurs** : `SiteApi` et `RouterApi` n'exposent que des lectures par
   identifiant. Aucune liste inter-organisations n'existe.
4. **Endpoint audit plateforme inutilisable** (autorité jamais délivrée) et **sans filtres**.
5. **Compteurs de routeurs faux** : `reporting.organization_overviews.total_routers` et `online_routers`
   ne sont écrits par aucun projecteur — ils restent à 0. Le tableau de bord ne doit donc pas les présenter
   comme des indicateurs de parc.
6. **Aucun indicateur « actions administratives récentes »** : `administrative_actions` n'a pas de lecture.
7. **Sidebar plateforme inexploitable** : `AppSidebar` et `SidebarUserMenu` appellent
   `useActiveOrganization()`, qui lève hors contexte organisation. La route `/platform-admin` pointe donc
   vers une page « forbidden ».
8. **Index manquants** : `audit_entries(occurred_at DESC)` pour un filtre de période seul, et
   `administrative_actions(requested_at DESC)` pour les actions récentes. Les autres filtres
   (organisation, acteur, action, cible, résultat) sont déjà indexés en `V17`.

## 3. Matrice des contrats plateforme

| Cas d'utilisation                | Endpoint réel                                      | Méthode | Permission                         | Requête                                                                                                                                      | Réponse                                                                                                                                                         | Secret | Erreurs                                                     | Preuve                                          |
| -------------------------------- | -------------------------------------------------- | ------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------- | ----------------------------------------------- |
| Permissions de la session        | `GET /api/platform/session`                        | `GET`   | `platform:read`                    | —                                                                                                                                            | `PlatformSessionView(userId, permissions[], administrator)`                                                                                                     | non    | `403`                                                       | nouveau, `platformadmin`                        |
| Tableau de bord                  | `GET /api/platform/dashboard`                      | `GET`   | `platform:read`                    | —                                                                                                                                            | `PlatformDashboardView` : totaux organisation depuis la projection reporting + **fraîcheur par bloc**, compteurs sites/routeurs **en direct**, actions récentes | non    | `403`                                                       | nouveau, composition `PlatformDashboardService` |
| Liste des organisations          | `GET /api/platform/organizations`                  | `GET`   | `platform:organization:read`       | `page≥0`, `size` 1..100, `status`, `query` (nom ou UUID), `sort∈{name,createdAt,updatedAt}`                                                  | `PlatformPageView<PlatformOrganizationSummaryView>`                                                                                                             | non    | `400`, `403`                                                | nouveau, via `OrganizationDirectoryApi`         |
| Fiche organisation               | `GET /api/platform/organizations/{id}`             | `GET`   | `platform:organization:read`       | UUID                                                                                                                                         | `PlatformOrganizationDetailView` : `OrganizationView` + sites (5 max) + répartition routeurs + 10 derniers audits de l'organisation                             | non    | `403`, `404`                                                | nouveau                                         |
| Suspension                       | `POST /api/platform/organizations/{id}/suspend`    | `POST`  | `platform:organization:suspend`    | `{reason, confirmation:"SUSPEND_ORGANIZATION", idempotencyKey}`                                                                              | `OrganizationView`                                                                                                                                              | non    | `400` motif/clé, `403`, `404`, `409` conflit ou idempotence | existant                                        |
| Réactivation                     | `POST /api/platform/organizations/{id}/reactivate` | `POST`  | `platform:organization:reactivate` | `{reason, confirmation:"REACTIVATE_ORGANIZATION", idempotencyKey}`                                                                           | `OrganizationView`                                                                                                                                              | non    | idem                                                        | existant, permission revue                      |
| Fermeture                        | `POST /api/platform/organizations/{id}/close`      | `POST`  | `platform:organization:suspend`    | `{…confirmation:"CLOSE_ORGANIZATION"}`                                                                                                       | `OrganizationView`                                                                                                                                              | non    | idem                                                        | existant, **non exposé** (hors périmètre)       |
| Liste globale des sites          | `GET /api/platform/sites`                          | `GET`   | `platform:network:read`            | `page`, `size`, `organizationId`, `status`, `query`, `sort`                                                                                  | `PlatformPageView<PlatformSiteView>`                                                                                                                            | non    | `400`, `403`                                                | nouveau, via `SiteDirectoryApi`                 |
| Liste globale des routeurs       | `GET /api/platform/routers`                        | `GET`   | `platform:network:read`            | `page`, `size`, `organizationId`, `siteId`, `lifecycleStatus`, `connectivityStatus`, `query`, `sort`                                         | `PlatformPageView<PlatformRouterView>` (inclut `lastSeenAt`, `failureCode`, **jamais** le message technique complet)                                            | non    | `400`, `403`                                                | nouveau, via `RouterDirectoryApi`               |
| Audit plateforme                 | `GET /api/platform/audit-entries`                  | `GET`   | `platform:audit:read`              | 12 critères (organisation, acteur, type d'acteur, action, cible, résultat, sévérité, source, correlationId, période), `page`, `size`, `sort` | `AuditPageView`                                                                                                                                                 | non    | `400`, `403`                                                | existant, corrigé                               |
| Détail d'un audit                | `GET /api/platform/audit-entries/{id}`             | `GET`   | `platform:audit:read`              | UUID                                                                                                                                         | `AuditEntryView`                                                                                                                                                | non    | `403`, `404`                                                | existant, corrigé                               |
| Actions administratives récentes | `GET /api/platform/administrative-actions`         | `GET`   | `platform:read`                    | `limit` 1..50                                                                                                                                | `List<AdministrativeActionView>`                                                                                                                                | non    | `403`                                                       | nouveau                                         |

## 4. Frontières de modules

- `platformadmin` n'accède qu'à des **API publiques** : `OrganizationDirectoryApi`, `SiteDirectoryApi`,
  `RouterDirectoryApi`, `PlatformReportingApi`, `AuditQueryApi`, `OrganizationApi`. Aucune table d'un autre
  module n'est lue. Les seules tables lues directement par `platformadmin` sont les siennes
  (`platform_admin.*`), comme le fait déjà `AdministrativeActionService`.
- Les nouvelles requêtes de répertoire sont **déclarées et implémentées dans le module propriétaire**
  (organisation, site, router) ; `platformadmin` les consomme.
- Le module `audit` reste propriétaire de son schéma : seuls ses index sont complétés par migration.

## 5. Règles métier reprises, non recopiées

- `Organization.suspend(reason, now)` : refus si `CLOSED`, idempotent si `SUSPENDED`, **motif obligatoire**.
- `Organization.reactivate(now)` : refus si `CLOSED`, idempotent si `ACTIVE`.
- `AdministrativeActionService.execute` : clé d'idempotence obligatoire, confirmation explicite obligatoire,
  audit `SUCCESS`/`FAILURE` dans la transaction, action déjà exécutée → `409` (jamais de rejeu).
- Le statut de l'organisation, la propagation éventuelle et l'état des sessions sont trois notions
  distinctes : l'interface n'affirmera jamais qu'une suspension coupe les sessions ouvertes, aucun
  mécanisme réseau (CoA) n'existant côté plateforme.

## 6. Politiques de sécurité retenues

- Aucune permission n'est accordable depuis l'interface ; l'attribution reste le processus existant
  (`platform_admin.super_administrators`, amorçage par variable d'environnement). Un OWNER d'organisation
  n'obtient rien de plus.
- L'interface est une commodité : chaque endpoint plateforme vérifie sa permission côté serveur et répond
  `403` avec un `ProblemDetail` `PLATFORM_ADMIN_FORBIDDEN`.
- L'audit est en ajout seul (déclencheur PostgreSQL `audit_entries_no_update_delete`) ; aucune API ne
  permet la modification ou la suppression.
- Le frontend n'expose ni mot de passe, ni secret RADIUS, ni clé WireGuard, ni corps de requête sensible :
  les projections Auditées ne contiennent que des identifiants, un motif et une référence de corrélation.

## 7. Migrations

Une seule migration, strictly additive :
`V30__platform_admin_consultation_indexes.sql`
— `audit.audit_entries(occurred_at DESC)` (filtre de période seul) ;
— `platform_admin.administrative_actions(requested_at DESC)` (actions récentes).
