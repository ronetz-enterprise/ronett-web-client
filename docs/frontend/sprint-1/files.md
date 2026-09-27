# Inventaire des fichiers du sprint

Les fichiers déjà modifiés/non suivis à l’arrivée ont été conservés ou adaptés dans le périmètre autorisé. frontend-contract reste inchangé.

## Déplacements / remplacements

- app/root.tsx → src/app/root.tsx
- app/routes.ts → src/app/routes.ts
- app/app.css → src/app/styles/app.css
- app/routes/home.tsx → src/pages/public/home-page.tsx
- app/routes/dashboard.tsx → src/app/layouts/app-layout.tsx (contenu → pages/dashboard)
- app/components/{app-sidebar,nav-main,team-switcher}.tsx → src/app/layouts/sidebar/

## Configuration et documentation ajoutées / adaptées

- .gitignore
- README.md
- package.json
- package-lock.json
- tsconfig.json
- react-router.config.ts
- components.json
- eslint.config.js
- .prettierrc.json
- .prettierignore
- .env.example
- .env.development
- .env.test
- .env.production
- vitest.config.ts
- playwright.config.ts
- .github/workflows/playwright.yml
- public/mockServiceWorker.js

## Sources et tests créés dans src

- src/app/entry.client.tsx
- src/app/layouts/app-layout.test.tsx
- src/app/layouts/app-layout.tsx
- src/app/layouts/auth-layout.tsx
- src/app/layouts/platform-admin-layout.tsx
- src/app/layouts/public-layout.tsx
- src/app/layouts/sidebar/app-sidebar.tsx
- src/app/layouts/sidebar/nav-main.tsx
- src/app/layouts/sidebar/team-switcher.tsx
- src/app/providers/app-providers.tsx
- src/app/providers/theme-provider.tsx
- src/app/root.tsx
- src/app/router/navigation.tsx
- src/app/routes.ts
- src/app/styles/app.css
- src/features/technical-preview/index.ts
- src/features/technical-preview/technical-preview.tsx
- src/pages/auth/login-page.tsx
- src/pages/auth/register-page.tsx
- src/pages/dashboard/dashboard-page.tsx
- src/pages/onboarding/onboarding-page.tsx
- src/pages/organization/organization-page.tsx
- src/pages/platform-admin/platform-admin-page.tsx
- src/pages/public/diagnostics-page.tsx
- src/pages/public/forbidden-page.tsx
- src/pages/public/home-page.tsx
- src/pages/public/not-found-content.tsx
- src/pages/public/not-found-page.tsx
- src/pages/public/portal-page.tsx
- src/pages/public/unexpected-error-page.tsx
- src/shared/api/http-client.test.ts
- src/shared/api/http-client.ts
- src/shared/api/query-client.test.ts
- src/shared/api/query-client.ts
- src/shared/auth/organization-context.ts
- src/shared/components/confirm-dialog.tsx
- src/shared/components/error-boundary.tsx
- src/shared/components/feedback.test.tsx
- src/shared/components/feedback.tsx
- src/shared/components/form.test.tsx
- src/shared/components/form.tsx
- src/shared/components/notifications.tsx
- src/shared/components/sensitive-value.tsx
- src/shared/config/environment.test.ts
- src/shared/config/environment.ts
- src/shared/errors/api-error.test.ts
- src/shared/errors/api-error.ts
- src/shared/hooks/use-hydrated.ts
- src/shared/testing/architecture.test.ts
- src/shared/testing/browser.ts
- src/shared/testing/handlers.ts
- src/shared/testing/server.ts
- src/shared/testing/setup.ts
- src/shared/utils/safe-redirect.test.ts
- src/shared/utils/safe-redirect.ts

## Tests navigateur

- tests/accessibility.spec.ts
- tests/example.spec.ts

## Documentation

- docs/frontend/sprint-1/README.md
- docs/frontend/sprint-1/api-client.md
- docs/frontend/sprint-1/architecture.md
- docs/frontend/sprint-1/decisions/ADR-001-router-mode.md
- docs/frontend/sprint-1/decisions/ADR-002-http-client.md
- docs/frontend/sprint-1/decisions/ADR-003-server-state.md
- docs/frontend/sprint-1/decisions/ADR-004-pages-outside-features.md
- docs/frontend/sprint-1/dependency-rules.md
- docs/frontend/sprint-1/environment-configuration.md
- docs/frontend/sprint-1/error-handling.md
- docs/frontend/sprint-1/existing-layout.md
- docs/frontend/sprint-1/pages-and-features.md
- docs/frontend/sprint-1/query-conventions.md
- docs/frontend/sprint-1/report.md
- docs/frontend/sprint-1/routing.md
- docs/frontend/sprint-1/security.md
- docs/frontend/sprint-1/testing.md
- docs/frontend/sprint-1/files.md

## Composants historiques

src/shared/ui/*.tsx, src/shared/hooks/use-mobile.ts et src/shared/utils/cn.ts : déplacés depuis app/, sans modification de comportement.
sidebar.tsx : fermeture mobile visible, libellés FR, aria-expanded et garde d’hydratation.
sheet.tsx : libellé de fermeture FR. nav-projects.tsx : label accessible pour le lien composé.
nav-user.tsx et nav-projects.tsx restent préservés dans src/app/layouts/sidebar, non montés. Le starter Welcome et ses deux logos sont supprimés.

## Unification du code dans src

- Suppression du dossier app racine et de l’alias ~/*.
- Mise à jour components.json, tsconfig.json, ESLint, imports et sources Tailwind.
- Ajout docs/frontend/sprint-1/shadcn.md.
- app/components/ui/separator.tsx → src/shared/ui/separator.tsx
- app/components/ui/button.tsx → src/shared/ui/button.tsx
- app/components/ui/dropdown-menu.tsx → src/shared/ui/dropdown-menu.tsx
- app/components/ui/tooltip.tsx → src/shared/ui/tooltip.tsx
- app/components/ui/skeleton.tsx → src/shared/ui/skeleton.tsx
- app/components/ui/breadcrumb.tsx → src/shared/ui/breadcrumb.tsx
- app/components/ui/sheet.tsx → src/shared/ui/sheet.tsx
- app/components/ui/input.tsx → src/shared/ui/input.tsx
- app/components/ui/avatar.tsx → src/shared/ui/avatar.tsx
- app/components/ui/sidebar.tsx → src/shared/ui/sidebar.tsx
- app/components/ui/collapsible.tsx → src/shared/ui/collapsible.tsx
- app/hooks/use-mobile.ts → src/shared/hooks/use-mobile.ts
- app/lib/utils.ts → src/shared/utils/cn.ts
- app/components/nav-user.tsx → src/app/layouts/sidebar/nav-user.tsx
- app/components/nav-projects.tsx → src/app/layouts/sidebar/nav-projects.tsx
