# Architecture

```text
src/
  app/           root, entrée client, routes, layouts, providers, styles
  pages/         auth, onboarding, dashboard, organization, public, platform-admin
  features/      technical-preview (outil local seulement)
  shared/        api, auth, components, config, errors, hooks, testing, ui, utils
```

L'architecture suit app → pages → features → shared. Tout le code applicatif est dans src.
Les primitives shadcn sont dans src/shared/ui, leurs hooks dans src/shared/hooks
et l'utilitaire cn dans src/shared/utils/cn.ts. L'alias unique @/* pointe vers src/*.
Les composants NavProjects/NavUser sont préservés dans src/app/layouts/sidebar sans être montés.
L'écran starter Welcome inutilisé et ses deux logos ont été supprimés.
Le dossier app à la racine n'existe plus. Voir [configuration shadcn](shadcn.md).

AppProviders crée un QueryClient par arbre React (donc par requête SSR), fournit le thème système,
les notifications Base UI déjà installé, TooltipProvider et ErrorBoundary.
Le routeur Framework fournit lui-même son provider : pas de BrowserRouter concurrent.
Aucun provider métier global, store serveur global ou cache persistant.

Les fonctionnalités métier n'existent pas encore. La seule feature sert à vérifier le socle
dans un environnement local avec mocks. Les tests sont colocalisés; les scénarios navigateur
sont dans tests.
