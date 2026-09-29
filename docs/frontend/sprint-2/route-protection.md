# Protection des routes

| Route                                           | Comportement                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| /, /public, /forbidden                          | Publique                                                         |
| /auth, /auth/login, /auth/register              | PublicOnlyRoute ; session active vers destination sûre           |
| /auth/session-expired                           | Message neutre et lien de reconnexion ; session active redirigée |
| /onboarding, /onboarding/organization, /account | AuthenticatedRoute, AuthLayout existant                          |
| /app/:organizationId et /organization           | AuthenticatedRoute, sidebar existante et UUID validé             |
| /platform-admin                                 | Authentification puis refus d’accès ; aucune permission inventée |
| /__dev/socle                                    | Diagnostic de développement uniquement                           |

Initializing : loader neutre. Anonymous : login + returnTo. Expired : session-expired + returnTo. Authenticated/refreshing : Outlet. Le retour plateforme n’est pas autorisé par la décision post-login ; le fallback est onboarding/organization.

safeAuthDestination utilise une liste fermée des placeholders existants : account, onboarding, onboarding/organization, app/{UUID} et app/{UUID}/organization. URL externe, //, backslash, caractères blancs, %, query, fragment, segment relatif, route auth ou admin sont rejetés. Les paramètres et fragments ne sont pas conservés puisqu’aucun placeholder ne les utilise. Le fallback ne prétend pas qu’un compte possède ou ne possède pas une organisation.

Un UUID valide n’est pas une autorisation d’organisation. Aucune donnée tenant réelle n’est chargée dans ces placeholders. OrganizationRoute et memberships attendent le Sprint 3 ; l’API doit toujours faire l’autorisation serveur.

Ces guards contrôlent l’affichage client ; ils ne sécurisent pas de loader serveur contenant des données privées. Aucun loader de ce sprint ne charge de données privées. Toute future route SSR sensible nécessitera une authentification serveur conforme au contrat.

L’identité courante manque : /account affiche uniquement l’email de connexion avec une explication explicite. Aucun rôle plateforme ni userId n’est décodé ou déduit.
