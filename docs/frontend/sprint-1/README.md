# Sprint 1 — Socle frontend Ronet

Le socle fournit des écrans structurels, pas une application métier authentifiée.
Les rapports contractuels sont dans [frontend-contract](../../../frontend-contract/README.md).
Aucun code backend n'a été consulté ou modifié.

## Installation et exécution

Node 24 et npm, avec `package-lock.json` existant.

```sh
npm ci
npm run dev
```

Le layout initial était `app/routes/dashboard.tsx` (non raccordé au routeur).
Il est intégré dans `src/app/layouts/app-layout.tsx`. Les primitives shadcn sont maintenant dans
`src/shared/ui`. Voir [configuration et vérification shadcn](shadcn.md).

## Configuration

`.env.example` décrit les variables publiques. `.env.development` et `.env.test` sont fournis.
Pour un build de production, définir explicitement :

```sh
VITE_API_BASE_URL=https://api.example.test VITE_APP_ENV=production VITE_ENABLE_MOCKS=false npm run build
npm run start
```

Ne jamais fournir de secret via VITE. Voir [configuration](environment-configuration.md).

## MSW

```sh
VITE_ENABLE_MOCKS=true npm run dev
```

Ouvrir `/__dev/socle` : erreur simulée, copie de référence, validation et confirmation.
Les chemins `/__mocks/*` sont exclusivement des fixtures techniques interceptées par MSW :
ils ne constituent pas des endpoints backend. Mocks désactivés par défaut en développement,
automatiques sous Vitest, interdits dans les environnements staging/production.
La route technique est exclue du build de production.
`npx msw init public --save` régénère le worker.

## Vérification

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npx playwright install --with-deps
npm run test:e2e
```

Playwright démarre son propre serveur local avec MSW, sans backend ni authentification.
Chromium, Firefox et WebKit sont conservés. Ne pas utiliser un serveur déjà démarré sur 4173.
Voir [testing](testing.md), [rapport](report.md) et [inventaire](files.md).

## Parcours structurels

- `/` : accueil.
- `/auth`, `/auth/login`, `/auth/register` : emplacements de formulaires futurs.
- `/onboarding` : placeholder.
- `/public` : portail public.
- `/app/00000000-0000-4000-8000-000000000001` et `/organization` sous ce chemin :
  deux écrans pour vérifier le shell.
- `/platform-admin` : contexte plateforme distinct.
- `/forbidden` et toute URL inconnue : erreurs génériques.

Ces UUID sont des identifiants de démonstration, pas des organisations autorisées.
Le paramètre de route n'est jamais une preuve d'autorisation.
