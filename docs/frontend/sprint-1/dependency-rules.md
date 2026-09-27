# Règles de dépendance

- App compose les pages et les composants techniques partagés.
- Pages orchestre plusieurs features via leur index public et shared.
- Features dépend de shared; ne doit importer ni pages ni app ni les fichiers internes d'une autre feature.
- Shared et les primitives shadcn ne dépendent ni des pages ni des features.
- Pas de pages dans features, de services globaux ni de store contenant toutes les données serveur.

L'alias `@/*` désigne src; `@/app`, `@/pages`, `@/features`, `@/shared` en découlent.
L'ancien alias `~/*` est supprimé. Les imports internes d'une feature sont relatifs.
ESLint contrôle les imports interdits et les cycles via import-x.
Le contrôle d'architecture complémentaire vérifie les chemins résolus pour éviter les contournements
par imports relatifs. Les fichiers générés et les rapports backend ne sont pas modifiés par les outils.
