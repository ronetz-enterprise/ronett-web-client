# Cycle de session

Une instance par AuthProvider et arbre SSR. Les credentials privés ne sont pas rendus, sérialisés, placés dans Context ou TanStack Query. Context expose les opérations et un snapshot sans secrets : status, loginEmail et user:null.

```text
initializing -- montage, aucun token récupérable --> anonymous
anonymous   -- login réussi --------------------> authenticated
authenticated -- échéance / premier 401 --------> refreshing
refreshing  -- rotation réussie ----------------> authenticated
refreshing  -- refus / réponse invalide / réseau -> expired
authenticated/refreshing -- logout -------------> anonymous
expired     -- nouvelle connexion --------------> authenticated
expired     -- nettoyage explicite -------------> anonymous
rechargement -- nouvelle instance --------------> initializing
```

SSR et premier rendu client montrent un chargement neutre pour les guards. Aucun contenu protégé n’est rendu avant décision. L’initialisation n’effectue ni /me fictif ni refresh sans token.

L’expiration locale est calculée à partir de expiresIn ; un timer déclenche le refresh. Toute requête protégée vérifie aussi cette échéance, pour les onglets dont les timers ont été suspendus. Start/cleanup sont compatibles avec StrictMode et arrêtent le timer au démontage.

Chaque remplacement ou suppression de session incrémente une génération. Une réponse login, refresh ou lecture d’une ancienne génération est rejetée ; elle ne peut pas recréer la session ni repeupler le cache. Les contrôleurs des requêtes protégées sont annulés lors du nettoyage.

Logout retire immédiatement les credentials et annule/vide les caches. Il appelle ensuite le serveur avec le refresh capturé, même en cas de rotation en cours. Le backend observé révoque aussi la session retrouvée via un ancien refresh. Une réponse tardive de rotation est ignorée. Un logout concurrent partage la même promesse ; une nouvelle connexion est refusée tant que ce logout reste en cours.

Résultats distincts : revoked (204), unconfirmed (réseau/erreur : nettoyage local seulement), no-session (aucun refresh local). Une expiration ne prouve pas une révocation serveur. L’interface affiche cette différence après logout.

Les sessions des onglets sont indépendantes. Aucun partage de token, BroadcastChannel ou synchronisation de stockage n’est introduit.
