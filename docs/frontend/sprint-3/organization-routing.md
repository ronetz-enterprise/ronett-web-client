# Routes

| Route                                 | Comportement                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| /auth/login, /auth/register           | Publiques après restauration ; session déjà valide → destination sûre ou sélection |
| /account                              | Principal chargé, session et logout                                                |
| /app, /organizations/select           | Zéro → création ; une accessible → contexte vérifié ; plusieurs → choix            |
| /onboarding, /onboarding/organization | Formulaire ou reprise d’intention en cours                                         |
| /onboarding/status                    | Rejeu sûr et confirmation du OWNER serveur                                         |
| /app/:organizationId                  | Guard actif puis layout existant et dashboard                                      |
| /app/:organizationId/organization     | Informations du contexte validé                                                    |
| /platform-admin                       | Hors périmètre, accès interdit ; platformAdmin n’est pas un bypass tenant          |

Les helpers organizationRoutes centralisent les UUID validés. safeAuthDestination conserve uniquement les routes internes autorisées ; aucun token ou paramètre arbitraire n’est repris. Un UUID mal formé ne déclenche aucune lecture tenant.

Le chargement de session/principal précède le guard tenant. Erreur de liste, accès refusé et absence réelle sont des états distincts, sans boucle d’onboarding.
