# Sécurité et limites

## Vérifications implémentées

- Pas de console/log de mots de passe, payloads de tokens ou headers Authorization dans la feature.
- Aucun token persistant, dans les URLs, snapshots, données Router ou caches Query.
- Une instance de session et cache par arbre SSR ; aucune identité partagée entre requêtes serveur.
- Reprise unique et uniquement des lectures ; rotation partagée, endpoint refresh exclu.
- Génération de session vérifiée avant/après I/O ; anciennes réponses et requêtes annulées après logout.
- Annulation puis vidage des caches lors de login, logout et expiration.
- Aucun affichage de detail serveur ; messages génériques pour credentials invalides/inactifs.
- Liste fermée de destinations de retour ; aucun rôle ou membership déduit.
- Logout immédiat local avec statut explicite de révocation serveur.
- Formulaires accessibles, mots de passe effacés, confirmation non envoyée.

## Risques restants

La mémoire JavaScript reste accessible à un script XSS actif. Le backend n’offre aucun cookie HttpOnly pour refresh. Actualiser laisse potentiellement la session serveur active mais inaccessible localement, jusqu’à expiration. Un timeout du refresh/logout ne prouve pas une révocation. Le refresh en mémoire ne synchronise pas les onglets.

L’API expose un 409 d’email déjà utilisé ; l’UI générique ne supprime pas ce signal pour un client direct. Les erreurs de compte inactif restent génériques. Le rate limiting backend n’a pas été audité ou confirmé : 429 est présenté correctement, pas promis.

CORS wildcard + credentials et absence d’exposition X-Correlation-Id sont des gaps backend documentés. Aucune validation en environnement réel ni revue complète JWT/session/révocation n’est prétendue. L’access token déjà émis peut rester accepté jusqu’à son échéance selon le filtre serveur ; ce sprint ne promet pas une invalidation instantanée de tous les JWT.

## Critères ouverts et Sprint 3

1. Fournir un endpoint HTTP fiable d’identité courante, lié au principal authentifié.
2. Définir un mécanisme sécurisé de restauration après reload, avec politique CSRF/CORS/cookies si applicable.
3. Exposer les organisations accessibles et memberships ; implémenter l’autorisation côté serveur et le guard d’organisation.
4. Fournir la permission plateforme avant d’ouvrir son espace.
5. Valider l’API réelle, le déploiement HTTPS et les origines autorisées.

Création d’organisation, membership OWNER, sélection multi-organisation, récupération de mot de passe, OAuth, MFA et modules métier sont différés. Backend inchangé ; aucun commit ou déploiement.
