# Sprint 10 — audit préalable, contrats Access et verdict de délivrance

29 septembre 2026. Audit effectué **avant toute modification** : module backend `access` (contrôleurs,
API, application, domaine, infrastructure, persistance, migrations), module `payment`, module
`purchase`, sécurité HTTP, `ProblemDetail`, journalisation, notifications, rapports de Sprint 7 et
Sprint 8, routes et conventions du frontend existant. Aucun OpenAPI n'existe. Les preuves sont des
fichiers du dépôt backend `platform/src/main/java/com/ronetz/platform/`.

Le Sprint 9 (paiement Flutterwave) **n'existe pas dans ce dépôt** : aucun module `payment` frontend,
aucune route de paiement, aucun rapport `docs/frontend/sprint-9/`. L'audit le constate et s'appuie sur
le contrat backend réel plutôt que sur un parcours supposé.

## 1. Périmètre réellement public côté Access

Routes HTTP `/api/public/**` du backend (grep exhaustif + `SecurityConfiguration`) :

| Route                                                                                                                       | Présente                   |
| --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `POST /api/public/sites/{siteId}/checkout`                                                                                  | oui (purchase)             |
| `GET /api/public/sites/{siteId}/offers[/{offerId}]`                                                                         | oui (offer)                |
| `POST /api/payments`, `GET /api/payments/{id}`, `GET /api/purchases/{purchaseId}/payment`, `POST /api/payments/{id}/verify` | oui (payment)              |
| `POST /api/public/access-grants/{id}/credential-delivery`                                                                   | oui (access)               |
| `POST/GET /api/public/support/tickets…`                                                                                     | oui (support, hors sprint) |
| **statut public d'un accès / d'une projection**                                                                             | **absente**                |
| **statut public d'un achat**                                                                                                | **absente**                |
| **endpoint de découverte d'un `accessGrantId` pour un acheteur**                                                            | **absente**                |
| **endpoint d'accusé de sauvegarde du secret**                                                                               | **absente**                |
| **endpoint de régénération du credential**                                                                                  | **absente**                |

## 2. Contrats publics Access

| Cas d'utilisation                            | Endpoint réel                                        | Méthode | Authentification ou preuve                                                                                                                                                                                                                              | Requête                                           | Réponse                                                                                                                               | Secret présent    | Erreurs                                                                                                                                                                                           | Preuve                                                                                                                                                    |
| -------------------------------------------- | ---------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Délivrance différée du credential            | `/api/public/access-grants/{id}/credential-delivery` | `POST`  | `permitAll` + preuve dans le corps : soit `delivery_token_hash` de `access.credential_envelopes`, soit `purchase.checkout_sessions.token_hash` via `PurchaseCheckoutApi#authorize` (source `PAID_ORDER`, achat `PAID`/`FULFILLED`, org+site identiques) | `{ "token": "…" }`, 43 caractères `[A-Za-z0-9_-]` | `200` `AccessCredentialDelivery(credentialId, username, clearTextPassword, expiresAt)`, `Cache-Control: no-store`, `Pragma: no-cache` | **oui, en clair** | `403` `problems/access-403` (jeton invalide, aucune enveloppe, fenêtre fermée, ≥5 tentatives, identifiant inconnu) ; `503` `problems/access-503` (droit non `ACTIVE` ou projection non `APPLIED`) | `access/presentation/rest/RemoteCredentialDeliveryController.java`, `access/application/RemoteCredentialDeliveryService.java`                             |
| Statut public de préparation                 | **aucun**                                            | —       | —                                                                                                                                                                                                                                                       | —                                                 | —                                                                                                                                     | —                 | —                                                                                                                                                                                                 | aucun mapping `GET /api/public/**` dans le module access                                                                                                  |
| Découverte du `accessGrantId` par l'acheteur | **aucun**                                            | —       | —                                                                                                                                                                                                                                                       | —                                                 | —                                                                                                                                     | —                 | —                                                                                                                                                                                                 | `PaymentView`, `PurchaseView`, `PurchaseCheckoutService.Checkout` ne contiennent aucun identifiant d'accès ; `AccessGrantView` exige une membership OWNER |
| Accusé de sauvegarde                         | **aucun**                                            | —       | —                                                                                                                                                                                                                                                       | —                                                 | —                                                                                                                                     | —                 | —                                                                                                                                                                                                 | aucun contrôleur, aucune table, aucun état de confirmation                                                                                                |
| Relire un secret déjà délivré                | **aucun**                                            | —       | —                                                                                                                                                                                                                                                       | —                                                 | —                                                                                                                                     | —                 | —                                                                                                                                                                                                 | `deliver` est une relecture bornée, pas un accusé de réception                                                                                            |

