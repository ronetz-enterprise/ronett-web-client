# Audit initial et contrats — Sprint 4

Le Sprint 3 fournit la restauration cookie/CSRF, le principal et les memberships dans Query, le guard serveur, le contexte validé et la sidebar existante. Son rapport est [ici](../sprint-3/testing.md). Ces mécanismes sont conservés.

components.json utilise base-mira, Base UI, Hugeicons et @/shared/ui. Button, Input, Select, DropdownMenu, Skeleton, Sheet, Tooltip et les composants de layout sont déjà installés. La Table simple officielle suffit à une liste serveur non paginée ; TanStack Table n’est pas nécessaire. Aucun thème ne sera modifié.

Empreinte SHA-256 initiale de src/app/styles/app.css : e39c61d7de829052178c7eaa1b0c61a5ee5f5daba335a66189956617428f7d68.

## Matrice vérifiée avant implémentation

| Cas d’utilisation                        | Endpoint réel                                                         | Méthode | Permission                                                    | Requête                        | Réponse                       | Erreurs                            | Preuve                                                             |
| ---------------------------------------- | --------------------------------------------------------------------- | ------- | ------------------------------------------------------------- | ------------------------------ | ----------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| Lire l’organisation                      | /api/organizations/{organizationId}                                   | GET     | ORGANIZATION_READ                                             | bearer + UUID                  | OrganizationView              | 401/403/404                        | OrganizationController                                             |
| Lire les membres                         | /api/organizations/{organizationId}/memberships                       | GET     | MEMBERSHIP_READ                                               | bearer + UUID                  | MembershipView[] complet      | 401/403                            | MembershipController.listByOrganization                            |
| Lire une appartenance                    | /api/organizations/{organizationId}/memberships/{userId}              | GET     | MEMBERSHIP_READ                                               | userId cible, pas membershipId | MembershipView                | 401/403/404                        | MembershipController.findByUser                                    |
| Ajouter un utilisateur existant          | /api/organizations/{organizationId}/memberships                       | POST    | MEMBERSHIP_MANAGE                                             | userId UUID, role OWNER        | 201 MembershipView + Location | 400/401/403/409 selon rejet réel   | MembershipController.create                                        |
| Suspendre                                | /api/organizations/{organizationId}/memberships/{userId}/suspension   | PATCH   | MEMBERSHIP_MANAGE                                             | sans body                      | 204                           | 400/401/403/404/409                | MembershipController, Membership.suspend                           |
| Réactiver                                | /api/organizations/{organizationId}/memberships/{userId}/reactivation | PATCH   | MEMBERSHIP_MANAGE                                             | sans body                      | 204                           | 400/401/403/404/409                | MembershipController, Membership.reactivate                        |
| Révoquer / retirer son propre accès      | /api/organizations/{organizationId}/memberships/{userId}              | DELETE  | MEMBERSHIP_MANAGE                                             | sans body                      | 204                           | 400 dernier OWNER, 401/403/404/409 | MembershipApplicationService.revoke                                |
| Modifier nom/devise                      | Aucun endpoint exposé                                                 | —       | ORGANIZATION_UPDATE existe mais ne suffit pas à créer une API | —                              | —                             | Bloqué                             | OrganizationController ne possède que des GET ; rename est interne |
| Changer de rôle                          | Aucun endpoint exposé                                                 | —       | —                                                             | —                              | —                             | Bloqué                             | Seul OWNER est défini ; aucun mapping de modification              |
| Inviter/lister/renvoyer/annuler/accepter | Aucun contrat d’invitation trouvé                                     | —       | —                                                             | —                              | —                             | Bloqué                             | Recherche ciblée membership/organization/identity/notification     |
| Revalider le contexte                    | /api/me/memberships/{organizationId} et /api/me/memberships           | GET     | principal courant                                             | bearer                         | contrats Sprint 3             | codes stables 403                  | CurrentUserMembershipController                                    |

MembershipView : id,userId,organizationId,role,status,createdAt,updatedAt. Aucun nom/email/avatar n’est exposé. Pas de pagination, recherche ou tri serveur ; les filtres locaux porteront explicitement sur la liste complète et les UUID disponibles. Aucun lookup d’une identité étrangère ne sera ajouté.

## Règles OWNER et écarts

- ACTIVE → SUSPENDED → ACTIVE ; REVOKED est terminal.
- Révoquer un membership déjà révoqué est idempotent côté serveur.
- Le service interdit une révocation OWNER si countActiveOwners <= 1, y compris une cible déjà suspendue ; l’interface respecte cette règle observée.
- Le service de suspension ne protège pas explicitement le dernier OWNER. L’interface désactivera cette action manifestement dangereuse ; cela ne corrige pas les appels directs serveur.
- Le comptage OWNER n’est pas une garantie frontend de concurrence entre plusieurs administrateurs. Le backend demeure responsable de cette invariant.
- Les transitions interdites peuvent être enveloppées dans IllegalArgumentException → 400 INVALID_MEMBERSHIP_DATA ; ne pas supposer toujours 409.

Sources : nouveaux contrats backend frontend-prerequisites, inventaire frontend-contract/03, contrôleurs Organization/Membership, MembershipView, MembershipExceptionHandler, domaine Membership et tests MembershipApplicationServiceTest. OpenAPI absent dans le dépôt.

Documentation officielle consultée : [Table Base UI](https://ui.shadcn.com/docs/components/base/table), [Alert Dialog Base UI](https://ui.shadcn.com/docs/components/base/alert-dialog), [CLI shadcn](https://ui.shadcn.com/docs/cli).
