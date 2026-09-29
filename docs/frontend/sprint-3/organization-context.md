# Source du contexte

L’URL identifie l’organisation demandée. Elle n’accorde aucun accès. Query conserve le principal (/api/me), les memberships (/api/me/memberships) et le résultat de vérification par organisation.

OrganizationRoute attend la liste puis GET /api/me/memberships/{id}. Le DTO est validé avec Zod, l’identifiant doit correspondre à la route, le membership et l’organisation doivent être ACTIVE, et ORGANIZATION_READ doit être présent.

OrganizationContext expose cet item validé directement. La sidebar, le rôle et le dashboard utilisent cette même valeur. Le contexte provisoire du Sprint 1 est supprimé. Aucun tenant par défaut ou préférence localStorage n’accorde de droits.

Le changement d’identifiant remonte le guard avec une nouvelle clé et un état de chargement neutre. La revalidation bloque l’Outlet pendant la vérification d’accès ; aucune ancienne donnée n’est présentée comme autorisée dans le nouveau contexte.
