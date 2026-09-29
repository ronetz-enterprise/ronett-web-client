# Contrat d’authentification observé

Sources : documents pertinents de `frontend-contract/` (README, synthèse, acteurs, auth/session, DTO, erreurs, parcours, gaps, exemples HTTP, prompt auth) et documentation/ADR du Sprint 1. La compilation et le typecheck du socle ont été validés avant modification. React Router reste en mode Framework SSR, appDirectory `src/app`.

| Méthode et endpoint     | Requête JSON                         | Succès                                                                                  |
| ----------------------- | ------------------------------------ | --------------------------------------------------------------------------------------- |
| POST /api/auth/register | email, firstName, lastName, password | 201 ; userId (UUID), email, firstName, lastName, status ; Location /api/identities/{id} |
| POST /api/auth/login    | email, password                      | 200 ; accessToken, refreshToken, tokenType: Bearer, expiresIn                           |
| POST /api/auth/refresh  | refreshToken                         | 200 ; mêmes champs, tokens renouvelés                                                   |
| POST /api/auth/logout   | refreshToken                         | 204 sans corps                                                                          |

Les DTO LoginRequest acceptent aussi userAgent/ipAddress, mais le contrôleur les obtient depuis la requête HTTP. Le frontend ne les envoie pas.

Email : normalisation trim/minuscules selon EmailAddress. Prénom/nom non blancs, au plus 100 unités UTF-16. Mot de passe d’inscription : minimum 8 caractères, maximum 72 unités UTF-16 **et** 72 octets UTF-8 (BCrypt). Il n’est ni tronqué ni normalisé. Confirmation locale seulement ; aucune condition d’utilisation ajoutée au DTO.

Access token JWT dans JSON : 900 secondes. Refresh aléatoire dans JSON, hashé côté serveur : 7 jours. Session serveur : 7 jours ; rotation du refresh ne prolonge pas la date finale de la session. La réutilisation d’un refresh révoqué retourne 401. Aucun contrat de révocation de toute une famille après réutilisation n’est supposé.

Aucun cookie, nom de cookie, SameSite ou token CSRF. Credentials omit. Authorization Bearer seulement sur les ressources protégées, pas sur les quatre opérations publiques d’authentification. Logout révoque le token et sa session ; un token inconnu donne aussi 204. Un ancien token rotaté permet encore au service de retrouver et révoquer sa session.

Erreurs : 400 validation/invalid-registration, 409 email-already-used, 401 invalid-credentials (connexion et refresh), 403 account-inactive défini par le handler mais le login masque actuellement l’inactivité derrière invalid-credentials. Autres 403, 429, réseau et 5xx sont traités sans interpréter detail. Format ProblemDetail avec correlationId et éventuellement errors[{field,message}].

**Absent :** endpoint HTTP d’utilisateur courant, restauration par cookie, memberships et permissions plateforme. Les méthodes Java internes findAuthenticatedUser/logoutAllSessions ne sont pas des endpoints. GET /api/identities/{id} n’est pas utilisé pour simuler /me : l’identifiant n’est pas fourni par login et l’autorisation de cette route est insuffisamment établie.

## Consultation backend ponctuelle

Racine consultée : `/home/ubuntu/Desktop/Projects/Ronet/platform/src/main/java/com/ronetz/platform/`. Lecture seule, sans nouvel audit global. Motifs : contraintes DTO omises dans les rapports, normalisation, réponse d’inscription, erreurs et courses de rotation/logout.

- authentication/presentation/rest/AuthenticationController.java : quatre routes, DTO registration et sources userAgent/IP ; absence de /me.
- authentication/presentation/rest/AuthenticationExceptionHandler.java : types ProblemDetail et statuts.
- authentication/presentation/rest/dto/AuthenticationResponse.java : forme des tokens.
- authentication/presentation/rest/dto/LoginRequest.java : email/password et champs optionnels non envoyés.
- authentication/presentation/rest/dto/RegisterRequest.java : tailles et limite BCrypt UTF-8.
- authentication/presentation/rest/dto/RefreshTokenRequest.java et LogoutRequest.java : refreshToken non blanc.
- authentication/application/AuthenticationApplicationService.java : création, login générique, rotation, session 7 jours et logout via ancien token.
- identity/domain/EmailAddress.java : regex et normalisation.
- identity/presentation/rest/UserIdentityExceptionHandler.java : 409 email-already-used.
- authentication/infrastructure/security/SecurityConfiguration.java : Bearer stateless, CSRF désactivé, quatre POST publics, CORS wildcard avec credentials et pas d’exposedHeaders pour correlationId.
