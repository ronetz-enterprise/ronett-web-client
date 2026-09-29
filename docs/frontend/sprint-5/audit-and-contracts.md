# Sprint 5 — Audit et contrats

Audit avant implémentation, le 29 septembre 2026. Backend lu dans `../../platform`, sans modification. Les chemins de preuve ci-dessous sont relatifs à `platform/src/main/java/com/ronetz/platform/site/`.

## Architecture confirmée

React Router Framework 8.4, React 19, TypeScript strict, TanStack Query 5, React Hook Form et Zod 4. Pages fines et features métier ; contexte fourni par OrganizationRoute après restauration de session et vérification serveur du membership. Clés tenantKeys, annulation/purge ciblée au changement de tenant. Client useAuth.request / http-client : bearer mémoire, cookies omis sur routes métier, CSRF existant pour la session web. ApiError conserve ProblemDetail et correlationId ; les textes serveur bruts ne sont pas affichés.

Rapports Sprints 3 et 4, charte, routes, sidebar/navbar, composants installés et frontend-contract lus. Le dépôt contient déjà de nombreuses modifications : elles seront conservées. Thème initial SHA-256 : `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`. Hugeicons et shadcn Base UI conservés.

## Matrice

Base B = `/api/organizations/{organizationId}/sites`. Toutes les routes exigent un principal authentifié (401 possible), avec erreurs transversales de validation et serveur.

| Cas d’utilisation | Endpoint réel           | Méthode | Permission                       | Requête           | Réponse                 | Erreurs         | Preuve                                                                                             |
| ----------------- | ----------------------- | ------- | -------------------------------- | ----------------- | ----------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| Liste             | B                       | GET     | Membership actif                 | Aucun paramètre   | 200 SiteView[]          | 403             | presentation/rest/SiteController.java:list, application/SiteApplicationService.java:list/authorize |
| Détail            | B/{siteId}              | GET     | Membership actif                 | UUID site         | 200 SiteView            | 403,404         | mêmes fichiers : get/requireSite                                                                   |
| Création          | B                       | POST    | OWNER actif, organisation active | CreateSiteRequest | 201 SiteView + Location | 400,403,409     | Controller:create, DTO CreateSiteRequest, Service:create                                           |
| Modification      | B/{siteId}              | PATCH   | OWNER actif, organisation active | UpdateSiteRequest | 200 SiteView            | 400,403,404,409 | Controller:update, DTO UpdateSiteRequest, Service:update                                           |
| Suspension        | B/{siteId}/suspension   | POST    | OWNER actif                      | Sans corps        | 204                     | 403,404,409     | Controller:suspend, domain/Site.java:suspend                                                       |
| Réactivation      | B/{siteId}/reactivation | POST    | OWNER actif, organisation active | Sans corps        | 204                     | 403,404,409     | Controller:reactivate, domain/Site.java:reactivate                                                 |
| Fermeture         | B/{siteId}              | DELETE  | OWNER actif                      | Sans corps        | 204                     | 403,404         | Controller:close, domain/Site.java:close                                                           |

Le guard frontend existant limite les écrans aux organisations actives, même si le backend autorise certaines lectures/transitions pour une organisation suspendue. Aucune permission SITE_* n’existe : les capacités frontend doivent suivre les contrôles membership/OWNER du service.

## Modèles et règles confirmés

SiteView : id, organizationId, name, description nullable, city, district nullable, addressDetails nullable, timezone, status, createdAt, updatedAt. Aucun pays, coordonnées, version ou ETag public.

Création : name et city obligatoires, 150 caractères ; description 2000, district 150, addressDetails 500, timezone 100. Fuseau nommé Java ZoneId, défaut Africa/Douala si null à la création. Modification partielle : null conserve le champ ; chaîne vide efface les champs facultatifs. Les formulaires envoient des chaînes et jamais une organisation choisie librement.

Nom unique par organisation après trim et passage en minuscules, y compris sites fermés (SiteName, Service:requireUniqueName, migration V8). ACTIVE à la création ; ACTIVE → SUSPENDED ; SUSPENDED → ACTIVE ; ACTIVE/SUSPENDED → CLOSED. CLOSED terminal, non modifiable. Répétition de la même transition idempotente côté domaine. Pas de raison demandée.

Suspension/fermeture rendent isActive faux, bloquent requireActive et publient des événements pour audit/reporting. Aucun engagement de coupure immédiate des sessions réseau existantes ne doit être affiché.

SiteExceptionHandler : site-not-found 404, site-access-denied 403, invalid-site-data 400, duplicate-site-name 409, site-transition-forbidden 409. Le site est recherché par id ET organizationId ; un site étranger devient introuvable.

## Limites backend

- Liste complète ordonnée par createdAt/name/id, sans recherche, filtre, tri configurable ou pagination serveur. Recherche/filtre/pagination frontend possibles sur cette liste complète ; aucune query string serveur inventée.
- Pas d’OpenAPI/springdoc trouvé par le rapport contractuel ; contrôleurs/DTO/services constituent les preuves.
- @Version existe uniquement en persistance (SiteJpaEntity, migration V8). Pas de protection publique contre l’écrasement d’une édition ancienne, aucun If-Match à inventer.
- Pas de protocole d’idempotence de création. Aucun rejeu automatique de mutation après réponse incertaine.
- Aucun contrat router/offer/access/accounting ajouté à ce sprint.
