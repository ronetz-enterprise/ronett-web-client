# Audit Ronetz — 28 septembre 2026

Audit du workspace existant avant intervention : nombreux changements non commités préservés. React 19, React Router Framework 8, Tailwind 4, shadcn `base-mira`, Base UI et Hugeicons. Aucun AGENTS.md trouvé. Les 162 tests unitaires initiaux passent.

| Élément                       | État actuel                                   | Incohérence                                               | Modèle cible                                  | Action                                                  |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Fondations : thème            | OKLCH, émeraude, deux thèmes                  | Statuts utilisant emerald/amber/red fixes                 | Extensions sémantiques clair/sombre           | Conserver tous les tokens initiaux, ajouter les statuts |
| Fondations : texte            | Inter / Manrope                               | Corps 12–16 px selon les primitives                       | Corps 14 px, titres 24/18/14 px               | Compositions produit, sans nouveau preset               |
| Fondations : densité          | Espacements locaux                            | Tables sans convention de hauteur                         | Standard 52 px, compacte 44 px                | Wrapper de table partagé                                |
| Composants : shadcn           | 20 primitives officielles Base UI             | Empty absent                                              | Priorité au registre officiel                 | Ajouter uniquement Empty                                |
| Composants : icônes           | Hugeicons partout                             | Icône Settings répétée                                    | Une bibliothèque, trait 2                     | Conserver Hugeicons ; pas de migration Tabler/Lucide    |
| Composants : badges           | Badge + span personnalisé                     | Couleurs fixes sans adaptation sombre                     | Badge composé avec tokens                     | Centraliser les tons et le mapping métier               |
| Composants : formulaires      | RHF, Zod, labels, focus, verrou de soumission | Libellé remplacé en mutation, erreurs peu structurées     | Bouton stable et alerte                       | Préserver validations et comportement métier            |
| Composants : chargement       | Paragraphe ou deux skeletons                  | Structure trop générique                                  | Page, table et mutation                       | Ajouter skeleton de table, rechargement discret         |
| Modèles : en-tête             | Titre et description                          | Pas d’actions ni breadcrumb                               | PageHeader composable                         | Étendre sans casser les usages                          |
| Modèles : authentification    | Carte centrée max-w-md                        | Marque éloignée, CTA étroit                               | Bloc calme 440 px                             | Harmoniser le layout commun                             |
| Modèles : dashboard           | Cartes de prochains sprints                   | Pas de hiérarchie opérationnelle                          | Contexte, disponibilité, activité             | Ne pas inventer de statistiques                         |
| Modèles : membres             | Table shadcn, filtres URL                     | Carte vide imbriquée, texte technique dominant            | Toolbar, table, résultat/absence distincts    | Conserver filtrage local et API non paginée             |
| Modèles : détail / paramètres | Textes puis carte                             | Hiérarchie et largeurs hétérogènes                        | Résumé et sections max 896 px                 | Composer les modèles partagés                           |
| UX : shell                    | Sidebar officielle responsive                 | Header vide, compte dupliqué, repli caché en mode icône   | Marque séparée, compte dans navbar            | Garder déclencheur accessible dans les deux états       |
| UX : menu utilisateur         | Avatar et dropdown                            | Plusieurs entrées sans action                             | Nom, email, profil, déconnexion               | Retirer les commandes inertes                           |
| UX : multi-tenant             | Garde et purge cache existantes               | État de transition peu visible                            | Contexte et annonce de navigation             | Préserver intégralement garde, permissions et cache     |
| UX : accessibilité            | Skip link, reduced motion, primitives         | Focus primaire sombre à mesurer, contrôles peu contrastés | Focus visible et correction locale documentée | Axe, clavier, contrastes et captures                    |
| UX : référence                | /__dev/socle protégé hors production          | Uniquement outils techniques                              | Galerie du système dans la même route         | Ne pas ajouter Storybook                                |

## Direction avant application

Console neutre, compacte et lisible, avec environ 80 % de surfaces neutres, 15 % de séparations/états et 5 % d’accent. Émeraude strictement conservé pour les actions et la marque. Identité Ronetz par la composition, Manrope, le contexte organisationnel et les statuts explicites. Aucun graphique décoratif ni statistique fictive.

Les composants installés reposent sur Base UI, et non Radix. Préserver leur gestion accessible du focus, des menus et dialogs évite une migration inutile. Le registre officiel shadcn confirme l’existence des variantes Base UI : https://ui.shadcn.com/docs/components/base/sidebar et https://ui.shadcn.com/docs/components/base/empty.

Les listes actuelles retournent une collection complète. TanStack Table et une pagination serveur ne sont pas nécessaires à ce contrat : le modèle partagé reste composé sur Table shadcn. Les modules WiFi, paiements et rapports non implémentés reçoivent des conventions documentées, pas des features fictives.
