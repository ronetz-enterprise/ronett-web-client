# Restauration de session

Au montage navigateur, AuthProvider reste initializing pendant GET /api/auth/web/csrf puis POST /api/auth/web/refresh. Les deux appels utilisent credentials include ; la mutation porte X-XSRF-TOKEN, sans bearer ni body refresh. Le cookie ronetz_refresh est HttpOnly, SameSite Strict, Path /api/auth/web, Secure par défaut. Secure=false a été utilisé uniquement pour la qualification HTTP locale.

Le DTO web expose accessToken, tokenType Bearer et expiresIn. Aucun refresh token n’est accessible au JavaScript applicatif. L’access token et le jeton CSRF ne sont pas persistés. Le profil est chargé par /api/me dans Query avant les pages authentifiées.

Un 401 de restauration signifie session absente ou non restaurable : connexion. Le contrat ne permet pas de distinguer absence et révocation à ce stade. Un 401 lors d’une rotation en cours d’utilisation termine la session. Une erreur réseau/serveur produit unavailable avec reprise explicite, jamais une fausse identité anonyme définitive.

Le refresh est coordonné par promesse dans chaque session. Web Locks sérialise les opérations cookie entre onglets lorsque disponible ; le fallback garde la coordination du provider. Un GET peut être rejoué une fois après 401, jamais une mutation. Aucun refresh sur 403.

Le logout coupe immédiatement l’accès local, annule les requêtes et vide Query. Il attend les opérations cookie déjà engagées (login/restauration/rotation) avant de révoquer le cookie courant, pour qu’une réponse tardive ne rétablisse pas une session. Le résultat de révocation non confirmé reste annoncé.

Le rendu SSR est neutre et n’essaie pas de lire le cookie API depuis le serveur frontend. Après restauration, /me, la liste et le contexte de l’URL sont chargés/revalidés.
