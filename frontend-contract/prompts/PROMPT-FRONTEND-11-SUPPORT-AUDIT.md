# Phase 11 — SUPPORT-AUDIT

## Objectif

Construire support owner/public et audit.

**Acteur :** Visiteur/OWNER.

## Endpoints autorisés et contrats

Support public et organisation; audit list/detail/export. Token ticket distinct du JWT.

Succès et erreurs doivent suivre l'inventaire vérifié. Toute ambiguïté devient un blocage documenté, jamais un endpoint supposé.

## Pages et état

tickets/messages, filtres audit, export. Prévoir loading, vide, succès, erreur récupérable, interdit et session expirée selon le parcours.

## Tests attendus

rate limit, isolation, token ticket, contenu interne invisible; tests de composants, client mocké et au moins un parcours de la phase. Vérifier absence de secret dans logs, snapshots et stockage persistant.

## Règles obligatoires

- Stack frontend absente/non confirmée : inspecter le dépôt frontend avant choix; sinon demander confirmation dans le rapport de démarrage.
- Utiliser uniquement les endpoints listés dans ce prompt et leurs DTO documentés dans `docs/frontend-contract`.
- Ne jamais inventer un endpoint, accéder à la base, appeler un webhook/callback interne depuis le navigateur, exposer un secret, ni modifier le backend sans rapport de blocage préalable.
- Ne pas anticiper les phases suivantes. Envoyer `Authorization: Bearer` aux routes protégées; aucun cookie actuel et `credentials: include` inutile.
- Traiter les erreurs `application/problem+json`, conserver `correlationId`, afficher les erreurs par champ et masquer les détails techniques.
- UUID canonique; Instant ISO-8601; LocalDate `YYYY-MM-DD`; montants sans calcul flottant.

## Livrables et vérification

Code de la phase, types locaux, tests, fixtures sans secrets et note des blocages. Exécuter format, lint, typecheck, tests unitaires et build avec les commandes définies par le dépôt frontend. Signaler les commandes absentes.

## Hors périmètre

Phases suivantes, backend, base de données, webhooks, Node Agent, Actuator et administration système.
