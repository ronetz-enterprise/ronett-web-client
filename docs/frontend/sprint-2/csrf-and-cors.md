# CSRF et CORS

Le backend utilise Authorization Bearer explicite et des tokens JSON, pas des cookies d’authentification. Le client conserve credentials: omit pour toutes les opérations. CSRF est désactivé côté backend ; aucun header CSRF n’est inventé.

La configuration consultée autorise allowedOriginPatterns ["_"], méthodes GET/POST/PUT/PATCH/DELETE/OPTIONS, headers ["_"] et allowCredentials true. Cette ouverture n’est pas une politique de production acceptable à valider ici. Définir les origines frontend exactes, les headers Authorization/Content-Type et exposer X-Correlation-Id si sa lecture côté navigateur est attendue. Le ProblemDetail peut déjà fournir correlationId dans le corps.

En local : VITE_API_BASE_URL pointe vers localhost:8080. Vérifier un preflight depuis l’origine réellement utilisée par Vite, puis les quatre endpoints sur le backend en exécution. En production : configurer l’URL HTTPS réelle ; localhost n’est qu’une valeur de configuration de socle, pas un déploiement.

MSW vérifie les DTO et credentials: omit, mais ne prouve **pas** la politique CORS réelle, la validation JWT serveur, TLS ou des cookies de production. Ces vérifications d’intégration réelle n’ont pas été exécutées. Une erreur CORS est exposée par fetch comme une erreur réseau, jamais comme des identifiants invalides.

Si un contrat cookie est ajouté : définir HttpOnly, Secure, SameSite, domaine/path, origines autorisées et protection CSRF de login/refresh/logout avant de modifier credentials. La stratégie actuelle ne peut pas être réutilisée telle quelle.
