# Données serveur et isolation

QueryClient : staleTime 30 s, gcTime 5 min, pas de refetch au focus.
Deux retries maximum, uniquement réseau, timeout, HTTP 500/502/503/504;
backoff 1 s, 2 s, plafond 8 s. Jamais de retry automatique des autres 4xx, d'une annulation
ou d'une mutation. Mutations : retry false, gcTime 0.
Les opérations non idempotentes restent hors des queries.

Le client est instancié par AppProviders, jamais partagé entre requêtes SSR.
Aucun cache persistant ni credential en clair dans les queries. Les futurs secrets éphémères
seront traités dans un état local puis détruits à la sortie du parcours.

Les factories futures de chaque feature pourront utiliser :

```ts
organizationKeys.detail(id); // ["organization", id, "detail"]
siteKeys.list(id, filters); // tenantKeys.resource(id, "sites", "list", filters)
routerKeys.detail(id, routerId); // tenantKeys.resource(id, "routers", "detail", routerId)
```

Seul tenantKeys est implémenté pendant ce sprint, pas les features métier.
À chaque changement de contexte/sortie, les queries de l'organisation précédente sont annulées
et supprimées. Les clés restent scindées même si des requêtes tardives se terminent.
L'Outlet est remonté avec une clé d'organisation pour éviter la réutilisation d'état local.
Aucun placeholderData provenant d'une autre organisation n'est autorisé.

L'organisation est aussi le namespace RADIUS : identité logique (organizationId, username).
Aucune unicité globale de username, aucune entité Group/AccessGroup. Le site peut limiter
le périmètre d'utilisation d'un droit. Ces règles ne créent aucun paramètre HTTP implicite.
