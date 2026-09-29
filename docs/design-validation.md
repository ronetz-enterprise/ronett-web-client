# Rapport de livraison — système graphique Ronetz

## Diagnostic et direction

1. **Interface initiale** : fondations solides (OKLCH, Inter/Manrope, Tailwind 4, shadcn), mais statuts fixes sans thème sombre, cartes vides imbriquées, chargements génériques, compte dupliqué dans le shell et débordement à 320 px / texte 200 %. Inventaire complet dans [design-audit.md](design-audit.md).
2. **Direction** : console neutre, compacte et structurée ; titres nets, contexte organisationnel visible, bordures plutôt qu’ombres et peu de vert.
3. **Inspiration** : hiérarchie, densité utile, navigation rapide, feedback clair des consoles modernes. Aucune interface propriétaire reproduite.
4. **Identité propre** : émeraude d’origine, Manrope, monogramme typographique R, vocabulaire WiFi, statuts explicites et organisation active.

## Fondations et composants

5. **Tokens conservés** : tous les tokens initiaux, particulièrement les deux valeurs exactes du primaire, primary-foreground, polices, radius 0,625rem, chart-1…5, surfaces et sidebar. Le thème n’a pas été remplacé.
6. **Tokens ajoutés** : success/warning/info/danger et leurs foregrounds, control-border, focus, hauteurs standard/compacte de table. [Mesures de contraste](design-contrast.json) calculées par conversion OKLCH → RGB linéaire, bornée au gamut sRGB, puis luminance WCAG. La validation axe vérifie aussi le rendu réel des pages.
7. **shadcn réutilisé** : Sidebar, Button, Card, Table, Badge, Alert, Input, Select, Avatar, DropdownMenu, Breadcrumb, Separator, Tooltip, Dialog, AlertDialog, Sheet, Skeleton. Base UI conservé, aucune migration de primitives vers Radix.
8. **Téléchargé** : Empty via `npx shadcn add empty --yes`, avec le style base-mira existant. Aucune nouvelle bibliothèque UI ni TanStack Table, Chart ou Storybook ajouté.
9. **Icônes** : Hugeicons conservé ; Tabler non retenu car aucune incohérence de bibliothèque ne justifie une migration. Les icônes Organisation/Membres sont différenciées et le trait est fixé à 2.
10. **Composants partagés** : PageHeader enrichi ; EmptyState/StatusBadge/PageLoading/ErrorState composés ; PageSection, SummaryCard, MetricCard, DataTable et TableSkeleton ; mapping de présentation `businessStatusTone`.
11. **Modèles** : authentification, dashboard sans chiffres fictifs, liste, détail/résumé, création, paramètres, états vides/erreurs. Familles Resource/Status/Onboarding documentées par composition des primitives ; aucun processus métier fictif créé.

## Périmètre de fichiers

12. **Fichiers de cette intervention** (le workspace contenait déjà de nombreux changements non commités ; le diff Git global n’est donc pas le seul périmètre de cette tâche) :

- `src/app/styles/app.css`
- `src/app/root.tsx`
- `src/app/layouts/app-layout.tsx`
- `src/app/layouts/auth-layout.tsx`
- `src/app/layouts/public-layout.tsx`
- `src/app/layouts/sidebar/app-sidebar.tsx`
- `src/app/layouts/navbar-organization-select.tsx`
- `src/app/layouts/navbar-user-menu.tsx`
- `src/app/router/navigation.tsx`
- `src/shared/components/feedback.tsx`
- `src/shared/components/form.tsx`
- `src/shared/components/status.ts` (créé)
- `src/shared/components/page-patterns.tsx` (créé)
- `src/shared/ui/button.tsx` (variantes de tailles et destructif uniquement)
- `src/shared/ui/sidebar.tsx` (nom de marque uniquement)
- `src/shared/ui/empty.tsx` (officiel téléchargé)
- `src/pages/auth/login-page.tsx`
- `src/pages/auth/register-page.tsx`
- `src/pages/dashboard/dashboard-page.tsx`
- `src/pages/organization/organization-page.tsx`
- `src/pages/public/home-page.tsx`
- `src/pages/public/diagnostics-page.tsx`
- `src/features/memberships/components/organization-members.tsx`
- `src/features/organizations/components/organization-settings.tsx`
- `src/features/technical-preview/index.ts`
- `src/features/technical-preview/design-system-preview.tsx` (créé)
- `tests/design-system.spec.ts` (créé)
- `tests/members.spec.ts` (attente explicite de la destination après changement d’organisation)
- `tests/example.spec.ts` (titre de marque)
- `tests/accessibility.spec.ts` (attente de la stabilisation du layout après agrandissement du texte)
- `docs/design-audit.md`, `docs/design-system.md`, `docs/ui-patterns.md`, `docs/design-contrast.json`, `docs/design-validation.md` (créés)

