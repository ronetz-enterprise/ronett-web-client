# Sélection et changement

La liste complète inclut les appartenances inactives. Zéro item signifie onboarding ; exactement un item accessible permet la sélection automatique ; plusieurs items accessibles exigent un choix. Une liste contenant uniquement des appartenances inactives affiche leurs états, sans les confondre avec zéro appartenance.

Le switcher réutilise le conteneur de sidebar shadcn et un contrôle select natif accessible au clavier. Il affiche les organisations actives, le nom courant et OWNER. Les requêtes restent dans les hooks de feature, pas dans les pages.

La cible doit figurer dans la liste accessible. Le switch annule/supprime le cache tenant précédent et navigue vers le dashboard cible ; le guard revalide alors l’accès sur le serveur. Les données globales ne sont pas vidées. Un lien permet de créer une autre organisation.

Le sélecteur est désactivé pendant une actualisation de liste ou une erreur. Une révocation constatée bloque l’Outlet, nettoie les ressources tenant et propose la sélection d’un autre espace.
