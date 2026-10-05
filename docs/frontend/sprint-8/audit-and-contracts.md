# Sprint 8 — audit préalable et contrats

29 septembre 2026. Audit effectué avant code : architecture app/pages/features/shared, rapports précédents dont Sprint 7, offre publique et administrative, Purchase, interfaces Site/Payment/Access, sécurité HTTP, erreurs, session, cache, composants et thème existants. Les changements du Sprint 7 et de l’utilisateur sont préservés. Pas d’OpenAPI identifiée ; preuves ci-dessous dans `platform/src/main/java/com/ronetz/platform/` et `platform/docs/frontend-contract/`.

## Contrats publics

| Cas d’utilisation              | Endpoint réel                                               | Méthode | Requête                                       | Réponse                                                  | Authentification ou contexte                                     | Erreurs                                                                 | Preuve                                                                             |
| ------------------------------ | ----------------------------------------------------------- | ------- | --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Catalogue                      | `/api/public/sites/{siteId}/offers`                         | GET     | UUID site, page≥0, size1..100                 | content,page,size,totalElements                          | Anonyme, site résolu côté serveur                                | 400 ; site absent/inactif ou org inactive : 200 vide                    | PublicOfferController.list, OfferApplicationService.listPublishedOffers            |
| Sélection/récapitulatif        | `/api/public/sites/{siteId}/offers/{offerId}`               | GET     | UUID site/offre                               | PublicOfferResponse                                      | Anonyme ; même site, PUBLISHED, parents actifs, devise cohérente | 404 offer-unavailable ; 400 UUID invalide                               | PublicOfferController.get, OfferApplicationService.purchasable                     |
| Création                       | `/api/public/sites/{siteId}/checkout`                       | POST    | offerId requis, phoneNumber/email facultatifs | 201 Checkout(purchase,checkoutToken,expiresAt), no-store | Anonyme ; organisation dérivée du site par le serveur            | 400 validation, 403 CheckoutDenied ; limite120/min globale également403 | PublicCheckoutController, PurchaseCheckoutService.create, CheckoutExceptionHandler |
| Récupération d’intention       | Aucun                                                       | —       | —                                             | —                                                        | Aucun protocole exposé                                           | —                                                                       | Contrôleurs Purchase et Checkout inspectés                                         |
| Statut/reprise Purchase public | Aucun                                                       | —       | —                                             | —                                                        | authorize(id,token) est interne, pas HTTP                        | —                                                                       | PurchaseCheckoutApi, PurchaseCheckoutService                                       |
| Consultation de paiement       | `/api/purchases/{purchaseId}/payment`, `/api/payments/{id}` | GET     | X-Checkout-Token                              | PaymentView                                              | Token checkout                                                   | Refus/expiration                                                        | PaymentController : hors périmètre, ne remplace pas le statut Purchase             |

Projection publique d’offre : offerId, siteId, name, description, price(amount,currencyCode), accessPolicy(validitySeconds,dataAllowanceBytes,downloadLimitBps,uploadLimitBps,maxConcurrentSessions), displayOrder. Aucun propriétaire, organisation, date d’audit, statut interne ou nom public du site. Pagination et tri serveur stables.

## Contrats administratifs

| Cas d’utilisation                  | Endpoint réel                                                  | Méthode | Permission                                                         | Requête                                                                                       | Réponse                                             | Erreurs                           | Preuve                                                               |
| ---------------------------------- | -------------------------------------------------------------- | ------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| Création                           | `/api/organizations/{organizationId}/sites/{siteId}/purchases` | POST    | Authentification globale seulement ; aucun acteur passé au service | CreatePurchaseRequest(offerId,routerId,buyerPhone,buyerEmail,captiveSessionId,idempotencyKey) | 201 PurchaseResponse                                | 400/401/404/conflit selon domaine | PurchaseController.create, PurchaseApplicationService.createPurchase |
| Détail                             | `/api/purchases/{purchaseId}`                                  | GET     | Authentification globale seulement ; pas de membership vérifié     | UUID                                                                                          | PurchaseResponse contenant aussi des données client | 401/404                           | PurchaseController.get, PurchaseApplicationService.getPurchase       |
| Annulation                         | `/api/purchases/{purchaseId}/cancel`                           | POST    | Authentification globale, autorisation fine absente                | raison                                                                                        | PurchaseResponse                                    | Validation/transition             | PurchaseController.cancel : non intégré                              |
| Marquer payé / échec paiement      | `/api/purchases/{purchaseId}/payment`, `/payment-failed`       | POST    | denyAll                                                            | DTO internes                                                                                  | Non utilisable depuis navigateur                    | 403                               | SecurityConfiguration : hors périmètre                               |
| Liste/recherche/filtres/pagination | Aucun                                                          | —       | Aucune capacité exposée                                            | —                                                                                             | —                                                   | —                                 | Aucun mapping de collection GET dans PurchaseController              |

