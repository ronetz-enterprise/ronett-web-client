# Acteurs et permissions

| Acteur | Authentification | Portée observée | Limite frontend |
|---|---|---|---|
| Visiteur | aucune | offres, checkout, paiement/status, support public, credential tokenisé | preuves métier requises |
| Utilisateur | JWT bearer | identité, notifications et ressources autorisées | aucun `/me` |
| OWNER | JWT + membership actif OWNER | organisation, sites, routeurs, offres, accès, finances, rapports, audit, support | organisation active exigée selon action |
| Client anonyme support | bearer propre au ticket | lecture/message d'un numéro de ticket | token distinct du JWT |
| Administrateur plateforme | JWT + permission applicative ou `ROLE_SUPER_ADMIN` | `/api/platform/**` | permissions non exposées au client |
| Flutterwave | signature webhook | `/api/webhooks/flutterwave` | jamais appelé par navigateur |
| Worker interne | appels applicatifs, pas HTTP navigateur | callbacks purchase refusés par Security | `denyAll` explicite |

**OBSERVÉ :** la plupart des contrôles OWNER sont réalisés dans les services via `MembershipApi`,
pas avec `@PreAuthorize`. Les routes plateforme mélangent `PlatformAdminAuthorizationService` et
un contrôle direct `ROLE_SUPER_ADMIN`.

**MANQUANT :** endpoint donnant l'utilisateur, ses organisations, rôles et permissions plateforme.
Le frontend ne peut pas construire des guards fiables à partir du seul JWT sans dépendre de claims
non documentés.

