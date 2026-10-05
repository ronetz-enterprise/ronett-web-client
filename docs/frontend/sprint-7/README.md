# Sprint 7 — Gestion des offres Internet

Date : 29 septembre 2026. Verdict final : **PASS**, sur le périmètre administratif effectivement exposé par le backend.

## Audit et contrats

La [matrice préalable](audit-and-contracts.md) présente les 11 endpoints administratifs, requêtes, réponses, permissions, erreurs et preuves backend. Elle a été présentée avant l’implémentation. Modèle réel **A : organisation → site → offre**, avec un site unique et immuable. Pas de relation avec un routeur. Pas d’OpenAPI générée identifiée ; les contrôleurs, DTO, service, domaine, persistance et documentation locaux font foi.

Preuves du contrôleur backend `platform/src/main/java/com/ronetz/platform/offer/presentation/rest/OfferController.java` : création ligne 23, liste 33, détail 39, informations 44, prix 49, politique 54, ordre 61, publication 66, suspension 71, reprise 76, archivage 81. L’autorisation du service exige un OWNER actif ; aucun droit OFFER_* n’est exposé. Aucun rôle ou permission inventé.

L’offre décrit des conditions commerciales et une politique d’accès. Elle ne gère ni achats, ni paiements, ni credentials, ni accès accordés, ni consommation réseau. Aucun appel aux API publiques, Purchase, Payment, Access ou RADIUS n’a été ajouté.

## Implémenté

- Entrée Offres dans la sidebar, avec sélection d’un site de l’organisation validée. Entrée réutilisable depuis le détail du site.
- Liste paginée côté serveur, tailles 10/20/50/100, page dans l’URL, ordre serveur conservé : displayOrder/createdAt/id. État vide distinct des erreurs ; page hors résultats permet de revenir à la première page.
- Création complète en brouillon, formulaire RHF/Zod en une page : informations, prix, politique, ordre, résumé avant soumission. Site fixé par la route et revalidé avant création.
- Détail commercial et technique, métadonnées, prix et unités exacts.
- Édition en quatre commandes séparées : informations, prix, politique complète, ordre. Sauvegardes indépendantes explicites, sans atomicité simulée. Recharge volontaire de chaque section, saisie conservée après incident ou conflit.
- Publication, suspension, réactivation, archivage avec confirmation contextualisée. Verrou de soumission synchrone, état en cours, invalidation ciblée et notification existante. Aucune publication automatique.
- Garde de session/organisation existante, capacités centralisées, vérification du site et du triplet organisation/site/offre, relecture avant mutation, refus d’une réponse hors contexte. Annulation au démontage, aucune réinsertion tardive dans un ancien tenant.
- Chargement, actualisation, refus, introuvable, conflits et incidents temporaires. ProblemDetail conservé par le socle ; textes utilisateur sûrs, erreurs de champs et référence de corrélation. Erreur temporaire de rechargement : les formulaires restent montés et les sauvegardes sont désactivées jusqu’à récupération. Erreur d’autorisation : contenu retiré.

## Routes canoniques

| Route                                                         | Fonction                   |
| ------------------------------------------------------------- | -------------------------- |
| `/app/:organizationId/offers`                                 | Sélection du site          |
| `/app/:organizationId/sites/:siteId/offers`                   | Liste paginée              |
| `/app/:organizationId/sites/:siteId/offers/new`               | Création précontextualisée |
| `/app/:organizationId/sites/:siteId/offers/:offerId`          | Détail                     |
| `/app/:organizationId/sites/:siteId/offers/:offerId/settings` | Édition                    |

Une seule feature et un seul jeu de routes de données. Pas de fausse liste globale ni de pagination d’un agrégat local. Les pages sont des points d’entrée et n’appellent pas le backend.

## Modèles, prix et devise

Modèles distincts pour Offer, page, politique, création et quatre types d’édition. Réponses validées par Zod avant affichage ou cache. UUID, statut, date, bornes et cohérence du périmètre sont vérifiés.

Le contrat utilise **BigDecimal JSON numérique**, pas une unité mineure ni une chaîne côté serveur. Le codec propre aux offres conserve les lexèmes numériques comme chaînes exactes, y compris les longs et les exposants. Les commandes émettent des nombres JSON depuis des valeurs validées explicitement marquées ; le nom et la description utilisent l’échappement JSON standard. Aucun montant ni quota ne passe par un flottant JavaScript.

