# Sprint 3 — contexte multi-organisation

Les anciens blocages contractuels sont levés par le backend local actualisé. La [matrice des contrats vérifiés](contract-final.md) remplace le constat historique PARTIAL. Le verdict final et les commandes sont consignés dans [testing.md](testing.md).

## Fonctionnalités implémentées

- Restauration web cookie HttpOnly + CSRF, access token mémoire, principal serveur.
- Liste complète non paginée, distinction zéro/une/plusieurs organisations et erreur.
- Création idempotente et reprise après réponse perdue, actualisation et reconnexion.
- Confirmation du OWNER réel avant navigation ; aucune permission fabriquée.
- Vérification serveur du membership et des statuts pour chaque contexte tenant.
- Sidebar shadcn conservée, sélecteur actif, création supplémentaire et dashboard contextualisé.
- Revalidation au montage, au retour au premier plan et après une mutation ou un refus serveur (sans contrôle périodique).
- Cache isolé par organisation, requêtes annulées au changement, nettoyage au logout.
- Douze anciens cas de sidebar réactivés ; tests de statuts et parcours réel sans MSW.

L’architecture app/pages/features/shared, React Router Framework, TanStack Query, React Hook Form et Zod est conservée. Les pages agrègent les features sans appel HTTP direct. Le principal, la liste et l’accès validé restent dans TanStack Query ; le contexte React expose le membership validé sans copie locale.

## Documentation

[Contrats](organization-contract.md) · [session](session-restoration.md) · [onboarding](onboarding-flow.md) · [contexte](organization-context.md) · [routes](organization-routing.md) · [switch](organization-switching.md) · [cache](tenant-cache-isolation.md) · [memberships](membership-resolution.md) · [erreurs](error-handling.md) · [sécurité](security.md) · [tests](testing.md) · [fichiers](files.md).

Les décisions ADR-008 à ADR-011 sont mises à jour. Les anciens rapports Sprint 2 décrivent le transport JSON historique ; cette version utilise le transport web vérifié.

## Périmètre

Administration avancée des membres, invitations, rôles et paramètres détaillés reportés au Sprint 4. Aucun module métier Wi-Fi ajouté. Aucun code backend modifié, aucun commit ou déploiement. Une instance backend temporaire avec origine CORS explicite a été utilisée puis arrêtée ; le serveur existant est conservé.
