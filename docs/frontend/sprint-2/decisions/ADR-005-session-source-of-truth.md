# ADR-005 — Source de vérité de session

Statut : adopté pour le contrat actuel.

Contexte : React Router Framework SSR, TanStack Query existant, tokens JSON et aucun endpoint currentUser.

Décision : AuthProvider possède une instance privée createSession par arbre React. useSyncExternalStore expose un snapshot minimal sans credentials. Les formulaires appellent la feature directement ; aucune mutation Query ne capture les tokens ou mots de passe. Le cache Query ne duplique pas la session. Aucune authKeys.currentUser/sessions n’est ajoutée puisque ces endpoints n’existent pas.

Conséquences : isolation SSR et tests de concurrence possibles sans React. Login/logout/expiration annulent et vident tous les caches. Les pages gèrent la navigation ; le gestionnaire et le client HTTP n’importent pas Router. SessionMenu compose seulement l’action de logout et sa navigation.

L’utilisateur courant reste null et l’email saisi est identifié comme tel. Un futur /me demandera une évolution explicite et un choix unique de cache de profil. Redux/Zustand inutiles.
