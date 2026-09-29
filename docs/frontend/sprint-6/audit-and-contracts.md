# Sprint 6 — Audit préalable

Audit du 29 septembre 2026, avant implémentation. Rapports Sprints 3/4/5, charte, guards, session/CSRF, client HTTP, erreurs, TanStack Query et module site inspectés. React Router Framework 8.4, React 19, RHF/Zod, shadcn Base UI 4.21.0 et Hugeicons conservés. Aucun AGENTS.md trouvé dans l’arborescence parente inspectée. Les nombreuses modifications préexistantes sont conservées.

Empreinte initiale app.css : `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`.

## Preuves

Backend local : `../../platform/src/main/java/com/ronetz/platform/router/`. Sources : `presentation/rest/RouterController.java` (C), DTO CreateRouterRequest/RenameRouterRequest (D), `application/RouterApplicationService.java` (S), `application/RouterProvisioningQuery.java` (Q), `domain/Router.java` (R), `presentation/rest/RouterExceptionHandler.java` (E). Tests lus : RouterRestTest (authentification sur les dix endpoints, memberships, pagination, renommage, déduplication, erreurs de passerelle). Documentation : platform/docs/router.md, frontend-contract, node-agent/ronet-node-agent/docs/architecture.md, contracts.md et ownership-and-fencing.md. Pas d’OpenAPI selon l’audit contractuel ; aucun client généré.

## Matrice contractuelle

B = `/api/routers`, O = `/api/organizations/{organizationId}/routers`. Toutes les routes sont authentifiées (401), avec erreurs transversales 5xx. La réponse RouterView ne contient aucun secret ou contenu de script.

| Cas d’utilisation       | Endpoint réel                  | Méthode | Permission                                              | Requête                                              | Réponse                                                   | Données sensibles                   | Erreurs         | Preuve                            |
| ----------------------- | ------------------------------ | ------- | ------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------- | ----------------------------------- | --------------- | --------------------------------- |
| Liste                   | O                              | GET     | Membership actif                                        | page ≥ 0, size 1..100 (défaut 20)                    | RouterPage(content,page,size,totalElements)               | Aucune                              | 400,403         | C.list, S.list                    |
| Création                | B                              | POST    | OWNER actif, organisation active ; site actif si fourni | organizationId, siteId nullable, name, vendor, model | 201 RouterView + Location                                 | Aucune                              | 400,403,404,409 | C.create, D, S.create             |
| Détail                  | B/{id}                         | GET     | Membership actif dans l’organisation réelle             | UUID                                                 | RouterView                                                | Aucune                              | 403,404         | C.get, S.get                      |
| Renommage               | B/{id}/name                    | PATCH   | OWNER actif, organisation active                        | name                                                 | RouterView                                                | Aucune                              | 400,403,404,409 | C.rename, D, S.rename             |
| État                    | B/{id}/provisioning            | GET     | Membership actif                                        | Aucun                                                | RouterView après consultation éventuelle du control plane | Références opaques seulement        | 403,404,502,503 | C.provisioning, Q.get             |
| Provisionnement         | B/{id}/provisioning            | POST    | OWNER, organisation/site actifs                         | Idempotency-Key UUID, sans corps                     | 202 RouterView                                            | Aucune                              | 400,403,404,409 | C.provision, S.request, R.request |
| Renouvellement artefact | B/{id}/configuration-artifacts | POST    | OWNER, organisation/site actifs                         | Idempotency-Key UUID                                 | 202 RouterView                                            | Référence uniquement, pas de script | 400,403,404,409 | C.artifact, S.request, R.request  |
| Suspension              | B/{id}/suspension              | POST    | OWNER actif                                             | Idempotency-Key UUID                                 | 202 RouterView                                            | Aucune                              | 400,403,404,409 | C.suspend, S.request, R.request   |
| Reprise                 | B/{id}/suspension              | DELETE  | OWNER, organisation/site actifs                         | Idempotency-Key UUID                                 | 202 RouterView                                            | Aucune                              | 400,403,404,409 | C.resume, S.request, R.request    |
| Révocation              | B/{id}/revocation              | POST    | OWNER actif                                             | Idempotency-Key UUID                                 | 202 RouterView                                            | Aucune                              | 400,403,404,409 | C.revoke, S.request, R.request    |

## Capacités réelles

