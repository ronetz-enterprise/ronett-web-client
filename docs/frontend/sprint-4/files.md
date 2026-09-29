# Inventaire Sprint 4

L’arbre était déjà modifié par les Sprints 1–3 et par les changements de navbar du projet. Le diff Git global n’est donc pas attribuable au seul Sprint 4. Aucun fichier antérieur n’a été réinitialisé.

## Ajouts

- features/memberships/model/member.ts et member.test.ts : schémas, capacités, transitions, filtres.
- features/memberships/queries/organization-members.ts : queries et mutations tenant-scoped.
- features/memberships/queries/current-memberships.ts : déplacement du module existant depuis index.ts, exports publics conservés.
- features/memberships/components/organization-members.tsx et organization-members.test.tsx : liste, ajout UUID, confirmations.
- features/organizations/components/organization-settings.tsx : consultation du DTO organisation.
- pages/organization-settings/organization-settings-page.tsx et organization-members-page.tsx : agrégation sans HTTP.
- shared/components/query-feedback.tsx : composition Alert/Skeleton réutilisable.
- shared/ui/card.tsx, table.tsx, badge.tsx, alert.tsx, alert-dialog.tsx, dialog.tsx : registre officiel.
- shared/testing/member-handlers.ts : contrats réels simulés pour les tests et le développement.
- app/router/guards/membership-management.test.tsx : refus, perte de droit, double confirmation, paramètres sous guard.
- tests/members.spec.ts : cinq parcours, chacun sur Chromium, Firefox, WebKit.
- docs/frontend/sprint-4/ : audit, rapport, inventaire et validation.

Les chemins ci-dessus, sauf tests et docs, sont relatifs à src/.

## Modifications d’intégration

- src/features/memberships/index.ts et src/features/organizations/index.ts : exports.
- src/app/routes.ts, src/app/router/navigation.tsx et src/shared/auth/organization-routes.ts : routes et entrées filtrées.
- src/app/layouts/sidebar/app-sidebar.tsx : navigation conditionnée aux permissions et nom accessible du second toggle déjà présent.
- src/app/layouts/app-layout.tsx, navbar-organization-select.tsx, navbar-user.tsx, navbar-user-menu.tsx : compatibilité des changements existants, sélection par UUID, labels et largeur mobile ; aucune refonte.
- src/shared/testing/server.ts, browser.ts, setup.ts : handlers et remise à zéro.
- tests/onboarding.spec.ts et tests-real/session-tenant.spec.ts : sélection via le nouveau Select ; parcours réel étendu à la gestion des membres.
- src/shared/ui/select.tsx et src/app/entry.client.tsx : formatage du code déjà présent ; le choix existant de démarrage est conservé.
- docs/frontend/sprint-3/ : précision sur la revalidation sans intervalle périodique et renvoi vers les nouveaux résultats.

package.json, package-lock.json, vitest.config.ts et playwright.real.config.ts comportent aussi les ajouts de qualification des Sprints 3–4 : couverture V8 et configuration backend réel. Aucun nouveau paquet runtime n’est nécessaire aux écrans du Sprint 4.

Le fichier de thème src/app/styles/app.css et le composant Button sont identiques aux sauvegardes relevées avant le Sprint 4.
