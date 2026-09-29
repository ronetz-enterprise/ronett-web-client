# Contrat organisation final

Voir le [tableau besoin/endpoint/méthode/requête/réponse/erreurs/preuve](contract-final.md).

La source actualisée est platform/docs/backend/frontend-prerequisites. Les contrôleurs WebAuthenticationController, CurrentUserEndpointController, CurrentUserMembershipController et OwnedOrganizationController, ainsi que Sprint3BrowserIntegrationTest, ont été consultés avant l’intégration.

Le contrat de création reste name/currency → OrganizationView. L’en-tête Idempotency-Key UUID est maintenant pris en charge et systématiquement envoyé. La liste /api/me/memberships fournit une enveloppe items complète, sans pagination. GET /api/me/memberships/{organizationId} vérifie activement le contexte et retourne un membership enrichi.

Les refus 403 utilisent les codes stables du contrat. L’absence et une organisation étrangère restent indistinguables. Les noms et statuts d’appartenances inactives sont autorisés dans la liste propre au principal, mais ne donnent aucun accès.

Les contrôles serveur auparavant manquants ont été ajoutés. Ils ont été vérifiés par lecture, par 30 tests backend HTTP/PostgreSQL exécutés dans cette intervention et par un parcours Playwright sans MSW. L’ancien rapport d’absence d’API ne décrit plus le backend actuel.

Pas d’OpenAPI installé côté backend. Les documents manuels ont été confrontés aux DTO et aux tests. Aucun endpoint de polling, rôle supplémentaire ou API paginée n’est supposé.