| Capacité                                                                     | État                                               | Conséquence frontend                                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Liste paginée, création, détail, renommage                                   | Disponible/documentée                              | Implémenter                                                                 |
| Commandes 202 et consultation de projection                                  | Disponible/documentée                              | Intégrer sans assimiler acceptation à exécution                             |
| Recherche, filtres site/vendor/statuts, tri configurable                     | Absents du contrôleur                              | Bloqués ; pas de filtrage trompeur d’une seule page ni chargement exhaustif |
| Exécution technique routeur                                                  | Préparée, non raccordée au Node Agent décrit       | Signaler la limite ; ne pas promettre d’installation, connexion ou succès   |
| Script/contenu d’artefact/téléchargement                                     | Aucun endpoint public                              | Bloqué ; aucune reconstruction ni appel direct à l’infrastructure           |
| Vendor supporté de bout en bout                                              | Champ libre validé, pas de catalogue de capacités  | Saisie libre, aucune promesse de compatibilité constructeur                 |
| Déplacement de site, hardware/serial, historique public, rotation credential | Absents                                            | Ne pas simuler                                                              |
| REMOTE_ACTIVE                                                                | Concept du module ACCESS, pas un statut RouterView | Hors périmètre ; ne pas afficher comme disponible                           |

## Règles confirmées

RouterView : id, organizationId, siteId nullable, name, vendor, model, lifecycleStatus, provisioningStatus, connectivityStatus, provisioningOperationId nullable, configurationArtifactId nullable, failureCode/failureMessage nullables, lastSeenAt nullable, createdAt, updatedAt. Pas de version publique. Nom/modèle 1..150, vendor 1..100, trim, aucun caractère de contrôle. Pas de règle d’unicité du nom ni numéro de série exposé. Renommage uniquement, interdit après REVOKED.

Cycle : ACTIVE/SUSPENDED/REVOKED. Provisioning : NOT_REQUESTED/PROVISIONING/PENDING_ENROLLMENT/REGISTERED/REVOKING/FAILED. Connectivité : UNKNOWN/ONLINE/OFFLINE. lastSeenAt représente la date d’observation, y compris OFFLINE, pas une preuve d’authentification RADIUS.

PROVISION exige ACTIVE et NOT_REQUESTED/FAILED ; ARTIFACT exige ACTIVE et PENDING_ENROLLMENT/REGISTERED ; SUSPEND/RESUME interdits pendant PROVISIONING/REVOKING ; REVOKED terminal. La suspension/révocation rend le cycle SUSPENDED dès la demande, sans preuve d’application réseau. La reprise exige une confirmation technique pour redevenir ACTIVE. Une action technique interne en attente peut encore causer 409 : pendingAction n’est pas exposé, donc impossible de prédire parfaitement les capacités frontend.

Idempotence : clé UUID obligatoire pour les cinq commandes, conservée sans expiration côté backend par routeur ; même clé/même commande = projection actuelle, même clé/autre commande = 409. Une réponse perdue doit être rejouée avec la même clé. Une nouvelle intention après échec confirmé utilise une nouvelle clé. Création/renommage sans protocole d’idempotence public.

Le GET de provisioning est le seul endpoint public de suivi, sans intervalle navigateur prescrit. Le rythme serveur de récupération (60 secondes, publications de plus de 30 secondes) n’est pas une recommandation de polling navigateur. Le suivi frontend doit donc documenter sa propre cadence bornée et ne jamais convertir la fin du suivi en échec métier.

## Frontières et sécurité

Site = emplacement ; routeur = NAS métier ; nœud = infrastructure pouvant servir plusieurs sites ; Node Agent = exécutant technique. Seul le backend Ronetz est appelé par le navigateur. Les routes /internal/v1 et /agent/v1 ne sont pas utilisables par le frontend. Le contrat Node Agent annonce 501 ROUTER_CONTROL_PLANE_NOT_MIGRATED pour le control plane routeur. Ownership/fencing ACCESS ne prouve aucun provisioning routeur.

Le détail/mutations Router sont indexés par routerId sans organizationId dans le chemin : vérifier l’organisation de la réponse avant cache/affichage et relire la ressource avant commande. Un site éventuel doit également être relu dans son organisation via l’API publique de la feature site. Le formulaire Sprint 6 exigera un site actif validé pour préserver le parcours Organization → Site → Router ; les anciens routeurs siteId=null restent consultables.

Aucun secret livré dans le contrat actuel. Références opération/artefact : `[A-Za-z0-9_-]{1,150}`, jamais une URL. Aucune copie/téléchargement de script proposé. Les erreurs brutes et champs inattendus ne doivent pas entrer dans l’affichage ni dans les caches métier.
