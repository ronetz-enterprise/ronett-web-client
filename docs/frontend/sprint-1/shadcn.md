# shadcn — emplacement et génération

Tout le code applicatif réside dans `src`. Le point d'entrée React Router reste
`src/app`, défini dans `react-router.config.ts`. Le dossier `app` racine et l'alias
`~/*` ont été supprimés.

## Configuration

`components.json` indique les destinations de la CLI :

| Alias      | Valeur              | Destination            |
| ---------- | ------------------- | ---------------------- |
| ui         | @/shared/ui         | src/shared/ui          |
| components | @/shared/components | src/shared/components  |
| hooks      | @/shared/hooks      | src/shared/hooks       |
| utils      | @/shared/utils/cn   | src/shared/utils/cn.ts |
| lib        | @/shared/utils      | src/shared/utils       |

`tsconfig.json` résout `@/*` vers `./src/*`. Vite et Vitest lisent ces alias via
`tsconfigPaths`. Les styles globaux restent dans `src/app/styles/app.css`.
Le style base-mira, Base UI, Hugeicons et les personnalisations existantes sont conservés.

## Vérifier avant un ajout

Depuis la racine du projet, utiliser la version déjà installée :

```sh
npx --no-install shadcn info --json
npx --no-install shadcn add badge --dry-run
```

La première commande expose `config.resolvedPaths` et reconnaît les onze primitives déplacées.
La seconde affiche les fichiers et dépendances envisagés sans les écrire.

Vérification effectuée après migration :

```text
shadcn add badge (dry run)
+ src/shared/ui/badge.tsx  create
```

Aucun composant badge n'a été installé pour ce contrôle.

## Ajouter un composant

Après inspection du dry-run :

```sh
npx --no-install shadcn add badge
```

Remplacer badge par le composant souhaité. Les primitives UI standard suivent l'alias ui.
Un `--path` explicite peut modifier la destination. Les blocs et registres personnalisés
peuvent aussi déclarer des fichiers avec des destinations spécifiques : vérifier leur liste
complète via `--dry-run` avant de les appliquer.

Après génération, vérifier les modifications puis exécuter les contrôles du projet :

```sh
npm run typecheck
npm run lint
npm run format:check
```

Les composants générés sont du code du projet : les pages et sections métier doivent conserver
les responsabilités app/pages/features/shared documentées.
