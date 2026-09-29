# ADR-006 — Tokens exclusivement en mémoire

Statut : adopté, restauration après rechargement non satisfaite.

Contexte : access et refresh retournés dans JSON ; aucun cookie, endpoint de restauration ou autorisation explicite de persistance.

Décision : conserver les credentials dans une fermeture privée par provider. Ne pas utiliser localStorage, sessionStorage, IndexedDB, cookie JavaScript, Query ou URL. Pas de token SSR sérialisé.

Conséquence : le navigateur perd sa session locale au reload. Ce comportement est visible dans l’interface et testé ; le sprint reste PARTIAL. Le backend peut conserver la session serveur jusqu’à expiration.

Alternative non retenue : persister un refresh token lisible par JavaScript pour remplir artificiellement le critère reload. Une évolution cookie HttpOnly ou BFF nécessite un contrat et une décision de sécurité distincts ; elle n’est pas implémentée implicitement.
