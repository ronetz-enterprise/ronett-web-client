# Coordination du refresh

Le gestionnaire possède une seule promesse rotation. Une échéance ou un 401 la crée ; les autres appels attendent la même promesse. L’API brute du refresh ne passe jamais par la reprise authentifiée.

Chaque lecture mémorise la révision de session utilisée lors de l’envoi. La révision augmente à chaque réception de tokens, même si le serveur retourne une chaîne d’access token identique. Si son 401 arrive après une rotation réussie, elle utilise le nouveau token sans déclencher une seconde rotation. Si une rotation est encore en cours, elle l’attend.

```text
5 lectures -> 5 réponses 401 -> 1 POST refresh partagé
                            -> 5 lectures reprises, au plus une fois
```

Rejeu automatique uniquement GET/HEAD. POST/PUT/PATCH/DELETE peuvent attendre un renouvellement de session après 401, mais retournent l’erreur initiale sans rejouer la mutation. Avant envoi, une échéance déjà connue peut être renouvelée sans risque de double exécution.

Un second 401 à la reprise termine la session. Aucun retry du refresh. Un refus 401/403, payload invalide ou échec réseau retire l’accès local. Après panne réseau, le résultat de la rotation serveur est inconnu ; réutiliser automatiquement l’ancien refresh serait dangereux.

Le signal d’annulation du consommateur annule sa requête mais pas le refresh partagé des autres consommateurs. Logout annule toutes les requêtes et invalide leur génération, même si un transport ignore AbortSignal.

Le wrapper refuse les endpoints d’authentification et les chemins ambigus. Dans ce sprint, il accepte uniquement les chemins /api/ sans query/hash/encodage ni segments relatifs ; ajouter un mécanisme explicite de paramètres validés lors d’un futur besoin métier.

Le client HTTP bas niveau conserve fetch, timeout, JSON, ProblemDetail et correlationId. Il n’importe ni auth, ni Router, ni notifications. Les ressources futures doivent utiliser useAuth().request et transmettre le signal TanStack Query ; retry de mutation reste désactivé. Aucun token ne doit être mis dans les query keys.
