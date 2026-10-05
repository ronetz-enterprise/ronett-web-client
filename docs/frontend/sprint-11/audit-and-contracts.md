# Sprint 11 — audit préalable, contrats Access et Accounting

30 septembre 2026. Audit effectué avant toute modification : rapports Sprint 8 et Sprint 10, module
backend `access` (contrôleurs, API, application, domaine, persistance, documentation
`platform/docs/access*.md`), module backend `accounting` (contrôleurs, DTO, service, autorisation),
module `reporting`, `SecurityConfiguration`, `ProblemDetail`, et l'état réel du frontend. Aucun
OpenAPI. Preuves : `platform/src/main/java/com/ronetz/platform/`, `platform/docs/`.

## 1. Constat majeur : `accounting` backend ≠ sessions réseau

Le module backend `accounting` est **financier** : `LedgerAccount`, `LedgerEntry`,
`LedgerTransaction`, `Money`, `Withdrawal`, `CommissionPolicy`, `FlutterwavePayoutGateway`. Il ne
contient aucune session, aucun compteur d'octets, aucune IP, aucune MAC, aucune cause de fin.

Recherche exhaustive dans `platform/src/main/java` et dans le schéma PostgreSQL local :

| Recherche                                                           | Résultat                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `radacct`, `AccountingSession`, `AcctSession`, `nas_ip_address`     | **0 occurrence** dans le code applicatif                                        |
| table `radius.radacct`                                              | **inexistante** (`\dt radius.*` → seule `radius.access_projection_ownership`)   |
| mapping HTTP `sessions` / `usage` / `traffic` / `volume` / `online` | **aucun** (seul `/{organizationId}/active` qui est l'activation d'organisation) |
| contrôleur de sessions                                              | **aucun** parmi les 55 contrôleurs du backend                                   |
| `AccessController` : mot `sessions`                                 | une seule occurrence, dans un message de validation de policy                   |

Les seuls compteurs de consommation existants sont des colonnes
`reporting.access_summaries(total_session_count, total_input_bytes, total_output_bytes,
authentication_success_count, authentication_failure_count)`, **que aucun projecteur n'écrit** :
`ReportingEventProjector` ne met à jour que `created/provisioned/active/expired/suspended/revoked`.
La série `AccessReportView.series` est `List.of()` en dur et `dataLastUpdatedAt` vaut
`clock.instant()`. Ces valeurs resteraient donc à zéro, sans fraîcheur réelle, et le module
`reporting` est hors périmètre de ce sprint.

**Conclusion : aucun contrat de session réseau n'existe. L'espace `accounting` est `BLOCKED`.**

## 2. Autorisation des routes `accounting` (constat de sécurité)

`AccountingController` et `WithdrawalController` ne reçoivent **aucun principal** et
`AccountingApplicationService` ne vérifie **aucune membership**. Seule l'authentification globale
s'applique (`anyRequest().authenticated()`). `WithdrawalController.requestWithdrawal` lit
l'identité d'un en-tête `X-User-Id` supplied par le client, au lieu du JWT.

Conséquence : n'importe quel utilisateur authentifié pourrait lire le solde, le grand livre et les
retraits d'une autre organisation en remplaçant l'UUID du chemin. Un filtrage frontend après
réception ne corrige pas une fuite serveur (précedent établi au Sprint 8 pour `Purchase`). **Ces
routes ne sont donc pas exposées par le frontend**, et aucun filtre frontend ne peut se substituer à
l'autorisation manquante.

## 3. Matrice des contrats Access

Autorisation commune vérifiée dans `AccessApplicationService#authorize` : membership **active**,
`hasActiveMembership` **et** `isOwner`, puis `requireScope` (organisation existante, site rattaché,
organisation et site **actifs** pour une création ou une reprise). Aucune de ces routes n'est
atteignable par un simple utilisateur authentifié.

