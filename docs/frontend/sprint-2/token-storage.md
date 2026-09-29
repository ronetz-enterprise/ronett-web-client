# Stockage des tokens

Access et refresh sont des chaînes JSON, conservées uniquement dans la fermeture privée du gestionnaire de session. Aucun stockage localStorage/sessionStorage/IndexedDB, cookie créé par JavaScript, cache Query, historique de navigation ou URL. Les variables RHF contiennent temporairement le mot de passe nécessaire à la soumission ; il est effacé après succès ou échec serveur et n’entre pas dans un mutation cache.

Le provider est créé par arbre React ; il n’existe pas de store serveur global. Le HTML SSR et les snapshots React ne transportent aucun token. Les payloads de tokens sont validés par Zod sans rendre ni journaliser les détails de validation.

Conséquence acceptée pour ce sprint : une actualisation, fermeture d’onglet ou navigation externe détruit l’accès à la session mémoire. Le serveur peut conserver la session jusqu’à expiration. Une nouvelle connexion est nécessaire.

La restauration demandée reste **non livrée**. Pour la débloquer, définir un contrat cookie HttpOnly sécurisé (ou BFF dûment conçu) et un endpoint utilisateur courant, ou faire approuver une autre stratégie de persistance avec ses risques. Aucun de ces mécanismes n’est fabriqué dans ce sprint.

Le stockage mémoire réduit la persistance d’une fuite mais ne protège pas contre du JavaScript malveillant actif (XSS). HTTPS et une politique CSP de déploiement restent nécessaires. Voir ADR-006.
