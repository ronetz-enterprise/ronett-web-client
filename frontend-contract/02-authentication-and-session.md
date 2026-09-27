# Authentification et session

## Séquence réelle

1. `POST /api/auth/register` crée identité et credential; 201 avec profil minimal et `Location`.
2. `POST /api/auth/login` reçoit email/password; 200 `{accessToken,refreshToken,tokenType,expiresIn}`.
3. Envoyer `Authorization: Bearer <accessToken>` aux routes protégées.
4. L'access token expire après 900 secondes. Session et refresh expirent après 7 jours.
5. `POST /api/auth/refresh` reçoit `{refreshToken}` et effectue une rotation; ancien token révoqué.
6. `POST /api/auth/logout` reçoit `{refreshToken}`, révoque le token et la session; 204.

| Question | Réponse observée |
|---|---|
| Access token | JWT dans JSON, jamais cookie |
| Refresh token | opaque aléatoire, hash SHA-256 en base, valeur dans JSON |
| Cookies | aucun |
| `credentials: include` | inutile actuellement |
| CSRF | désactivé; cohérent avec bearer sans cookie |
| Rotation refresh | oui, à chaque refresh |
| Réutilisation ancien refresh | 401/erreur d'authentification; aucune révocation familiale détectée |
| Session expirée | 401 ProblemDetail + `WWW-Authenticate: Bearer` |
| `/me` | absent |
| CORS | toutes origines/méthodes/headers, credentials=true |

**RECOMMANDATION :** conserver tokens en mémoire dans la première implémentation et demander une
décision produit avant persistance. Ne pas placer le refresh token dans `localStorage` par défaut.
Un BFF ou cookie HttpOnly impliquerait CSRF et une modification backend explicite.

**P0 :** `allowedOriginPatterns("*")` avec credentials est trop permissif pour la production.
Configurer une liste d'origines par environnement.