## 3. Contrats administratifs Access

| Cas d'utilisation     | Endpoint réel                                                             | Méthode  | Permission                                                                                           | Requête                                                                    | Réponse                                                                                     | Secret présent          | Erreurs                           | Preuve                                                                                                     |
| --------------------- | ------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Liste organisation    | `/api/organizations/{organizationId}/access-grants`                       | `GET`    | `MembershipApi#hasActiveMembership` + `isOwner` (OWNER actif) ; organisation et site actifs vérifiés | `page≥0`, `size` 1..100                                                    | `PageResult<AccessGrantView>(content,page,size,totalElements)`                              | **non**                 | `400`, `403`, `404`, `401`        | `AccessController.listOrganization`, `AccessApplicationService#list`                                       |
| Liste site            | `/api/organizations/{organizationId}/sites/{siteId}/access-grants`        | `GET`    | idem                                                                                                 | `page`, `size`                                                             | `PageResult<AccessGrantView>`                                                               | **non**                 | idem                              | `AccessController.listSite`                                                                                |
| Détail                | `/api/access-grants/{id}`                                                 | `GET`    | idem                                                                                                 | UUID                                                                       | `AccessGrantView`                                                                           | **non** (username seul) | `400`, `403`, `404`               | `AccessController.get`                                                                                     |
| Relance de projection | `/api/access-grants/{id}/projection-retries`                              | `POST`   | idem                                                                                                 | corps vide                                                                 | `AccessGrantView`                                                                           | **non**                 | `403`, `404`                      | `AccessController.retry`, `AccessApplicationService#retryProjection` (no-op si projection ≠ `FAILED`)      |
| Suspension            | `/api/access-grants/{id}/suspension`                                      | `POST`   | idem                                                                                                 | vide                                                                       | `AccessGrantView`                                                                           | **non**                 | `403`, `404`, `409`, `503`        | `AccessController.suspend` — **différé Sprint 11**                                                         |
| Reprise               | `/api/access-grants/{id}/suspension`                                      | `DELETE` | idem                                                                                                 | vide                                                                       | `AccessGrantView`                                                                           | **non**                 | idem                              | `AccessController.resume` — **différé Sprint 11**                                                          |
| Révocation            | `/api/access-grants/{id}/revocation`                                      | `POST`   | idem                                                                                                 | vide                                                                       | `AccessGrantView`                                                                           | **non**                 | idem                              | `AccessController.revoke` — **différé Sprint 11**                                                          |
| Émission manuelle     | `/api/organizations/{organizationId}/sites/{siteId}/access-grants/manual` | `POST`   | OWNER                                                                                                | `Idempotency-Key` (UUID) + `{subjectType,subjectId,policy,activationMode}` | `201/200 AccessIssuanceResult` (`grant`, `created`, `credentialDelivery`, `retrievalToken`) | **oui, en clair**       | `400`, `403`, `404`, `409`, `502` | `AccessController.create` — **différé Sprint 11** (l'émission manuelle est hors périmètre du client final) |
| Détail plateforme     | `/api/platform/accesses/{id}`                                             | `GET`    | permission plateforme `READ`                                                                         | UUID                                                                       | `AccessGrantView`                                                                           | **non**                 | `401`, `403`, `404`               | `PlatformOperationsController.access` — aucune interface Sprint 10                                         |

`AccessGrantView` ne contient **jamais** de mot de passe, de secret RADIUS, d'enveloppe, de token de
livraison ni de donnée Node Agent. `AccessCredentialDelivery.toString()` et
`AccessIssuanceResult.toString()` masquent explicitement le secret et le jeton. Aucun filtre
`OncePerRequestFilter` du backend journalise les corps de requête.

## 4. DTO, statuts et dimensions d'état réellement exposées

`AccessGrantView(accessGrantId, organizationId, siteId, subjectType, subjectId, sourceType, sourceId,
policy{validitySeconds, dataAllowanceBytes, downloadLimitBps, uploadLimitBps, maxConcurrentSessions},
activationMode, status, projectionStatus, issuedByIdentityId, issuedAt, activatedAt, expiresAt,
suspendedAt, revokedAt, updatedAt, username)`.

| Dimension            | Valeurs réelles                                                                                               | Source                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Statut du droit      | `PENDING_PROVISIONING`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `QUOTA_EXHAUSTED`, `REVOKED`, `PROVISIONING_FAILED` | `AccessGrantStatus`                |
| Statut de projection | `NOT_REQUESTED`, `PENDING`, `APPLIED`, `REMOVAL_PENDING`, `REMOVED`, `FAILED`                                 | `ProjectionStateRepository.Status` |
| Statut du credential | `ACTIVE`, `SUSPENDED`, `REVOKED`, `EXPIRED` — **non exposé** en HTTP                                          | `AccessCredentialStatus`           |
| Source               | `PAID_ORDER`, `VOUCHER`, `MANUAL_GRANT`, `ORGANIZATION_USER`, `PROMOTIONAL_CAMPAIGN`                          | `AccessSourceType`                 |
| Bénéficiaire         | `ANONYMOUS`, `IDENTITY`, `SUBSCRIBER`, `DEVICE`                                                               | `AccessSubjectType`                |
| Activation           | `IMMEDIATE` (seul mode accepté par le service)                                                                | `ActivationMode`                   |
| Statut de délivrance | **aucun**                                                                                                     | —                                  |

Observations de code qui conditionnent l'interface :

- `PROVISIONING_FAILED` existe dans l'énumération et dans l'agrégat (`markProvisioningFailed`), mais
  **aucun chemin du service ne l'assigne** : un échec de projection laisse le droit en
  `PENDING_PROVISIONING` avec `projectionStatus = FAILED` et publie `AccessProvisioningFailed`.
  L'échec se lit donc sur la dimension projection, jamais sur le statut du droit.
- Les statuts sont sérialisés en `String` sans OpenAPI : unions ouvertes, libellé de repli.
- `expiresAt` est toujours renseigné en `IMMEDIATE` (dérivé de `activatedAt + validitySeconds`).
  Aucune date de « prochaine tentative » n'est exposée : `ProjectionStateJpaEntity.nextAttemptAt`
  n'est pas projeté.

## 5. Parcours Payment → Access réel

1. `POST /api/payments` (preuve `X-Checkout-Token`) → tentative Flutterwave.
2. Webhook serveur-à-serveur `POST /api/webhooks/flutterwave`, ou `POST /api/payments/{id}/verify`
   par le navigateur → `PaymentConfirmed` publié par le module payment.
3. `commerce.PaymentPurchaseListener` → achat `PAID` (`purchase.checkout_sessions` conserve la
   politique exacte).
4. `access.PaymentAccessListener` (`@ApplicationModuleListener("access.payment-confirmed.v1")`,
   publication durable Spring Modulith) → `AccessApi#grantAccess(source = PAID_ORDER + purchaseId)`,
   bénéficiaire `ANONYMOUS`, activation `IMMEDIATE`. Idempotent par `(sourceType, sourceId)`.
5. `AccessApplicationService#issue` : création du droit, génération du credential
   (`SecureRandomCredentialGenerator`, username `rz_` + 32 hex), `projection_states = PENDING`, puis
   soit projection locale RADIUS immédiate, soit `remote.prepare(...)` en mode `REMOTE_TEST`.
6. Mode `LOCAL` (production) : projection RADIUS dans la transaction, droit `ACTIVE`,
   `projection_status = APPLIED`, `AccessProvisioned` publié. Le secret en clair **n'existe que dans
   la valeur de retour `AccessIssuanceResult.credentialDelivery`**, consommée en mémoire par
   l'appelant interne.
7. Notification `AccessProvisioned` → destinataire `ORGANIZATION` pour un bénéficiaire anonyme,
   `IN_APP`, authentifié, contenu limité au username et à l'expiration. Aucun lien, aucun jeton.
8. `access.AccessMaintenance` (60 s) expire les droits dus et rejoue les projections `FAILED` avec
   backoff (30 s → 1 h, 10 tentatives, puis reprise manuelle).

**Aucun de ces appels n'est déclenché ni observable par le navigateur après la redirection
Flutterwave.** Le client ne peut pas savoir que l'étape 4 a eu lieu.

## 6. Protocole réel de délivrance et vérifications exigées

| Exigence                         | État observé                                                                                                                                                                                                                                                                                                                                     | Preuve                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Intention durable de délivrance  | **partielle** : `access.credential_envelopes` + `access.remote_intents` existent, mais la ligne d'enveloppe n'est écrite que par `JdbcRemoteAccessPreparation#prepare`, qui exige le profil `test`, `ronetz.access.remote-qualification-enabled=true` **et** le mode site `REMOTE_TEST`                                                          | `JdbcRemoteAccessPreparation.java:49-95`, `RemoteQualificationWorker` (`@Profile("test")`), `V26__access_remote_qualification.sql` |
| Donnée temporaire chiffrée       | **oui, dans ce mode seulement** : AES-GCM, `key_version`, `retention_until`                                                                                                                                                                                                                                                                      | `AesGcmAccessCredentialCipher`, `V26`                                                                                              |
| Endpoint public de statut        | **non**                                                                                                                                                                                                                                                                                                                                          | aucun `GET /api/public/**` côté access                                                                                             |
| Endpoint de réclamation          | **oui mais inatteignable** : `POST /api/public/access-grants/{id}/credential-delivery` exige l'UUID du droit, absent de tout contrat public                                                                                                                                                                                                      | `RemoteCredentialDeliveryController`                                                                                               |
| Authentification du demandeur    | **deux preuves, aucune distribuée au client** : (a) `delivery_token_hash` généré dans `prepare()` et renvoyé uniquement dans `AccessIssuanceResult.retrievalToken`, consommé par le listener interne, jamais publié ni notifié ; (b) `checkoutToken` dont le client n'est pas porteur dans ce dépôt (checkout public non idempotent, non exposé) | `JdbcRemoteAccessPreparation#prepare`, `AccessApplicationService#issue:151-153`                                                    |
| Expiration                       | **oui, bornée** : `delivery_until = min(900 s, validitySeconds)`, refus après `expiresAt` du credential                                                                                                                                                                                                                                          | `JdbcRemoteAccessPreparation#prepare:81`, `RemoteCredentialDeliveryService#deliver:59`                                             |
| Lecture unique                   | **non** : relecture bornée, `delivered_at = coalesce(delivered_at, now)`. Le secret peut être relu dans la fenêtre                                                                                                                                                                                                                               | `RemoteCredentialDeliveryService#deliver:67-69`                                                                                    |
| Protection contre les relectures | **plafond de 5 tentatives** (`delivery_attempts`), incrémenté **avant** la vérification du jeton et **commité même en cas de refus** (`@Transactional(noRollbackFor = AccessDeniedException.class)`) : 5 présentations invalides épuisent définitivement la fenêtre                                                                              | `RemoteCredentialDeliveryService#deliver:40,61-65`                                                                                 |
| Protocole de réponse perdue      | **partiel** : le commentaire de service indique « Lost responses may be retried », la borne de 5 tentatives le permet, mais rien n'indique au client le nombre de tentatives restantes, et un échec réseau consomme une tentative                                                                                                                | idem                                                                                                                               |
| Absence de secret dans les logs  | **confirmée** : `toString()` redacts sur `AccessCredentialDelivery` et `AccessIssuanceResult` ; `AccessAuditRepository.Change` ne porte que grant, acteur, action, date, correlationId ; aucun filtre ne journalise les corps                                                                                                                    | `AccessCredentialDelivery.java:27-30`, `AccessIssuanceResult.java:18-20`, `AccessApplicationService#publish`                       |
| Accusé de réception              | **inexistant**                                                                                                                                                                                                                                                                                                                                   | —                                                                                                                                  |
| Régénération de credential       | **inexistante**                                                                                                                                                                                                                                                                                                                                  | —                                                                                                                                  |

## 7. Verdict préalable du protocole de délivrance : `BLOCKED`

Chaîne de rupture, dans l'ordre :

1. **Aucun endpoint de statut public.** Le client ne peut pas savoir si le droit existe, s'il est
   `PENDING_PROVISIONING`, `ACTIVE`, `FAILED`, `SUSPENDED`, `EXPIRED` ou `REVOKED`.
2. **Aucun `accessGrantId` découvrable.** `PaymentView`, `PurchaseView` et la réponse de checkout ne
   le contiennent pas ; `AccessGrantView` exige une membership OWNER ; la notification
   `AccessProvisioned` ne le contient pas. Sans cet UUID, `credential-delivery` est inatteignable.
3. **La preuve n'est pas distribuable.** Le jeton dédié est créé pendant la qualification
   `REMOTE_TEST` (profil `test`) et reste dans la valeur de retour interne. L'autre preuve
   (`checkoutToken`) supposerait que le frontend détient et conserve un secret porteur 24 h — ce que
   le Sprint 8 a justement interdit, le checkout public n'étant ni idempotent ni reprenable.
4. **L'enveloppe n'existe pas en production.** En mode `LOCAL` (chemin réel après paiement), aucune
   ligne `access.credential_envelopes` n'est écrite : `deliver` joint cette table et répond `403`.
   Les tables, `AccessCredentialDelivery`, `AccessGranted` et `AccessProvisioned` ne prouvent donc
   **pas** l'existence d'un endpoint de délivrance exploitable.

Un parcours public « afficher mes identifiants » serait une simulation. Il n'est pas créé. Ce sprint
implémente uniquement le suivi réellement contractuel côté propriétaire d'organisation (lecture des
droits, de leur projection et de leurs conditions) et documente le blocage.

