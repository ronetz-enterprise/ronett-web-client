# Sprint 5 — Gestion des sites

## Verdict : PASS

Le périmètre réellement exposé par le backend est implémenté et les parcours principaux ont été vérifiés sur une instance locale réelle, sans MSW. Les capacités absentes du contrat sont explicitement distinguées ci-dessous. Aucun test, seuil de couverture, commit ou déploiement ajouté.

## Audit et contrats

La [matrice des contrats](audit-and-contracts.md) a été rédigée avant l’implémentation. Contrôleurs, DTO, service public, domaine, persistance et migration V8 du backend `../../platform` ont été inspectés, ainsi que les rapports Sprints 3/4 et les documents frontend-contract. Pas d’OpenAPI disponible.

Un site est un emplacement d’exploitation Internet d’une organisation. Le modèle transport validé par Zod reprend exclusivement SiteView : id, organizationId, name, description, city, district, addressDetails, timezone, status, createdAt, updatedAt. Les trois champs facultatifs sont nullables à la lecture. Les formulaires possèdent leur propre schéma ; le PATCH n’envoie que les champs modifiés, avec chaîne vide pour effacer un texte facultatif. Le serveur reste l’autorité pour la base de fuseaux nommés Java, l’unicité et les transitions.

Les statuts sont ACTIVE, SUSPENDED et CLOSED. Suspension/réactivation réversibles ; fermeture définitive, données toujours consultables. Les confirmations expliquent les conséquences connues sans promettre de coupure immédiate des sessions réseau. Aucun motif n’est requis par l’API.

## Implémenté

- Liste complète backend, recherche locale nom/ville/quartier, filtre local de statut, pagination locale 10/25/50 ; critères `q`, `status`, `page`, `size` dans l’URL. Ordre stable reçu du serveur. Aucun paramètre serveur fictif.
- Création, détail, modification partielle, suspension, réactivation et fermeture via les sept opérations réelles.
- Champs validés, erreurs proches des champs, conflit de nom explicite, conservation de saisie après erreur et actualisation temporairement indisponible, verrous synchrones contre les doubles soumissions.
- États vides et aucun résultat séparés des erreurs, Skeleton initial, actualisation annoncée, ProblemDetail conservé sans texte technique brut affiché, correlationId copiable, confirmation via le système de notifications existant.
- Actions sensibles avec AlertDialog ; détails et formulaires dédiés ; aucun panneau futur vide, aucune statistique ou ressource simulée.
- Sidebar existante : Sites actif également sur les sous-routes, tooltip en mode réduit et fermeture mobile conservés.

## Routes

Toutes les routes sont enfants du guard d’authentification, du guard d’organisation et du layout existants :

- `/app/:organizationId/sites`
- `/app/:organizationId/sites/new`
- `/app/:organizationId/sites/:siteId`
- `/app/:organizationId/sites/:siteId/settings`

Les pages ne font aucun appel HTTP. Les hooks TanStack Query de la feature utilisent useAuth.request. Aucun store de sites ni token persistant ajouté.

## Capacités, cache et sécurité

`siteCapabilities` centralise les règles du service : membership actif pour la lecture ; OWNER actif pour les mutations ; organisation active selon les contraintes du guard existant ; comparaison de l’organisation cible et statut du site pour chaque action. Aucune permission SITE_* n’est inventée. Les permissions existantes du membership restent nécessaires pour traverser le guard d’organisation.

Clés :

```text
["organization", organizationId, "sites", "list"]
["organization", organizationId, "sites", "detail", siteId]
["organization", organizationId, "site-mutation"]
```

Le préfixe `["organization", organizationId, "sites"]` permet les invalidations ciblées. Les critères locaux ne modifient pas la requête serveur complète et ne nécessitent pas une copie du cache par filtre.

Toute réponse est validée et comparée à organizationId ; le détail est également comparé au siteId demandé. Les UUID invalides ne sont pas envoyés au backend. Les queries transmettent AbortSignal. Le changement d’organisation démonte les écrans et conserve l’annulation/purge ciblée du Sprint 3. Les mutations n’écrivent pas leurs réponses dans le cache et ne redirigent pas après démontage ; elles ne sont pas rejouées automatiquement. Les refus 401/403 revalident l’accès serveur. Les données du formulaire ne contiennent pas organizationId : celui-ci vient exclusivement du contexte validé.

Le backend a renvoyé 404 pour lecture ET modification d’un site B sous contexte A, et 403 pour une organisation inaccessible à l’utilisateur. La session web/CSRF existante reste utilisée ; les routes métier bearer omettent les cookies. Aucun secret journalisé par la feature, aucun HTML brut injecté.

## shadcn, thème et responsive

Réutilisés : Button, Card, Table, Input, Select, Badge via StatusBadge, Breadcrumb, DropdownMenu, Alert, AlertDialog, Skeleton, Empty, ainsi que sidebar/Sheet/Tooltip et les compositions ValidatedForm/FormField RHF/Zod. Notifications existantes conservées ; pas de deuxième système Sonner.

Téléchargés du registre officiel avec le CLI installé **4.21.0** : Textarea et Pagination. Le remplacement de Button a été refusé. Le composant Pagination généré a été corrigé pour rendre explicitement children dans son lien et satisfaire jsx-a11y. Pas de dépendance supplémentaire.

Thème non modifié : SHA-256 avant/après de `src/app/styles/app.css` = `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`. Couleurs primaires OKLCH, Inter/Manrope, rayons, surfaces, tokens et Hugeicons conservés.

