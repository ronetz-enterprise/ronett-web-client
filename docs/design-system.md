# Charte graphique Ronetz

Référence : `src/app/styles/app.css`. Audit préalable : [design-audit.md](design-audit.md). Compositions : [ui-patterns.md](ui-patterns.md). Validation et limites : [design-validation.md](design-validation.md).

## Identité et principes

Ronetz est une console de gestion d’infrastructures WiFi multi-organisations. Son identité repose sur le calme, la précision et le contexte organisationnel toujours visible. Les consoles modernes inspirent la hiérarchie, la densité utile, les actions explicites et les surfaces sobres ; aucune interface propriétaire n’est reproduite.

L’émeraude, les titres Manrope, le monogramme typographique R et les libellés opérationnels distinguent Ronetz. Pas de logo graphique inventé, de gradient, de glassmorphism ni d’illustration marketing. Environ 80 % de surfaces neutres, 15 % de séparations/états, 5 % d’accent : c’est un guide de composition, pas une mesure automatique.

## Couleurs et surfaces

Tous les tokens initiaux restent conservés, y compris graphiques, sidebar, rayons et couleurs fondamentales.

| Token              | Clair                        | Sombre                       | Usage                           |
| ------------------ | ---------------------------- | ---------------------------- | ------------------------------- |
| primary            | `oklch(0.508 0.118 165.612)` | `oklch(0.432 0.095 166.913)` | Action principale, marque       |
| primary-foreground | `oklch(0.979 0.021 166.113)` | identique                    | Texte sur primaire              |
| background         | token existant               | token existant               | Niveau 0 : application          |
| card               | token existant               | token existant               | Niveau 1 : résumé ou ressource  |
| popover            | token existant               | token existant               | Niveau 2 : menus et dialogues   |
| muted / border     | tokens existants             | tokens existants             | Séparations, métadonnées, hover |

Extensions sémantiques (fond / texte) :

| Paire          | Clair                                        | Sombre                                        |
| -------------- | -------------------------------------------- | --------------------------------------------- |
| success        | `oklch(.95 .025 165)` / `oklch(.36 .07 165)` | `oklch(.27 .025 165)` / `oklch(.84 .07 165)`  |
| warning        | `oklch(.96 .035 85)` / `oklch(.4 .08 65)`    | `oklch(.29 .03 85)` / `oklch(.86 .08 85)`     |
| info           | `oklch(.95 .02 250)` / `oklch(.4 .08 250)`   | `oklch(.28 .025 250)` / `oklch(.84 .065 250)` |
| danger         | `oklch(.96 .02 25)` / `oklch(.42 .14 25)`    | `oklch(.27 .035 25)` / `oklch(.84 .07 25)`    |
| control-border | `oklch(.56 0 0)`                             | `oklch(.64 0 0)`                              |
| focus          | `oklch(.45 0 0)`                             | `oklch(.82 0 0)`                              |

Les couleurs sont exposées dans `@theme inline`. `focus` sert directement à l’outline. Les tokens de densité sont hérités dans les deux thèmes : `table-row-standard: 3.25rem`, `table-row-compact: 2.75rem`.

Ces extensions servent des fonctions transversales. Elles ne constituent pas un second thème. `destructive`, `input` et `ring` d’origine ne sont pas remplacés : la variante de bouton destructif et les frontières des contrôles utilisent les nouveaux tokens accessibles. Le bouton destructif initial avait un contraste mesuré par axe de 3,98:1 en clair ; cette correction est explicite.

Ne pas utiliser le primaire sombre comme texte sur le fond sombre. Pour les liens courants, préférer `text-foreground underline` ; pour les statuts, utiliser `StatusBadge`. Ne jamais transmettre une information uniquement par une couleur.

## Typographie, rythme et dimensions

| Rôle               | Police / taille           | Poids et usage                    |
| ------------------ | ------------------------- | --------------------------------- |
| Page               | Manrope, 24 px / text-2xl | 600, un h1 par écran métier       |
| Section            | Manrope, 18 px / text-lg  | 600, h2                           |
| Carte              | Manrope, 14 px            | 600 pour les compositions produit |
| Interface et table | Inter, 14 px              | 400 ; 500 pour labels             |
| Métadonnée         | Inter, 12 px              | muted-foreground                  |
| Valeur             | Inter, 24–30 px           | 600, tabular-nums                 |

Espacements sur grille 4 px : 4 pour relations proches, 8 pour groupes, 12–16 pour contrôles, 16–24 pour surfaces, 24–32 entre sections. Largeurs : données jusqu’à 1536 px, paramètres 896 px, formulaire 560–720 px, authentification 440 px, paragraphes `max-w-prose`.

Rayon global conservé : **0,625rem**. Utiliser les dérivés existants `rounded-md`, `rounded-lg`, `rounded-xl`. Aucun changement global d’ombres ; réserver l’élévation aux éléments flottants, privilégier bordures et séparations pour le contenu.