## 8. Ce qui est implémenté, et pourquoi

| Besoin du cahier des charges                                                                                                          | Décision                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suivre la préparation d'un accès                                                                                                      | **Implémenté** pour le propriétaire : `GET /api/access-grants/{id}` + `GET /api/organizations/{id}/access-grants`, avec suivi borné de la projection. **Bloqué** pour le client final : aucun contrat.                            |
| Distinguer paiement / accès / provisioning                                                                                            | **Implémenté** : `sourceType` (dont `PAID_ORDER`), `status` du droit, `projectionStatus` sont trois dimensions affichées séparément. L'état du paiement lui-même n'est pas exposé par `AccessGrantView` et n'est pas reconstitué. |
| Récupérer les identifiants                                                                                                            | **Bloqué** : aucun écran de délivrance.                                                                                                                                                                                           |
| Copier les identifiants                                                                                                               | **Non applicable** : aucun secret à copier. L'identifiant réseau (username) reste copiable, il n'est pas un secret.                                                                                                               |
| Préparation à la réclamation, écran d'avertissement, double clic, expiration de la délivrance, accusé de sauvegarde, résultat inconnu | **Bloqués** : tous supposent un endpoint de délivrance public inexistant. Aucun contournement, aucun jeton, aucune URL de reprise inventés.                                                                                       |
| Échec de provisioning                                                                                                                 | **Implémenté** : état `FAILED` distinct, explication, relance par `POST /projection-retries` avec confirmation.                                                                                                                   |
| Accès actif (dates, conditions)                                                                                                       | **Implémenté** : dates d'activation/expiration issues du backend, politique d'accès réelle. Aucune consommation, aucun suivi de session (Sprint 11).                                                                              |
| Instructions de connexion, lien portail captif                                                                                        | **Bloquées** : aucun contrat ne fournit d'URL de portail ; une URL construite côté client serait une redirection ouverte.                                                                                                         |
| Administration                                                                                                                        | **Partielle** : liste et détail en lecture, plus la relance de projection. Suspension, reprise, révocation, émission manuelle, régénération : différées Sprint 11.                                                                |

