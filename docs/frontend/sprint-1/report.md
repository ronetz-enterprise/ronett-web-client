# Rapport final — Sprint 1

Verdict : **PASS pour le périmètre du socle technique**.
Authentification, autorisations et données métier restent explicitement hors périmètre.
Aucun commit, push ou déploiement effectué. Les serveurs utilisés étaient locaux.

## Stack vérifiée

| Élément                                       | Version résolue         |
| --------------------------------------------- | ----------------------- |
| Node / npm                                    | 24.20.0 / 11.19.0       |
| React / React DOM                             | 19.3.0 / 19.3.0         |
| TypeScript                                    | 5.9.3, strict conservé  |
| React Router / dev / node / serve             | 8.4.0                   |
| Vite                                          | 8.3.1                   |
| Tailwind                                      | 4.3.3                   |
| shadcn / Base UI                              | 4.21.0 / 1.8.0          |
| TanStack Query                                | 5.104.0                 |
| React Hook Form / Zod                         | 7.89.0 / 4.6.5          |
| MSW / Vitest                                  | 2.15.0 / 5.0.2          |
| Testing Library React / user-event / jest-dom | 16.3.3 / 14.6.7 / 7.0.1 |
| Playwright / axe                              | 1.63.0 / 4.13.0         |
| ESLint / typescript-eslint / Prettier         | 9.39.5 / 8.70.1 / 3.9.9 |

Versions principales préexistantes conservées. Ajouts : lint/format, Testing Library/jsdom et axe.
Pas d'Axios, Redux, Zustand ou seconde bibliothèque de composants.
Le package-lock npm existant reste la référence; npm ci a été exécuté avec succès.

## Structure et routage

