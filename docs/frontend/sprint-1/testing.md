# Tests

Vitest et Testing Library, environnement jsdom; MSW Node démarre avant les tests,
refuse les requêtes non prévues et réinitialise les handlers après chaque test.
Les tests sont colocalisés; mocks techniques seulement dans shared/testing.
Commandes : npm run test, npm run test:watch.

Couverture : configuration valide/invalide, ProblemDetail, field errors, correlation,
JSON/texte/204, HTML en erreur, JSON invalide, réseau, timeout, annulation,
400/401/403/404/409/422/429/500/502/503, bearer explicite, absence de cookies/tenant implicite,
absence de rejeu mutation, cache scindé et invalidation, erreurs UI et copie,
ErrorBoundary, SensitiveValue, confirmation, RHF validation/focus/double submit,
404 et sidebar/Outlet/mobile.

Playwright conserve Chromium, Firefox et WebKit. Le serveur de test démarre MSW avant
l'hydratation. Tests de démarrage, placeholders, contexte plateforme, auth/public/404,
sidebar desktop/mobile, 320 px, tablette 768 px, clavier, reduced motion, erreur simulée,
copie de corrélation, formulaire et dialogue. Presse-papiers réel Chromium; adaptateur
de test contrôlé pour les moteurs dont l'autorisation clipboard n'est pas exposée.
Aucune connexion simulée et aucun service externe requis.

La CI exécute npm ci → typecheck → lint → format check → tests → build → navigateurs → E2E.
Les rapports Playwright sont conservés sept jours en cas d'échec, sans captures de données métier.

Les tests automatisés ne remplacent pas une qualification manuelle lecteur d'écran/zoom,
ni les tests backend d'autorisation/CORS, ni l'intégration réseau réelle.
Voir report.md pour les commandes réellement exécutées et leurs résultats.

Contrôles axe navigateur ajoutés : WCAG 2 A/AA et 2.1 AA, thèmes clair/sombre, dialogue mobile, auth/public/confirmation. Vérification de restitution du focus après Escape et de reflow avec texte à 200 %.
