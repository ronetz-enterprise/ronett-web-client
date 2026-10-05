# Sprint 7 — audit préalable

Audit du 29 septembre 2026, avant implémentation. Sources backend : `platform/docs/offer.md`, `offer/presentation/rest/OfferController.java`, DTO associés, `offer/application/OfferApplicationService.java`, `offer/domain/{InternetOffer,Money,ValidityPeriod,DataAllowance,BandwidthLimit}.java`, API/événements, `offer/infrastructure/persistence/JpaOfferRepository.java`, `purchase/application/PurchaseApplicationService.java`. Pas de dépendance OpenAPI/springdoc dans le pom inspecté.

## Modèle et architecture

Modèle A : Organization → Site → Offer. Organisation/site immuables. Pas de rattachement au routeur ni d’affectation multiple. Administration réservée à OWNER actif, vérifiée par le service, sans permission OFFER_* exposée. Réutilisation des guards session/organisation, TanStack Query tenant-aware, RHF/Zod, client HTTP authentifié et ProblemDetail, composants shadcn Base UI. Rapports Sprints 1–5 et audit Sprint 6 consultés ; qualification navigateur du Sprint 6 interrompue, non certifiée. Les modifications utilisateur présentes (layout/sidebar/tests/sites) sont conservées. React Router Framework, pages sans HTTP, barrels publics entre features.

C = `/api/organizations/{organizationId}/sites/{siteId}/offers`, O = `/api/offers/{offerId}`. Permission commune : OWNER actif. Preuves : contrôleur et méthodes homonymes du service ; requêtes : records DTO du contrôleur.

| Cas d’utilisation | Endpoint réel   | Méthode | Permission  | Requête             | Réponse                         | Erreurs         | Preuve             |
| ----------------- | --------------- | ------- | ----------- | ------------------- | ------------------------------- | --------------- | ------------------ |
| Liste             | C               | GET     | OWNER actif | page≥0,size1..100   | content,page,size,totalElements | 400,403,404     | list, repository   |
| Création          | C               | POST    | OWNER actif | CreateOfferRequest  | OfferResponse,201,Location      | 400,403,404,409 | create             |
| Détail            | O               | GET     | OWNER actif | UUID                | OfferResponse                   | 403,404         | get                |
| Informations      | O               | PATCH   | OWNER actif | name?,description?  | OfferResponse                   | 400,403,404,409 | updateDetails      |
| Prix              | O/price         | PATCH   | OWNER actif | amount,currencyCode | OfferResponse                   | 400,403,404,409 | changePrice        |
| Politique         | O/access-policy | PATCH   | OWNER actif | politique complète  | OfferResponse                   | 400,403,404,409 | changeAccessPolicy |
| Ordre             | O/display-order | PATCH   | OWNER actif | displayOrder        | OfferResponse                   | 400,403,404,409 | changeDisplayOrder |
| Publier           | O/publication   | POST    | OWNER actif | —                   | OfferResponse                   | 400,403,404,409 | publish            |
| Suspendre         | O/suspension    | POST    | OWNER actif | —                   | OfferResponse                   | 403,404,409     | suspend            |
| Réactiver         | O/suspension    | DELETE  | OWNER actif | —                   | OfferResponse                   | 400,403,404,409 | resume             |
| Archiver          | O/archival      | POST    | OWNER actif | —                   | OfferResponse                   | 403,404,409     | archive            |

Toutes les réponses non-création sont 200. ProblemDetail : offer-not-found404, offer-access-denied403, invalid-offer-data400, offer-transition-forbidden409, validation400 et concurrence409 globale. Auth401 et erreurs transitoires restent gérées par le socle. Pas de protocole Idempotency-Key.

## Valeurs et règles

- Nom 2..100, description facultative ≤500. Nom non unique. Description PATCH null/omise inchangée, chaîne vide efface.
- Prix JSON numérique BigDecimal positif, jusqu’à 999999999999999.9999, 15 chiffres entiers/4 fractionnaires. Devise ISO reconnue par java.util.Currency, précision propre à la devise (0..4), arrondi interdit. Doit correspondre à la devise actuelle de l’organisation. Devise affichée en lecture seule, aucun taux de change.
- validitySeconds : secondes, 1..31536000. Durée d’accès après activation, distincte d’une disponibilité commerciale. Aucun calendrier, activationMode, nombre d’appareils, expiration absolue ou stratégie première utilisation exposé.
- dataAllowanceBytes : octets ; downloadLimitBps/uploadLimitBps : bits/s. Chacun null=illimité, sinon entier positif long ≤9223372036854775807. Zéro n’est pas illimité. Unités SI explicites, conversions exactes BigInt.
- maxConcurrentSessions : 1..32 sessions simultanées, pas appareils. displayOrder : 0..2147483647.
- Pagination serveur page/size (20 par défaut), tri stable displayOrder/createdAt/id. Aucun filtre texte/statut, tri configurable, liste globale organisation, duplication ou historique public.
- DRAFT → PUBLISHED → SUSPENDED → PUBLISHED ; archivage depuis tous les états, terminal. Commandes répétées vers le même état sans effet. Édition autorisée hors ARCHIVED, même publiée/suspendue.
- Création/édition/publication/reprise exigent organisation et site actifs. Lecture/suspension/archivage autorisés par le backend avec parents suspendus ; guard frontend organisation existant plus restrictif conservé.
- Organisation et site du GET global vérifiés avant affichage/cache et revalidés avant toute mutation. Réponse incohérente rejetée.
- Version optimiste interne, non exposée, sans ETag/If-Match : impossible de garantir l’absence d’écrasement d’un formulaire ancien. Relecture préalable et avertissement ne remplacent pas une précondition serveur.

## Purchase et access : limite confirmée

Le service Purchase capture le nom, prix, devise et durée au moment de l’achat. Aucun endpoint Offer ne modifie les achats existants. Attention : le code Purchase actuel divise validitySeconds par 60 avec troncature et ne persiste pas l’intégralité de la politique (quota/débits/sessions). Ne pas promettre un snapshot complet de cette politique ni corriger ces modules dans ce sprint. Aucun appel Purchase/Payment/Access/RADIUS depuis la feature.

## Décisions d’interface

Entrée organisation /offers pour sélectionner un site ; routes canoniques /sites/:siteId/offers et /new, /:offerId, /:offerId/settings. Pas de faux agrégat paginé. Formulaire unique par création ; quatre sauvegardes explicites par édition car quatre commandes distinctes, sans fausse atomicité. Confirmation des transitions avec résumé. Prix et long conservés comme chaînes exactes, codec JSON dédié uniquement aux offres ; formatage monétaire Intl.NumberFormat sans convertir le montant en flottant. Aucun nouveau composant/dépendance/test prévu. Thème global inchangé.
