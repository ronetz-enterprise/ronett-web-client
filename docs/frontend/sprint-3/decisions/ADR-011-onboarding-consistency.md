# ADR-011 — Création synchrone récupérable

Décision mise à jour : le backend commit organisation, OWNER et snapshot idempotent dans une transaction. Le frontend envoie un UUID par intention, persiste uniquement clé/formulaire par userId et rejoue strictement la même intention après résultat inconnu. Pas de polling.

Le reçu 201 est suivi d’un contrôle réel du membership OWNER, d’une invalidation de liste puis d’une navigation. L’intention n’est nettoyée qu’après changement d’URL. Les conflits et clés expirées ne sont pas recyclés automatiquement.