13. **Écrans harmonisés** : connexion/inscription et layouts partagés d’onboarding/compte, dashboard, organisation, paramètres généraux, membres, erreurs/chargements via composants communs. Galerie intégrée à `/__dev/socle`, protégée par les conditions de route et loader existantes ; pas de route de galerie dans le build production.

## Vérifications et corrections

14. **Responsive** : matrice `tests/design-system.spec.ts` pour 375, 768, 1280 et 1440 px, clair/sombre ; captures connexion, dashboard, sidebar réduite ou navigation mobile, détail, paramètres, membres, dialog, aucun résultat, formulaire, erreur et galerie. Les tests existants couvrent aussi 320 px et texte à 200 %.
15. **Accessibilité** : axe WCAG 2 A/AA et 2.1 AA sur les vues de la matrice, focus/Échap, tooltip au clavier, reduced motion, noms accessibles, labels et débordements. Contrastes : primaire/texte 5,09:1 clair et 7,19:1 sombre ; nouveaux statuts 7,95 à 9,40:1 ; focus/fond 7,44 et 11,34:1 ; contours/fond 4,65 et 5,88:1. Le primaire sur fond sombre vaut 2,61:1 : ne pas l’utiliser comme texte ou outline de focus. Le focus dispose désormais d’un token neutre dédié. Le bouton destructif initial mesuré à 3,98:1 utilise désormais la paire danger. Les tokens fondamentaux n’ont pas été modifiés pour corriger ces défauts.
16. **Commandes** : inventaire `rg`, lectures `cat`, `git status/diff`, `npm test -- --reporter=dot` avant et après, `npx shadcn add empty --yes`, `npx prettier --write` sur le périmètre, `npm run typecheck`, `npm run lint`, `npm run build`, suites ciblées puis `npx playwright test`. Les commandes shell ont nécessité l’exécution hors bac à sable à cause de l’erreur environnementale `mountinfo path is not absolute`.
17. **Résultats finaux** : consignés ci-dessous après exécution complète.
18. **Non exécuté** : tests contre un backend réel (`tests-real`), audit manuel avec lecteur d’écran matériel et tests sur appareils physiques. Les tests navigateur utilisent les fixtures MSW existantes. Les captures vérifient le rendu courant, sans comparaison automatique à une baseline graphique approuvée.
19. **Limites** : les modules sites/routeurs/paiements/rapports et graphiques ne sont pas implémentés dans le produit initial ; leur charte est documentée sans créer de faux contrats. Les paramètres restent en lecture seule. La palette chart verte exige labels/motifs pour les futures séries. Les primitives installées gardent certaines variantes compactes internes ; utiliser les compositions documentées pour les pages métier. Les tokens d’origine restent disponibles, même si certains usages (primaire comme texte sombre) sont déconseillés.
20. **Déploiement progressif** : revue de cette charte sur les écrans existants, validation staging avec comptes de permissions différentes, puis adoption des modèles lors de l’ajout des modules WiFi. Garder la galerie exclue de production et reprendre la matrice pour chaque nouveau modèle. Aucun commit ni déploiement effectué.

La logique métier, les contrats HTTP, les règles de permissions et l’isolation multi-organisation n’ont pas été modifiés par cette intervention. Les changements de tests synchronisent explicitement la navigation et contrôlent les nouveaux modèles, sans relâcher les assertions métier.