Sur mobile : actions du PageHeader repliées, formulaire sur une colonne, nom/localisation et statut prioritaires dans la table, dates masquées, filtres/pagination repliables. Sur tablette/desktop : formulaire et cartes sur deux colonnes, dates progressivement visibles. Styles sémantiques, labels/ARIA et comportements clavier/focus des primitives conservés ; règle reduced-motion existante inchangée.

## Vérifications effectuées

Qualification ponctuelle par pilotage Chromium, sans fichier de test ni modification des suites existantes. Backend JAR local sur 8081, frontend temporaire sur 4174, origine CORS explicite, cookies Secure=false uniquement pour HTTP localhost. Comptes/organisations synthétiques préfixés Sprint5 ; aucune donnée préexistante modifiée.

| Vérification         | Résultat                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Liste réelle         | 10 lignes page 1, 1 ligne page 2 sur 11 sites                                                   |
| Recherche            | Recherche sans résultat puis effacement fonctionnels                                            |
| Statut               | Filtre ACTIVE vide et SUSPENDED trouvant le site attendu                                        |
| Organisation vide    | État « Aucun site » et création disponibles                                                     |
| Création/détail      | Création UI, navigation vers SiteView réel                                                      |
| Modification         | Ville modifiée puis confirmée sur le détail                                                     |
| Cycle de vie         | Suspension, réactivation, fermeture via dialogues et API réelle                                 |
| Validation           | Nom obligatoire et erreur liée au champ                                                         |
| Conflit              | Nom dupliqué 409, ville saisie conservée                                                        |
| Isolation            | GET/PATCH site B sous organisation A : 404 ; organisation étrangère : 403                       |
| Changement de tenant | Sélecteur A → B : uniquement le site B, zéro ancien nom A affiché                               |
| Responsive           | Liste 375/768/1440 px, clair/sombre : aucun débordement du document                             |
| Inspection visuelle  | Liste mobile claire et desktop sombre, formulaire mobile, détail et confirmation mobiles        |
| Panne simulée        | PATCH et GET 503 interceptés dans le navigateur : saisie conservée après actualisation en échec |
| JavaScript           | Aucune pageerror pendant le parcours principal                                                  |
| TypeScript           | `npm run typecheck` : succès                                                                    |
| Lint                 | `npm run lint` : succès après correction du composant généré                                    |
| Production           | `npm run build` : succès client et serveur                                                      |
| Format               | `npm run format:check` : succès                                                                 |
| Diff                 | `git diff --check` : succès ; audit des seules modifications Sprint 5                           |

Commandes additionnelles : lectures `rg`, `cat`, `sed`, `find`, `git status`, `git diff`, `sha256sum`; `npm exec shadcn -- --version`; `npm exec shadcn -- add textarea pagination --yes`, puis relance de Pagination avec refus de remplacer Button ; `npx prettier --write` ciblé ; Java JAR local ; `npm run dev -- --host localhost --port 4174 --strictPort` ; commandes Node ponctuelles utilisant le navigateur installé. Installation verrouillée inutile : node_modules et lock présents, aucun changement de dépendances requis. Les commandes ont nécessité une exécution hors sandbox à cause de l’erreur locale bubblewrap `mountinfo path is not absolute`.

## Limites, non vérifié et risques résiduels

- **Bloqué par le contrat** : pagination/recherche/tri serveur et contrôle public de concurrence. La liste complète limite le passage à grande échelle.
- **Concurrence** : @Version interne et GlobalExceptionHandler renvoient 409 concurrent-modification sur conflit transactionnel. Sans version/ETag public, une édition ancienne du même champ peut encore écraser une modification récente. Le PATCH ciblé limite les changements collatéraux mais ne résout pas ce besoin backend.
- **Non vérifié** : concurrence réelle de deux administrateurs, perte de permission pendant une mutation, expiration effective de session pendant une édition, tous les scénarios 400/422/429/5xx, navigation clavier exhaustive, zoom 200 %, lecteurs d’écran, autres navigateurs, réseau de production et HTTPS. Les garde-fous sont implémentés, ces qualifications ne sont pas revendiquées.
- **Détection des droits** : héritée du Sprint 3, au montage/retour au premier plan/refus serveur ; pas de notification push immédiate des révocations.
- **Création incertaine** : aucun protocole d’idempotence public ; l’interface invite à vérifier les données avant de recommencer après une réponse perdue.
- **Différé** : router/MikroTik, offres, accès, Accounting, paiements, géocodage et statistiques. Aucun endpoint de ces domaines intégré.
- Les données synthétiques de qualification restent identifiables dans la base locale. La qualification locale ne certifie pas un environnement de production.

## Fichiers de ce sprint

Ajoutés :

- `src/features/site/model/site.ts`
- `src/features/site/queries/sites.ts`
- `src/features/site/components/site-shared.tsx`
- `src/features/site/components/site-form.tsx`
- `src/features/site/components/site-actions.tsx`
- `src/features/site/components/sites-list.tsx`
- `src/features/site/components/site-screens.tsx`
- `src/features/site/index.ts`
- `src/pages/sites/sites-page.tsx`
- `src/pages/sites/site-create-page.tsx`
- `src/pages/sites/site-details-page.tsx`
- `src/pages/sites/site-settings-page.tsx`
- `src/shared/ui/textarea.tsx`
- `src/shared/ui/pagination.tsx`
- `docs/frontend/sprint-5/audit-and-contracts.md`
- `docs/frontend/sprint-5/README.md`

Modifiés par ce sprint : `src/app/routes.ts`, `src/app/router/navigation.tsx`, `src/app/layouts/sidebar/nav-main.tsx`. Les autres différences déjà présentes dans le workspace ne sont pas attribuées à ce sprint. Aucun fichier backend, thème, test ou configuration de couverture modifié.