Le client HTTP reçoit deux options génériques facultatives : `jsonCodec` et `query`. Les autres contrats conservent leur sérialisation habituelle. Les ProblemDetail restent décodés normalement. La pagination passe par `URLSearchParams`, car l’adaptateur authentifié rejette volontairement les chemins contenant `?`. Cette validation de sécurité n’a pas été affaiblie.

Affichage : `Intl.NumberFormat.formatToParts(BigInt(partieEntière))` pour groupements, devise et placement, fraction décimale exacte. Les zéros excédentaires sont supprimés seulement après validation de la précision monétaire. La devise provient de l’organisation via sa feature publique et reste non modifiable. Une incohérence de devise existante permet de corriger le prix, pas de convertir arbitrairement le montant. Le backend Java demeure l’autorité des devises et précisions acceptées.

## Unités et politique

| Champ                   | Unité canonique / borne                     | Présentation                                      |
| ----------------------- | ------------------------------------------- | ------------------------------------------------- |
| `validitySeconds`       | 1..31 536 000 secondes                      | jours, heures, minutes, secondes, sans troncature |
| `dataAllowanceBytes`    | null ou 1..9 223 372 036 854 775 807 octets | octets/ko/Mo/Go SI exacts                         |
| `downloadLimitBps`      | null ou long positif                        | bit/s, kbit/s, Mbit/s, Gbit/s SI exacts           |
| `uploadLimitBps`        | null ou long positif                        | limite montante distincte                         |
| `maxConcurrentSessions` | 1..32                                       | sessions simultanées, pas appareils               |
| `displayOrder`          | 0..2 147 483 647                            | ordre croissant ; 0 proposé et expliqué           |

Les conversions sont centralisées et utilisent BigInt. 1 Go = 1 000 000 000 octets ; 1 Mbit/s = 1 000 000 bit/s. La valeur canonique reste visible dans le détail. Champ facultatif vide → null → illimité ; zéro est refusé. Une mise à jour de politique remplace ses cinq valeurs. La durée est le temps écoulé après activation, distinct de la période de vente. Aucun calendrier, activationMode, expiration absolue ou nombre d’appareils fictif.

## Statuts, modifications et snapshots

Création DRAFT, publication DRAFT → PUBLISHED, suspension PUBLISHED → SUSPENDED, réactivation SUSPENDED → PUBLISHED. Archivage depuis tout état non archivé vers ARCHIVED, terminal. Les actions impossibles ne sont pas proposées ; les commandes restent protégées côté serveur.

Édition permise hors ARCHIVED, y compris publiée ou suspendue, avec site/organisation actifs. Lecture/suspension/archivage sont plus permissifs côté backend que le guard organisation existant, conservé ici.

Purchase capture actuellement nom, prix, devise et durée au moment de l’achat. Modifier Offer ne réécrit pas ces valeurs historiques. **Limite backend confirmée** : Purchase convertit les secondes en minutes par division entière et ne persiste pas toute la politique quota/débits/sessions. L’interface ne promet donc pas un snapshot complet de celle-ci. Aucun snapshot, achat ou accès n’est modifié par ce sprint.

Concurrence : comparaison de `updatedAt` avec la version observée par le formulaire, puis relecture serveur et commande. Cela détecte les modifications déjà visibles avant envoi ; cela ne ferme pas la fenêtre entre lecture et écriture. Pas de version publique, d’ETag ni d’If-Match disponibles.

## Cache et sécurité

Préfixe commun : `['organization', organizationId]`.

- Site d’offres : `['organization', org, 'offers', site]`.
- Liste : `['organization', org, 'offers', site, 'list', {page, size}]`.
- Détail : `['organization', org, 'offers', site, 'detail', offerId]`.
- Mutation : `['organization', org, 'offer-mutation']`.
- Organisation : réutilisation `['organization', org, 'detail']`.

Chaque mutation invalide le préfixe d’offres du site, y compris ses pages et détails. Pas de cache optimiste d’offre. Le guard et le changement d’organisation annulent et retirent l’ancien cache ; les effets tardifs de mutation sont neutralisés au démontage. Un GET global d’offre est validé contre l’organisation et le site attendus avant toute restitution.

