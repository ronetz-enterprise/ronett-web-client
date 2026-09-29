> Rapport historique : le transport web cookie/CSRF et le profil courant sont désormais intégrés au [Sprint 3](../sprint-3/README.md).

# Sprint 2 — Authentification et session

Verdict : **PARTIAL**. Les quatre opérations documentées sont intégrées au frontend, avec session mémoire, guards, refresh coordonné et logout serveur. Le contrat actuel ne permet pas de récupérer l’identité courante ni de restaurer la session après rechargement sans introduire une persistance des tokens. Ces critères d’acceptation restent ouverts ; le test de rechargement vérifie explicitement le retour à la connexion.

## Livrables

- [Contrat et consultations backend ciblées](authentication-contract.md)
- [Cycle de session](session-lifecycle.md)
- [Stockage](token-storage.md)
- [Coordination du refresh](refresh-coordination.md)
- [Routes](route-protection.md)
- [CSRF et CORS](csrf-and-cors.md)
- [Erreurs](error-handling.md)
- [Tests et commandes](testing.md)
- [Sécurité et prérequis](security.md)
- [ADR-005](decisions/ADR-005-session-source-of-truth.md), [ADR-006](decisions/ADR-006-token-storage.md), [ADR-007](decisions/ADR-007-refresh-coordination.md)

## Fichiers

[Inventaire complet des fichiers ajoutés et modifiés](files.md).

La feature `src/features/authentication/` contient API, schémas, formulaires, gestionnaire de session, provider, erreurs, choix de destination et tests. Son `index.ts` est l’entrée publique.

Les pages login et register sont remplacées ; session-expired et account sont ajoutées dans `src/pages/auth/`. Le placeholder onboarding est protégé et également accessible via `/onboarding/organization`. Les guards vivent dans `src/app/router/guards/`. AppProviders monte AuthProvider, AppSidebar réutilise SessionMenu. Aucun module métier ni sidebar supplémentaire.

Les modifications partagées sont limitées à l’export du type RequestOptions, aux attributs autocomplete/disabled du formulaire, à PasswordField, au contraste du bouton principal et aux fixtures MSW. Les tests historiques du layout et E2E sont adaptés à l’authentification. Aucun paquet ajouté.

Les modifications préexistantes de `vite.config.ts`, `docs/frontend/sprint-1/files.md` et `docs/frontend/sprint-1/shadcn.md` sont préservées.

## Limites et suite

L’email affiché provient de la saisie normalisée, pas d’un profil serveur. Aucun UUID utilisateur, statut de compte, rôle plateforme ou membership n’est inventé. Aucun appel à un faux `/me`, aucun décodage JWT employé comme autorité.

Le Sprint 3 nécessite un contrat fiable d’identité et de memberships, puis l’autorisation serveur par organisation. Les placeholders ne chargent aucune donnée métier. Définir aussi le mécanisme de restauration sécurisé et durcir CORS avant production. Aucun backend modifié, commit ou déploiement effectué.
