# ADR-001 — Conserver Framework Mode avec SSR

Statut : accepté.
React Router 8.4 était déjà configuré avec le plugin Vite, routes.ts et SSR.
Nous conservons ce mode, le découpage automatique et les boundaries du framework.
appDirectory passe à src/app pour aligner l'architecture; les modules de pages sont référencés
dans src/pages. Aucun second RouterProvider/BrowserRouter.
Conséquence : npm run typecheck doit générer les types; le déploiement SSR existant est conservé.