src/app : initialisation, configuration du router Framework SSR, providers, layouts et styles.
src/pages : écrans associés aux routes, hors features.
src/features : uniquement technical-preview pour la validation locale.
src/shared : HTTP, erreurs, configuration, composants techniques, formulaires, cache,
contexte de route typé, mocks et helpers de tests.
Les primitives shadcn sont désormais dans src/shared/ui; leurs hooks/utilitaires
sont dans src/shared/hooks et src/shared/utils. Alias unique @/* pour src.

Aucune page initiale n'était dans une feature : aucun déplacement de pages hors features nécessaire.
Le starter home est remplacé par une page d'accueil structurelle; le starter Welcome inutilisé et ses logos ont été supprimés après unification.

## Layout conservé

Source : app/routes/dashboard.tsx, composant Page, initialement non déclaré dans le routeur.
Destination : src/app/layouts/app-layout.tsx, AppLayout/OrganizationShell.
Sidebar, SidebarProvider, SidebarInset, Sheet mobile, rail et trigger existants sont réutilisés.
Les composants de composition AppSidebar/NavMain/TeamSwitcher sont adaptés dans layouts/sidebar.
Outlet, liens actifs NavLink, contexte UUID, sélecteur désactivé et navigation plateforme séparée.
Menus de démonstration non fonctionnels retirés du rendu; sources NavUser/NavProjects préservées.
Le pied signale l'absence de session. Les anciennes données Acme/shadcn ne sont pas présentées
comme des organisations/utilisateurs réels.

Changements visuels ciblés : suppression des polices/style globaux doublonnés,
focus visible, bouton de fermeture mobile, faible ajustement du contraste muted-foreground.
Thème système, responsive 320/768 px, navigation clavier, reduced-motion et zoom texte 200 % testés.
Détails : existing-layout.md. Inventaire des fichiers : files.md.

## HTTP, erreurs, formulaires et cache

fetch centralisé : bearer explicite, cookies omis, timeout/AbortSignal, JSON/texte/204,
aucun retry/refresh/redirect/toast ni organisation implicite.
ProblemDetail respecte errors:[{field,message}] et errorCode optionnel.
Correlation exacte depuis X-Correlation-Id puis le corps; affichage/copier, aucun ID généré.
Messages utilisateur maîtrisés; détails bruts/stack jamais affichés.
RHF/Zod : adaptateur testé pour formulaires plats, focus, erreurs accessibles et double-submit bloqué.
QueryClient par arbre SSR, clés tenant, purge/annulation au changement de contexte,
retries de lecture bornés; mutations jamais rejouées, aucune persistance.

## Tests et résultats

| Commande / contrôle                  | Résultat                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| npm ci                               | PASS — installation depuis le lockfile; audit npm : 0 vulnérabilité signalée    |
| npm run typecheck                    | PASS                                                                            |
| npm run lint                         | PASS                                                                            |
| npm run format:check                 | PASS                                                                            |
| npm run test                         | PASS — 47 tests, 9 fichiers                                                     |
| npm run build                        | PASS — client et serveur SSR                                                    |
| npx playwright install               | PASS — trois moteurs disponibles                                                |
| npm run test:e2e                     | PASS — 36 scénarios sur Chromium, Firefox et WebKit                             |
| npm run start + smoke Chromium local | PASS — SSR 200, hydratation, sidebar, 404, route technique 404, aucun appel MSW |
| axe WCAG 2 A/AA et 2.1 AA            | PASS sur les vues couvertes, en clair/sombre et mobile                          |
| Inspection statique sensible         | Aucun stockage de secrets/log applicatif/injection HTML ajouté                  |

Tests : configuration, erreurs et headers, transport, validations/formulaires, cache tenant,
boundary React, route 404, Sidebar/Outlet/mobile, SensitiveValue, confirmation, redirections sûres,
règles de dépendance avec résolution des imports. Playwright couvre aussi clipboard réel Chromium,
clavier, absence de localStorage/sessionStorage, contrastes et zoom texte.
Les captures desktop/mobile sont dans test-results après exécution; elles ne sont pas versionnées.
Le build final n'émet pas de chunk MSW; le worker public n'est jamais enregistré en production.

## Décisions et écarts

ADR-001 conserve Framework Mode/SSR; ADR-002 choisit fetch en l'absence de client existant;
ADR-003 conserve TanStack Query sans persistance; ADR-004 garde les pages hors features.
Les rapports frontend-contract ont été lus; aucun code backend consulté.
Aucun endpoint, rôle, enum métier, Group ou AccessGroup inventé.

La demande de sprint prévaut sur le prompt backend Phase 0 concernant refresh/session :
aucun refresh réel ni mutex d'authentification anticipé.
Les chemins __mocks sont techniques, hors contrat métier.
L'exception d'emplacement historique shadcn a été supprimée à la demande de l'utilisateur : tout le code applicatif réside désormais dans src.

## Difficultés résolues et limites de l'environnement

Le sandbox échouait avec « mountinfo path is not absolute » avant lecture/édition/exécution.
Les commandes nécessaires ont été exécutées avec autorisation hors sandbox; aucun blocage restant.
Le lecteur d'image présentait le même défaut; la capture mobile a été lue via une commande autorisée.

Installation de @hookform/resolvers refusée (ERESOLVE : peer optionnel valibot 0.39
contre valibot 1.5 utilisé par React Router). Aucun --force/legacy-peer-deps :
adaptateur Zod/RHF local limité et testé, documentation incluse.

Les premières passes ont révélé puis corrigé : type du callback startTransition,
typage des erreurs RHF, selectors de navigation ambigus, boundary 404 découpée par le framework,
clics avant hydratation, contraste mobile 4.49:1 et inclusion d'un chunk MSW non utilisé.
Les résultats PASS portent sur les passes après correction.

npm signale ESLint 9 en fin de support; eslint-plugin-jsx-a11y 6.10.2 déclare des peers jusqu'à 9.
Version conservée pour garder une installation reproductible sans forcer les peers.
Planifier une montée conjointe du linter et de son plugin d'accessibilité.
npm 11 signale les scripts d'installation MSW/unrs-resolver non explicitement approuvés;
installation, résolution et toutes les vérifications réussissent sans les forcer.
La CI est configurée mais n'a pas été exécutée sur GitHub (aucun push).

## Risques, différé et Sprint 2

Les shells sont des aperçus, pas des guards de sécurité. Aucun accès métier n'y est branché.
Ne pas activer de données sensibles avant un contrat fiable de session/permissions.
Les contrôles axe ne constituent pas une certification ni une qualification complète lecteur d'écran.

Prérequis backend : /me ou contrat équivalent, liste des organisations accessibles,
permissions plateforme, CORS restreint et exposition cross-origin de X-Correlation-Id à confirmer.
Le corps ProblemDetail permet déjà un fallback de corrélation.
Corriger/qualifier les contrôles Identity signalés par les rapports avant d'exposer une UI concernée.

Sprint 2 : authentification en mémoire, logout/purge de cache, refresh coordonné selon le contrat,
guards, organisations réelles et permissions. Les formulaires imbriqués nécessiteront un adaptateur
dédié ou la résolution du conflit du connecteur officiel. Aucun endpoint supposé en attendant.
Tous les domaines métier complets demandés comme hors périmètre restent différés.
Avant déploiement réel, remplacer l'URL backend locale du build et qualifier les CORS.
