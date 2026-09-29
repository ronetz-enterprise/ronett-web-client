# ADR-007 — Refresh partagé et reprise bornée

Statut : adopté.

Contexte : rotation serveur du refresh ; cinq 401 concurrents ne doivent pas consommer cinq fois le même token.

Décision : une promesse rotation partagée par session, identifiant de génération et comparaison de la révision utilisée lors de l’envoi (indépendante de la valeur du JWT). Une lecture GET/HEAD peut être rejouée une fois. Aucune mutation n’est rejouée. Auth/login/register/refresh/logout utilisent l’API brute.

Échéance locale ou 401 déclenche la coordination. Refus définitif, erreur réseau ou payload invalide coupe la session locale ; aucun retry ambigu d’un refresh potentiellement consommé. Un second 401 n’engendre pas une nouvelle rotation.

Logout coupe l’accès immédiatement et révoque la session avec le token capturé. Les réponses de générations précédentes sont ignorées même si AbortSignal n’a pas interrompu leur transport. Le backend consulté retrouve la session via un refresh déjà rotaté ; cette propriété fait partie du contrat à préserver.

Conséquences : la sécurité privilégie une reconnexion après panne plutôt qu’une boucle de retry. Les erreurs des mutations restent visibles et ne sont jamais transformées en succès présumé.