| Cas d'utilisation                                                              | Endpoint réel                                                             | Méthode  | Permission  | Requête                                                                                                                                                                                                 | Réponse                                                                                                                               | Secret présent         | Erreurs                                                                                                                                                   | Preuve                                                                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Liste organisation                                                             | `/api/organizations/{organizationId}/access-grants`                       | `GET`    | OWNER actif | `page≥0`, `size` 1..100 (défaut 20)                                                                                                                                                                     | `PageResult<AccessGrantView>(content,page,size,totalElements)`                                                                        | non                    | `400`, `401`, `403`, `404`                                                                                                                                | `AccessController.listOrganization`                                                                         |
| Liste site                                                                     | `/api/organizations/{organizationId}/sites/{siteId}/access-grants`        | `GET`    | OWNER actif | `page`, `size`                                                                                                                                                                                          | `PageResult<AccessGrantView>`                                                                                                         | non                    | idem                                                                                                                                                      | `AccessController.listSite`                                                                                 |
| Détail                                                                         | `/api/access-grants/{id}`                                                 | `GET`    | OWNER actif | UUID                                                                                                                                                                                                    | `AccessGrantView`                                                                                                                     | non                    | `400`, `403`, `404`                                                                                                                                       | `AccessController.get`                                                                                      |
| Création manuelle                                                              | `/api/organizations/{organizationId}/sites/{siteId}/access-grants/manual` | `POST`   | OWNER actif | en-tête **`Idempotency-Key`** (UUID, sert de `sourceId`) + `{subjectType, subjectId, policy{validitySeconds,dataAllowanceBytes,downloadLimitBps,uploadLimitBps,maxConcurrentSessions}, activationMode}` | `201` si créé / `200` si rejeu, `Cache-Control: no-store`, `AccessIssuanceResult(grant, created, credentialDelivery, retrievalToken)` | **oui, à la création** | `400` validation/policy, `403`, `404` site/org, `409` conflit de source ou username existant, `502` projection incohérente, `503` projection indisponible | `AccessController.create`, `AccessApplicationService#grantManualAccess`                                     |
| Suspension                                                                     | `/api/access-grants/{id}/suspension`                                      | `POST`   | OWNER actif | **corps vide**, aucune raison                                                                                                                                                                           | `AccessGrantView`                                                                                                                     | non                    | `403`, `404`, `409` (autre transition ou projection `FAILED` en attente), `503`                                                                           | `AccessController.suspend`                                                                                  |
| Reprise                                                                        | `/api/access-grants/{id}/suspension`                                      | `DELETE` | OWNER actif | corps vide                                                                                                                                                                                              | `AccessGrantView`                                                                                                                     | non                    | idem                                                                                                                                                      | `AccessController.resume`                                                                                   |
| Révocation                                                                     | `/api/access-grants/{id}/revocation`                                      | `POST`   | OWNER actif | corps vide                                                                                                                                                                                              | `AccessGrantView`                                                                                                                     | non                    | idem                                                                                                                                                      | `AccessController.revoke`                                                                                   |
| Relance de projection                                                          | `/api/access-grants/{id}/projection-retries`                              | `POST`   | OWNER actif | corps vide                                                                                                                                                                                              | `AccessGrantView`                                                                                                                     | non                    | `403`, `404`, `503`                                                                                                                                       | `AccessController.retry`                                                                                    |
| Historique des changements métier                                              | **aucun**                                                                 | —        | —           | —                                                                                                                                                                                                       | —                                                                                                                                     | —                      | —                                                                                                                                                         | `access.access_changes` n'est écrite par aucun lecteur HTTP ; `AccessAuditRepository` n'expose que `append` |
| Statut de projection détaillé (tentatives, prochaine tentative, code d'erreur) | **aucun**                                                                 | —        | —           | —                                                                                                                                                                                                       | —                                                                                                                                     | —                      | —                                                                                                                                                         | `ProjectionStateJpaEntity.{attemptCount,nextAttemptAt,lastErrorCode}` non projetés dans `AccessGrantView`   |
| Filtrage serveur (statut, source, projection, période, recherche)              | **aucun**                                                                 | —        | —           | —                                                                                                                                                                                                       | —                                                                                                                                     | —                      | —                                                                                                                                                         | signatures `list(actor, org, site, page, size)` uniquement                                                  |
| Export des accès                                                               | **aucun**                                                                 | —        | —           | —                                                                                                                                                                                                       | —                                                                                                                                     | —                      | —                                                                                                                                                         | aucun mapping `GET` d'export dans `AccessController`                                                        |

### Sémantique exacte des transitions (à ne pas réécrire côté frontend)

| Action            | Effet métier                                  | Effet projection                                                    | Comportement si la projection échoue                                                                   |
| ----------------- | --------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Émission manuelle | `PENDING_PROVISIONING` → `ACTIVE`             | insertion `radcheck` (mot de passe, `NAS-Identifier`, `Expiration`) | **transaction entièrement annulée** : ni droit, ni credential, ni ligne RADIUS                         |
| Suspension        | `ACTIVE` → `SUSPENDED`                        | `Auth-Type := Reject`                                               | intention métier **committée**, `projection_status = FAILED`, `pending_action = SUSPEND`, HTTP **503** |
| Reprise           | `SUSPENDED` → `ACTIVE`                        | retrait du Reject, restauration des attributs                       | le droit **reste suspendu** tant que la projection n'a pas réussi                                      |
| Révocation        | tout état non terminal → `REVOKED` (terminal) | suppression `radcheck`/`radreply`                                   | intention **committée**, `FAILED` + `pending_action = REVOKE`, HTTP 503                                |
| Relance           | rejoue `projection.pendingAction`             | rejoue l'action en attente                                          | nouvel échec si l'infrastructure est toujours indisponible                                             |
| Expiration        | `EXPIRED` (terminal)                          | suppression                                                         | job `AccessMaintenance` toutes les 60 s                                                                |

`pendingAction` **n'est pas exposé** : une relance peut donc rejouer une suspension, une expiration
ou une **révocation**. L'interface doit le dire et ne jamais promettre « rejoue la configuration ».

### Idempotence de la création manuelle

`Idempotency-Key` = `sourceId` de la source `MANUAL_GRANT`, et `(source_type, source_id)` est unique en
base. Un rejeu avec la même clé **retourne le droit existant avec `created=false` et
`credentialDelivery=null`** : le mot de passe n'est donc **pas** renvoyé une seconde fois. Un rejeu
avec une politique différente produit `409`. La clé doit être générée une fois par formulaire et
conservée pendant la session, jamais régénérée après un échec réseau.

## 4. Matrice des contrats Accounting

| Cas d'utilisation                  | Endpoint réel                                                           | Méthode      | Permission                                                                | Filtres                                                      | Réponse                                                                            | Fraîcheur  | Erreurs                                                              | Preuve                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Liste de sessions réseau           | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | aucun contrôleur, aucune table `radacct`                                       |
| Détail de session                  | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | idem                                                                           |
| Agrégats de sessions / volumes     | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | colonnes `reporting.access_summaries` jamais alimentées                        |
| Session active / stale             | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | aucune notion de fraîcheur côté backend                                        |
| IP / MAC observée                  | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | `radacct` inexistante                                                          |
| Export Accounting                  | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | aucun endpoint d'export réseau                                                 |
| Déconnexion forcée (CoA)           | **aucun**                                                               | —            | —                                                                         | —                                                            | —                                                                                  | —          | —                                                                    | `docs/access.md` : « Déconnexion immédiate : Aucune — CoA/Disconnect différé » |
| Solde financier                    | `/api/organizations/{organizationId}/accounting/balance`                | `GET`        | **aucune** (authentification globale seule)                               | —                                                            | `BalanceResponse(organizationId, pending, available, reserved, paidOut, currency)` | instantané | `404 balance-not-found`                                              | `AccountingController.getBalance` — **non exposé**                             |
| Grand livre                        | `/api/organizations/{organizationId}/accounting/ledger`                 | `GET`        | **aucune**                                                                | `page`, `size≤100`, `type`, `status`, `from`, `to` (Instant) | `LedgerTransactionListResponse(content,page,size,totalElements,totalPages)`        | instantané | `400`, `404`                                                         | idem — **non exposé**                                                          |
| Transaction                        | `/api/organizations/{organizationId}/accounting/ledger/{transactionId}` | `GET`        | **aucune**, et le `transactionId` n'est pas vérifié contre l'organisation | UUID                                                         | `LedgerTransactionResponse(..., entries[])`                                        | instantané | `404 transaction-not-found`                                          | idem — **non exposé**                                                          |
| Retraits (liste, détail, création) | `/api/organizations/{organizationId}/withdrawals[/{id}]`                | `GET`/`POST` | **aucune** ; identité lue dans l'en-tête `X-User-Id`                      | `page`, `size`, `status`                                     | `WithdrawalResponse`                                                               | instantané | `400`, `404`, `409 insufficient-balance`, `409 duplicate-withdrawal` | `WithdrawalController` — **non exposé**                                        |

## 5. Maturité des capacités

| Capacité                                                       | État                                                                                    | Décision frontend                                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Consulter la liste des accès (organisation, site)              | Disponible et documentée                                                                | Implémenter                                                                                     |
| Consulter le détail d'un accès                                 | Disponible et documentée                                                                | Implémenter                                                                                     |
| Filtrer par site                                               | Disponible (`listSite`)                                                                 | Implémenter via l'endpoint site                                                                 |
| Filtrer par statut / source / projection / période / recherche | **Absent**                                                                              | Implémenter sur la page courante, avec mention explicite ; ne jamais annoncer un filtre serveur |
| Créer un accès manuel                                          | Disponible et documentée                                                                | Implémenter, y compris la réponse sensible unique                                               |
| Suspendre / reprendre / révoquer                               | Disponible et documentée                                                                | Implémenter avec `AlertDialog`, sans état optimiste                                             |
| Relancer une projection                                        | Disponible et documentée                                                                | Implémenter, en expliquant que l'action rejouée est inconnue                                    |
| Historique des changements                                     | Absent                                                                                  | Documenter ; ne pas synthétiser depuis `updatedAt`                                              |
| Projection détaillée (tentatives, prochaine tentative)         | Absent                                                                                  | Documenter ; ne pas inventer de seuil                                                           |
| Sessions réseau (liste, détail, agrégats)                      | Absent                                                                                  | Ne pas implémenter                                                                              |
| IP / MAC                                                       | Absent                                                                                  | Ne pas implémenter                                                                              |
| Déconnexion forcée                                             | Absent                                                                                  | Ne pas implémenter                                                                              |
| Export Accounting                                              | Absent                                                                                  | Ne pas implémenter                                                                              |
| Grand livre / retraits                                         | Disponible **mais autorisation tenant absente** et hors périmètre (reporting financier) | Ne pas exposer                                                                                  |
| Reporting opérationnel (`/reports/access`)                     | Préparé mais **non alimenté** pour sessions et octets ; hors périmètre                  | Ne pas utiliser                                                                                 |

## 6. Condition commerciale vs condition techniquement appliquée

`platform/docs/access.md` (table « Projection implémentée » et « Prérequis avant activation ») est
explicite :

| Règle de la policy        | Projection réellement appliquée                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Mot de passe              | `radcheck: Cleartext-Password := secret`                                                                         |
| Site                      | `radcheck: NAS-Identifier == siteUUID` (exige la configuration NAS)                                              |
| Expiration                | `radcheck: Expiration := epochSeconds`                                                                           |
| Suspension                | `radcheck: Auth-Type := Reject`                                                                                  |
| **Sessions simultanées**  | **Aucune** — « Politique enregistrée uniquement »                                                                |
| **Débit**                 | **Aucune** — « Politique enregistrée uniquement ; dictionnaire/Mikrotik-Rate-Limit et sens RX/TX non certifiés » |
| **Quota total**           | **Aucune** — « aucun compteur radacct ni consommation fictive »                                                  |
| **Déconnexion immédiate** | **Aucune** — « CoA/Disconnect différé »                                                                          |

« Une politique limitée **n'implique pas** que cette limite soit appliquée par le réseau dans cette
version. » L'interface doit donc distinguer la condition commerciale **enregistrée** de son
application technique, sans jamais afficher un état de conformité inventé.

## 7. Données personnelles exposées

`AccessGrantView` contient `subjectType`/`subjectId` (bénéficiaire), `issuedByIdentityId` (acteur),
`username`, `sourceId`. Aucun champ réseau : ni IP, ni MAC, ni nom d'utilisateur WiFi d'un client, ni
mot de passe. Le seul secret du module est `credentialDelivery.clearTextPassword`, retourné **à la
création uniquement** et absent de toutes les lectures. Aucun rôle, pas même OWNER, ne peut lire un
mot de passe existant : il n'existe aucun endpoint pour cela.

## 8. Décisions frontend

1. Aucune route `/accounting` : sans contrat, une page serait un écran menteur. Le gap est documenté.
2. Les filtres statut / source / projection / recherche / période s'appliquent à la page affichée et
   le disent ; le sélecteur de site utilise le vrai endpoint scopé.
3. Aucune transition optimiste : le statut n'est mis à jour qu'après la réponse du backend, et les
   dimensions métier / projection restent séparées.
4. Le corps de la réponse de création manuelle est traité comme sensible : jamais de query TanStack,
   jamais de `localStorage`/`sessionStorage`, jamais d'URL, jamais de log ; `retrievalToken` n'est
   jamais affiché ; le mot de passe n'est affiché que dans le panneau de l'émission et disparaît à la
   navigation.
5. Aucune fonctionnalité de sprint antérieur n'est réécrite : le suivi de projection du Sprint 10 est
   conservé et étendu.
