# Routage

React Router 8.4, Framework Mode et SSR conservés. appDirectory vaut src/app.
routes.ts référence directement les modules de src/pages; les layouts sont dans src/app/layouts.
Le découpage des bundles des routes reste géré automatiquement par le framework.

PublicLayout : header minimal, Outlet et zone d'erreur.
AuthLayout : carte responsive, Outlet et emplacement des futurs formulaires.
AppLayout : shell existant avec SidebarProvider, AppSidebar, SidebarInset, header et Outlet.
PlatformAdminLayout : même shell configurable, navigation et contexte distincts.
Pas de lien d'administration plateforme dans la navigation organisation.

Le root fournit ErrorBoundary et HydrateFallback/AppLoading; useNavigation affiche PageLoading
lors des chargements de routes. Le catch-all émet une vraie réponse HTTP 404 avec un écran dédié.
Les erreurs techniques ne montrent jamais de stack, même en développement.

## Guards provisoires

Aucune session ni permission ne peut être prouvée avec les contrats actuels. Les shells sont donc
des aperçus accessibles explicitement signalés, sans appel métier ni action privilégiée.
Le contrôle UUID du paramètre organisation est une validation de forme, pas un guard d'autorisation.
Le sélecteur est désactivé; aucun endpoint d'organisations ou de permissions n'est inventé.
Avant toute donnée réelle, ajouter session en mémoire et guards fondés sur un contrat backend fiable.
Le serveur demeure responsable de l'autorisation.

Les entrées futures sont désactivées. NavigationItem prévoit un champ permission; le futur adaptateur
de navigation devra filtrer les éléments à partir de permissions confirmées en amont.
Les redirections futures doivent passer par safeRedirect; aucun retour externe arbitraire n'est accepté.