La présence d’une connexion authentifiée n’établit pas l’autorisation sur un achat. Le frontend n’expose donc pas le GET global aux administrateurs : un filtrage après réception ne corrigerait pas une fuite serveur. Aucun droit PURCHASE_* inventé.

## Maturité et décision

| Capacité                                             | État                                                      | Décision frontend                                                              |
| ---------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Catalogue et offre publique                          | Disponible et documentée                                  | Implémenter avec DTO public uniquement                                         |
| Résolution du site pour l’éligibilité                | Disponible via Offer                                      | Utiliser l’UUID exact fourni par le lien ; aucune organisation dans la requête |
| Nom public du site, slug ou contexte portail signé   | Absents                                                   | Ne pas utiliser la projection administrative Site                              |
| Distinguer site inconnu/inactif/catalogue vide       | Non exposé par la liste                                   | Message neutre commun, aucune déduction                                        |
| Checkout HTTP                                        | Disponible mais incompatible avec les garanties demandées | Ne pas créer d’achat non idempotent                                            |
| Idempotence Purchase                                 | Absente                                                   | Blocage ; aucun stockage frontend ne peut la remplacer                         |
| Récupération après réponse perdue                    | Absente                                                   | Blocage ; ne pas relancer le POST                                              |
| Reprise après actualisation / statut public Purchase | Méthode interne uniquement                                | Blocage ; pas d’endpoint inventé                                               |
| Administration Purchase tenant-safe                  | Protection insuffisante / liste absente                   | Blocage, aucune route privée ni capacité ajoutée                               |
| Paiement                                             | Contrats distincts disponibles                            | Différé Sprint 9, aucun appel                                                  |
| Access / credentials                                 | API distincte                                             | Hors périmètre, aucun appel                                                    |

## Prix, snapshot et statuts

Prix BigDecimal exact, politique courante réutilisant les formatters du Sprint 7. Un récapitulatif d’offre n’est pas un snapshot d’achat : aucun achat n’existe dans ce parcours livré.

PurchaseView/Response exposent : id, organizationId, siteId, routerId, offerId, offerName, offerDescription, durationMinutes, dataVolumeMb, maxConcurrentDevices, amount, currency, buyerPhone, buyerEmail, captiveSessionId, status, createdAt, updatedAt, paymentPendingAt, paidAt, paymentFailedAt, cancelledAt, expiredAt, fulfilledAt, failureReason, cancellationReason. Cette projection n’est pas un DTO public minimal dédié.

PurchaseApplicationService capture nom/prix/devise et convertit les secondes en minutes par division entière. Checkout conserve en parallèle la politique exacte dans checkout_sessions pour les API internes, mais ne l’expose pas dans le snapshot HTTP PurchaseView. Ne pas fusionner ces deux représentations ni reconstituer les conditions historiques depuis l’offre courante.

Statuts réels : CREATED, PAYMENT_PENDING, PAID, PAYMENT_FAILED, CANCELLED, EXPIRED, FULFILLED. Ils ne décrivent pas directement un statut de transaction Payment ou un accès réseau effectif.

## Idempotence, récupération, données personnelles

Le POST public ne reçoit aucune clé. Chaque appel crée un UUID aléatoire et un nouveau token de 32 octets encodé base64url (43 caractères). Le DTO de création privé contient idempotencyKey, mais createPurchase ne la consomme pas. Pas de récupération par intention, pas de rejeu garanti, pas de gestion de payload différent sous la même clé. Le verrou UI seul ne suffit pas après timeout/actualisation.

Le token checkout est un secret porteur : hash persistant côté serveur, validité de paiement20min, autorisation de lecture interne24h. Ces délais ne constituent pas une expiration publique de l’achat. Aucun cookie de reprise ou endpoint de statut Purchase utilisant ce token n’est exposé. L’interface livrée ne reçoit, ne conserve et ne journalise aucun token checkout.

Téléphone facultatif : `+[1-9][0-9]{7,14}`, email facultatif @Email et longueur≤255. Puisque la création est bloquée, aucun formulaire client ni donnée personnelle n’est collecté. Aucun appel Payment/Access/RADIUS, aucun prix depuis l’URL, aucun montant envoyé, aucun secret dans les clés de cache.

## Prérequis pour débloquer la suite

1. Création publique idempotente avec portée, durée de conservation, fingerprint du contenu et comportement concurrent documentés.
2. Résolution d’une intention dont la réponse a été perdue, sans nouveau POST non protégé.
3. Statut et reprise publics sûrs, projection minimale et mode de transmission/persistance documenté du secret éventuel.
4. Snapshot commercial exact et cohérent incluant les conditions réellement promises.
5. Lecture/listage administratifs avec membership, permissions et filtrage tenant vérifiés par le serveur.
6. Si souhaité, projection publique du nom/contexte de site ; garder l’absence d’information comme telle en attendant.