Bearer en mémoire, CSRF/cookies de session et règles de refresh inchangés. Aucun token dans localStorage ; aucune injection HTML. Requêtes de mutation sans retry automatique. Après une interruption réseau, la création peut avoir été appliquée : l’interface demande de vérifier la liste avant de renouveler l’action.

## Composants et thème

Réutilisation : Button, Card, Table, DropdownMenu, AlertDialog, Input, Textarea, Select, Alert, Badge, Skeleton, Empty, Pagination, Breadcrumb, wrappers PageHeader/ValidatedForm/FormField/QueryFailure et notifications existantes Base UI. Aucun composant shadcn téléchargé, aucune dépendance installée, aucune migration vers un autre système de notifications.

Routage React Router Framework selon le skill local. Styles sémantiques existants, Hugeicons, Inter/Manrope, mode sombre et sidebar conservés. Aucun thème propre aux offres. La correction du repérage actif de la sidebar respecte les modifications préexistantes de l’utilisateur.

`src/app/styles/app.css` inchangé : SHA-256 `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`. Primaire clair `oklch(0.508 0.118 165.612)`, sombre `oklch(0.432 0.095 166.913)`.

## Qualification manuelle

Parcours conduits dans Chromium via pilotage ponctuel, backend Spring local réel, frontend sans mocks. Les scripts et données de travail sont temporaires sous `/tmp`, sans ajout de suite Playwright, test de composant, test unitaire ou configuration de couverture au dépôt. Les comptes et organisations de qualification sont des données locales.

| Parcours                                                            | Résultat                                                                                            |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Sélection d’un site, liste vide                                     | Vérifié                                                                                             |
| Création complète en brouillon                                      | Vérifié                                                                                             |
| Montant EUR 999999999999999.99 et quota 9223372036854775807         | Envoi JSON exact et affichage exact vérifiés                                                        |
| Durée 86401 secondes, débit 10485760 bit/s, limite null             | Affichages 1 j 1 s, 10,48576 Mbit/s, Illimité vérifiés                                              |
| Informations, prix, politique, ordre                                | 4 sauvegardes et valeurs persistées rechargées via backend vérifiées                                |
| Publication, suspension, réactivation, archivage                    | Vérifiés sur backend réel                                                                           |
| Pagination de 11 offres, taille 10                                  | Pages de 10 puis 1, précédent/suivant vérifiés                                                      |
| Entrée depuis le détail d’un site                                   | Vérifiée                                                                                            |
| Changement d’organisation par la sidebar                            | Vérifié, nouvelle liste du bon site                                                                 |
| Offre d’Org-B dans URL Org-A avec utilisateur propriétaire des deux | Rejetée avant affichage ; nom étranger absent                                                       |
| Offre d’un autre site dans le même tenant                           | Rejetée avant affichage                                                                             |
| Utilisateur sans membership : lecture et PATCH étrangers            | Backend 403 pour les deux                                                                           |
| Devise XAF : montant 1.50 puis 500                                  | Décimales refusées, création entière réussie                                                        |
| Conflit concurrent réel                                             | Modification externe non écrasée, saisie locale conservée                                           |
| Incident 500 simulé, corrélation, reprise                           | Vérifiés : saisie et corrélation conservées, puis sauvegarde réelle réussie                         |
| Annulation de confirmation et retour du focus                       | Vérifiés                                                                                            |
| Accès direct à l’édition d’une offre archivée                       | Vérifié, aucun formulaire éditable                                                                  |
| Clair/sombre et responsive                                          | Détail clair/sombre desktop et mobile 390 px, liste et formulaire mobiles sans débordement vérifiés |
| Recherche, filtre statut, tri au choix, duplication                 | Bloqués par absence de contrat, non simulés                                                         |

Un contrôle ponctuel du codec a également confirmé décimal limite, int64 limite, texte échappé et exposant JSON sans perte. Les réponses simulées d’incident ne sont pas présentées comme des défaillances observées du backend.

Non vérifié exhaustivement : tous les navigateurs, toutes les devises Java/Intl, lecteurs d’écran, chaque cas de révocation/expiration en cours de saisie, charge réelle, courses concurrentes entre la dernière lecture et l’écriture. Le guard existant démonte ses enfants pendant une revalidation de membership : ce comportement des sprints précédents est conservé.

## Commandes et résultats

