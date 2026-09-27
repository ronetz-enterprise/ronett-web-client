# ADR-004 — Les pages restent hors des features

Statut : accepté.
Une page représente une route et un point de composition, une feature une capacité métier.
SiteDetailsPage peut agréger sites, routers, offers, access et accounting sans donner
à l'une de ces features la responsabilité des autres.

Les pages résident dans src/pages et consomment les index publics des features.
Les features ne dépendent jamais des pages : cela inverserait la direction de dépendance,
limiterait la réutilisation et favoriserait les cycles.

Les sections propres à un écran restent près de sa page (pages/sites/site-details/sections).
Les composants métier réutilisables vivent dans features/<capacité>/components;
les composants techniques génériques dans shared, les primitives shadcn dans shared/ui.
Aucun dossier widgets/entities ni features/*/pages.
Conséquence : la page orchestre; appels HTTP, schémas et règles profondes restent dans les features.
