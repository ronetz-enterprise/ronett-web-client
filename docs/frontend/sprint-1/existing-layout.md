# Layout et design existants

## État initial

`app/routes/dashboard.tsx`, composant Page, contenait SidebarProvider → AppSidebar → SidebarInset,
un header avec SidebarTrigger, Separator et Breadcrumb, puis des blocs squelettes.
Il n'était pas déclaré dans app/routes.ts (seul le starter était routé).
AppSidebar utilisait NavMain, TeamSwitcher, NavProjects et NavUser avec des données shadcn fictives.
Les liens pointaient vers # et l'état actif était fixé en dur.

## Adaptation

Le shell est dans src/app/layouts/app-layout.tsx; AppSidebar, NavMain et TeamSwitcher sont dans
src/app/layouts/sidebar. Les primitives sont déplacées vers src/shared/ui, sans copie concurrente.
Outlet remplace le contenu figé; deux pages placeholder permettent de vérifier la navigation.
Les noms fictifs Acme/shadcn sont remplacés par le contexte UUID et l'indication « Sans session ».
Le sélecteur désactivé prépare le contrat manquant sans inventer des organisations.
NavLink remplace les liens #, fournit aria-current et l'état actif; une navigation mobile ferme le panneau.
Les menus exemple de projets et de profil ne sont pas montés dans le shell (sources conservées dans src/app/layouts/sidebar).

## Responsive et accessibilité

Le hook existant useIsMobile bascule sous 768 px. Desktop : largeur 16rem, état réduit 3rem,
raccourci Ctrl/Cmd+B, rail et trigger. Mobile : Sheet Base UI, largeur 18rem, backdrop, focus capturé
et Escape. Le bouton de fermeture auparavant caché est désormais visible, avec libellé français.
Le trigger expose aria-expanded. SidebarInset est déjà un main : aucun main imbriqué n'est ajouté.
Min-width 0 et textes cassables évitent les débordements à 320 px; lien d'évitement vers le contenu.
Focus visible renforcé et reduced-motion respecté.

## Tokens conservés

- shadcn base-mira, Base UI, Hugeicons, cn et class-variance-authority.
- Fond neutre OKLCH, accent émeraude (primary clair 0.508 / 0.118 / 165.612).
- Inter Variable pour le texte; Manrope Variable pour les titres.
- Radius de base 0.625rem; espacements Tailwind, principalement 4 et 6 unités.
- Bordures neutres; ombres légères des panneaux, shadow-lg des overlays.
- Breakpoints Tailwind existants, md 768 px pour la sidebar.
- Variables dark conservées; ThemeProvider suit le système sans persistance.

Suppression du doublon --font-sans et des styles body contradictoires (white/gray-950 contre tokens).
Suppression du téléchargement Google Fonts redondant : polices locales déjà installées.
Ces changements stabilisent le socle sans refaire la charte.

Le contrôle axe a détecté un contraste 4.49:1 dans le pied mobile : muted-foreground clair passe de L=0.556 à 0.53 pour dépasser 4.5:1.
Le trigger est désactivé jusqu’à l’hydratation pour éviter les clics sans effet sur le HTML SSR.

Primitives installées conservées : avatar, breadcrumb, button, collapsible, dropdown-menu, input, separator, sheet, sidebar, skeleton et tooltip.

## Unification demandée après le sprint

Le dossier app racine a été supprimé. Les primitives, hooks et utilitaire cn ont été déplacés vers src/shared/ui, src/shared/hooks et src/shared/utils/cn.ts. Tous les imports utilisent @/*; components.json configure les futures générations dans src/shared. Le starter Welcome inutilisé et ses logos sont supprimés.