| Commande                                                                                            | Résultat final                           |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `npm run typecheck`                                                                                 | PASS, aucune erreur TypeScript           |
| `npm run lint`                                                                                      | PASS                                     |
| `npm run build`                                                                                     | PASS, bundles client et serveur produits |
| `npm run format:check`                                                                              | PASS, tous les fichiers conformes        |
| `git diff --check`                                                                                  | PASS                                     |
| `npx vitest run src/shared/api/http-client.test.ts src/features/authentication/lib/session.test.ts` | 39/39 tests existants passent            |
| `npx vitest run src/app/layouts/app-layout.test.tsx`                                                | 8/8 tests existants passent              |

47 tests existants ciblés passent, sans ajout ni modification de tests par ce sprint. La suite complète n’a pas été exécutée. Formatage ciblé effectué avec `npx prettier --write` sur les fichiers livrés et Tabs.

Le contrôle additionnel du layout a identifié un déclencheur de sidebar démonté/remonté lors du repli : conservation du même élément DOM, afin de préserver le focus et le dépliage. Le test existant échouait avant cette correction et passe ensuite. Le contrôle de formatage a identifié Tabs ; seules les conventions Prettier ont été appliquées.

Contrôle ponctuel axe-core installé : **0 violation détectée** dans `main` sur le détail et le formulaire. Ce résultat ne remplace pas un audit exhaustif avec lecteurs d’écran. État actif Offres et `aria-current` vérifiés sur la route canonique rattachée au site.

Aucun nouveau test, test existant modifié, seuil ou outil de coverage introduit par ce sprint. Les modifications de tests déjà présentes dans l’espace de travail appartiennent aux travaux de l’utilisateur et ont été conservées. Aucun commit, déploiement ou changement backend.

## Fichiers livrés

Ajouts :

- `src/features/offer/api/exact-json.ts`
- `src/features/offer/model/offer.ts`
- `src/features/offer/formatters/offer.ts`
- `src/features/offer/queries/offers.ts`
- `src/features/offer/components/offer-shared.tsx`
- `src/features/offer/components/offer-form.tsx`
- `src/features/offer/components/offer-actions.tsx`
- `src/features/offer/components/offers-list.tsx`
- `src/features/offer/components/offer-screens.tsx`
- `src/features/offer/index.ts`
- `src/features/organizations/queries/organization.ts`
- `src/pages/offers/offer-sites-page.tsx`
- `src/pages/offers/offers-page.tsx`
- `src/pages/offers/offer-create-page.tsx`
- `src/pages/offers/offer-details-page.tsx`
- `src/pages/offers/offer-settings-page.tsx`
- `docs/frontend/sprint-7/audit-and-contracts.md`
- `docs/frontend/sprint-7/README.md`

Modifications du sprint : `src/shared/api/http-client.ts`, `src/features/organizations/index.ts`, `src/app/routes.ts`, `src/app/router/navigation.tsx`, `src/app/layouts/sidebar/nav-main.tsx` (repérage actif seulement, changements utilisateur préservés), `src/pages/sites/site-details-page.tsx`, `src/app/layouts/sidebar/app-sidebar.tsx` (conservation du même déclencheur DOM pour le focus et le dépliage), `src/shared/ui/tabs.tsx` (formatage uniquement, classes et comportement inchangés).

Les changements préexistants de layout/sidebar, les suppressions de navbar et les modifications de tests présents dans `git status` ont été conservés. Seuls les ajustements de navigation/focus explicités ci-dessus ont été apportés à la sidebar par ce sprint.

## Indisponible, risques et suite

Bloqué par contrat : recherche, filtres de statut/techniques, tri configurable, duplication, historique consultable, affectation multisite, liste globale paginée, droits fins par membre. Aucun bouton fictif ni endpoint inventé.

Besoins backend : protocole de concurrence avec précondition/version publique ; contrat de recherche/filtrage/tri si souhaité ; correction du snapshot Purchase avant d’en promettre l’intégralité et la précision en secondes ; éventuelles permissions Offer explicites. Aucun de ces besoins n’est masqué par une simulation frontend.

Différé au sprint suivant : catalogue public, sélection côté client et création d’achat selon les contrats disponibles. Souscription, panier, checkout, paiements, credentials, AccessGrant, RADIUS, consommation et reporting restent hors de cette livraison.