## 9. Besoins backend pour débloquer le parcours client

1. Un endpoint public de statut, protégé par la preuve de l'acheteur, exposant au minimum :
   existence du droit, `status`, `projectionStatus`, `expiresAt`, et l'identifiant de droit.
2. La projection de cet identifiant dans une réponse publique existante (`Checkout`, `PaymentView`)
   ou dans un lien signé à durée de vie courte, jamais dans une URL non expirant.
3. Un mode de provisioning qui crée l'enveloppe chiffrée **en production** (pas seulement
   `REMOTE_TEST`/profil `test`).
4. Une preuve distribuable au client : soit jeton dédié affiché une seule fois au moment de la
   délivrance, soit le `checkoutToken` explicitement prévu et documenté pour cet usage.
5. Un contrat explicite de réponse perdue : compteur de tentatives restant, clé d'idempotence ou
   accusé de réception permettant de savoir si la réponse précédente est arrivée.
6. Le déplacement de l'incrément de `delivery_attempts` **après** la vérification du jeton, et un
   plafond dimensionné pour un client légitime.
7. `nextAttemptAt` exposé pour afficher la prochaine tentative de projection sans le recalculer.
8. Une URL de portail captif validée côté configuration backend, si des instructions de connexion
   doivent être affichées.

## 10. Preuves de non-régression

- Thème : `src/app/styles/app.css` non modifié.
- Aucun appel à RADIUS, FreeRADIUS, Node Agent, routeur, MikroTik, WireGuard ou Actuator depuis le
  frontend.
- Aucun secret généré, déduit, lu depuis RADIUS ni persisté : il n'existe dans le code aucun chemin
  qui reçoive un mot de passe.
- Aucune route publique ajoutée : sans contrat public, une route `/access/...` serait un écran
  menteur.