Standard : lignes de table d’au moins 52 px ; compact : au moins 44 px. Une cellule multiligne peut augmenter cette hauteur. Pas de densité locale arbitraire. Boutons : défaut 40 px, petit 32 px, grand 44 px, icône 40 px ; contrôle tactile au moins 44 px lorsque le pointeur est grossier. Les boutons XS restent réservés aux cas internes sans action critique.

## Iconographie

**Hugeicons conservé.** Le projet n’utilise ni Lucide ni Tabler : primitives et navigation partagent déjà Hugeicons. Tabler apporterait une nouvelle dépendance et une migration sans bénéfice établi. Trait 2, contrôles 16 px, navigation 18–20 px, états vides au plus 24 px. Icônes décoratives masquées aux technologies d’assistance ; bouton icône nommé. Ne pas remplacer les icônes internes des primitives.

## Composants et comportements

Les composants officiels shadcn **Base UI** sont privilégiés. Aucune migration vers Radix : conserver les comportements accessibles de la bibliothèque effectivement installée. Répertoire `shared/ui` pour primitives, `shared/components` pour compositions produit. Seul `Empty` a été téléchargé. Documentation officielle consultée : [catalogue](https://ui.shadcn.com/docs/components), [Sidebar](https://ui.shadcn.com/docs/components/base/sidebar), [Empty](https://ui.shadcn.com/docs/components/base/empty).

| Composant / rôle            | Variantes et dimensions                                             | Quand utiliser / éviter                                                                  | États et mobile                                                                                     | Exemple                                                                                  |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Button : action             | default, secondary, outline, ghost, destructive, link ; 40/32/44 px | Un primaire dominant ; ghost pour menus ; destructive seulement pour destruction         | disabled, focus, mutation ; wrap des groupes, tactile 44 px                                         | `<Button variant="outline">Exporter</Button>`                                            |
| ValidatedForm : saisie      | RHF + Zod, champs verticaux, gap 16                                 | Formulaire simple ; ne pas faire d’un placeholder un label                               | Focus première erreur, verrou anti-double envoi, libellé conservé + indicateur ; une colonne mobile | `<ValidatedForm form={form} onSubmit={save} submitLabel="Enregistrer">…</ValidatedForm>` |
| FormField / PasswordField   | Input 40 px, label 14, aide/erreur liée par ARIA                    | Champ simple / mot de passe ; indiquer « facultatif » dans le label si nécessaire        | invalid, disabled, focus, visibilité du mot de passe ; largeur disponible                           | `<FormField name="name" label="Nom" />`                                                  |
| Select                      | Base UI, 40 px                                                      | Choix fini ; pas une recherche de milliers d’options                                     | Clavier, sélection, disabled ; popup dans viewport                                                  | Voir sélecteur organisation                                                              |
| PageHeader                  | titre, description, statut, breadcrumb et actions                   | Toutes les pages ; pas de paragraphe long                                                | Actions sous titre sur mobile, puis à droite                                                        | `<PageHeader title="Membres" actions={action} />`                                        |
| PageSection                 | h2 18 px, description, actions ; gap 16                             | Séparer un contenu sans carte ; éviter cartes imbriquées                                 | Wrap des actions, largeur fluide                                                                    | `<PageSection title="Activité">…</PageSection>`                                          |
| SummaryCard                 | titre 14, texte 14, padding 16                                      | Résumé stable / ressource ; pas chaque section                                           | Texte à gauche, métadonnées qui se replient                                                         | `<SummaryCard title="Organisation">…</SummaryCard>`                                      |
| MetricCard                  | label 14, valeur 24, contexte 12                                    | Mesure réelle avec période/unité ; jamais inventer de statistiques                       | Une colonne mobile ; grille limitée desktop                                                         | `<MetricCard label="Routeurs" value="12 / 14" context="À l’instant" />`                  |
| DataTable                   | Table officielle, standard/compact, 52/44 px                        | Collection tabulaire ; pas une liste narrative                                           | Scroll horizontal local, caption, nombres à droite, statuts libellés                                | `<DataTable density="compact">…</DataTable>`                                             |
| StatusBadge                 | neutral/info/success/warning/danger/pending ; 24 px, texte 12       | Statut métier ; ne pas remplacer les permissions                                         | Point décoratif + texte ; ne pas tronquer les états                                                 | `<StatusBadge label="Suspendu" tone="warning" />`                                        |
| EmptyState                  | titre, explication, icône et actions optionnelles ; padding 24      | Absence initiale, recherche, configuration ou accès ; pas erreur technique brute         | Wrap des actions ; pas de grande illustration                                                       | `<EmptyState title="Aucun résultat" description="Modifiez vos critères." />`             |
| PageLoading / TableSkeleton | Structure adaptée, gris neutres                                     | Premier chargement ; pas rechargement d’une mutation locale                              | Annonce status, skeletons aria-hidden, reduced motion                                               | `<TableSkeleton />`                                                                      |
| ErrorState / QueryFailure   | Alert destructive, explication et réessai                           | Erreur de page/section ; pas validation d’un champ                                       | Annonce alert ; référence copiable si utile au support                                              | `<QueryFailure error={error} retry={refetch} />`                                         |
| Dialog / AlertDialog        | Tâche courte / confirmation sensible                                | Dialog : ajout d’un membre ; AlertDialog : révocation ; page dédiée pour processus longs | Focus piégé puis restitué, annulation visible, contrôles bloqués en mutation                        | Voir OrganizationMembers                                                                 |
| Sheet                       | Panneau contextuel, sidebar mobile                                  | Navigation/édition contextuelle ; éviter les longs formulaires serrés                    | Fermeture Échap, bouton nommé, focus restauré                                                       | Sidebar officielle                                                                       |
| DropdownMenu / Avatar       | Avatar 32 dans bouton 40, menu 224 px                               | Profil, nom/email, déconnexion ; pas d’entrées inertes                                   | Clavier, focus, disabled pendant logout ; align=end                                                 | NavbarUserMenu                                                                           |
| Breadcrumb / Tooltip        | Texte 12–14, popup court                                            | Contexte ; tooltip en sidebar réduite au focus/survol                                    | Ne pas cacher le seul nom accessible dans le tooltip                                                | NavMain                                                                                  |
| Alert / notifications       | Titre + explication ; actions secondaires                           | Attention requise inline ; notification pour résultat global                             | Annonce pertinente, pas de live-region sur spécimen statique                                        | Voir notifications.tsx                                                                   |

Les autres familles de cartes sont des compositions, pas de nouvelles primitives : Resource = SummaryCard + StatusBadge + lien explicite ; Status = Alert + action ; Onboarding = PageSection + étapes + action ; Summary = SummaryCard. Une carte n’est intégralement cliquable que si un lien unique couvre son intention et reste accessible au clavier.

## Navigation, contexte et sécurité visuelle

Sidebar officielle, marque en haut, navigation nommée, fond actif `sidebar-accent`, contrôle de repli bas toujours accessible, déclencheur navbar conservé. La marque navigue indépendamment du repli. Mode icône : noms accessibles et tooltips, pas de logo déformé. Mobile : Sheet officiel.

Navbar : contexte, organisation active, avatar/menu. Pas de boutons de recherche, notifications ou facturation inertes. Les futures fonctions devront être réellement opérationnelles avant affichage. Un changement d’organisation garde le mécanisme existant de purge du cache et de garde des permissions. Ne jamais conserver les données d’un autre tenant en placeholder.

## États, erreurs et notifications

Premier chargement : skeleton structurel. Rechargement : conserver les données du même tenant et afficher une annonce discrète. Mutation : verrou existant, action désactivée, texte conservé, spinner secondaire. Ne pas déplacer toute la page pour une petite opération.

Différencier « aucune ressource », « aucun résultat », « accès insuffisant », « service non configuré » et « erreur ». Les erreurs de champ restent près du contrôle ; les erreurs de section utilisent Alert ; 403/404/session expirée gardent leurs pages dédiées. Conflit : expliquer l’action corrective via les messages sûrs existants. Aucune stack/SQL/message serveur brut. CorrelationId affiché uniquement pour diagnostic utile avec copie discrète.

Les notifications existantes restent la source des retours globaux. Sonner n’est pas installé faute de besoin dans cette itération. Ne pas cumuler toast et alerte pour le même succès.

## Graphiques

Aucun graphique réel à ce stade : pas de dépendance Chart ajoutée. Les cinq `chart-*` existants sont conservés. Associer chaque série à un nom, unité, période et comparaison ; ne pas dépendre uniquement des nuances vertes. Prévoir labels, motifs/traits distincts, résumé textuel, tableau équivalent et état sans données. Installer Chart officiel uniquement avec un cas métier réel ; pas de diagramme circulaire décoratif.

## Responsive, mouvement et accessibilité

375 px : une colonne, actions repliées, sidebar mobile, table défilante dans son conteneur. 768 px : sidebar desktop ou réduite, formulaires lisibles. 1280/1440 px : données fluides, paramètres/formulaires plafonnés. Vérifier aussi 320 px et texte à 200 %.

Mouvements de 120–200 ms uniquement pour états et overlays, jamais un défilé de cartes. La règle globale `prefers-reduced-motion` existante reste active. Focus visible via token dédié dans les deux thèmes. Conserver labels, hiérarchie de titres, noms accessibles, annulation et restitution du focus. Axe complète mais ne remplace pas les contrôles clavier, de zoom et l’inspection visuelle.

## Règles à ne pas enfreindre

- Ne pas remplacer le thème, les polices, le primaire, le rayon ou les ombres globales.
- Ne pas disperser de classes de couleurs arbitraires dans les pages.
- Ne pas ajouter une bibliothèque UI ou migrer les icônes sans bénéfice démontré.
- Ne pas modifier une primitive profondément pour une page ; composer au-dessus.
- Ne pas inventer des métriques, routes, permissions ou contrats API.
- Ne pas réutiliser les données d’une autre organisation pendant une transition.
- Ne pas publier la galerie interne : route absente du build production, loader protégé en développement.
- Aucun commit ni déploiement implicite.
