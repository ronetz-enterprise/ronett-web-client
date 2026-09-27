# Pages et features

Une page est associée à une route et située dans src/pages. Elle lit les paramètres, orchestre
les hooks et compose l'écran. Elle ne contient ni URL backend ni fetch.
Une feature est une capacité réutilisable : API, types contractuels, query keys, hooks, validation
et composants métier. Elle expose une API publique dans index.ts.

Exemple futur : SiteDetailsPage composera sites, routers, offers, access et accounting.
Ses sections propres restent dans pages/sites/site-details/sections. Les formulaires ou composants
métier réutilisés vont dans la feature correspondante. Les primitives sans métier vont dans shared
(primitives shadcn dans shared/ui).

Aucune page ne se trouvait dans une feature à l'état initial; aucun déplacement de ce type n'a donc
été nécessaire. La page starter home a été remplacée par l'accueil structurel; le dashboard initial
est devenu un layout, et le contenu dashboard réside dans pages/dashboard.
