# Directives de mise en page — console Ronetz

Objectif : une console sobre et dense, du type « console développeur » (référence : platform.openai.com),
**sans toucher au thème**. Ces règles portent uniquement sur la structure, l'espacement et la hiérarchie.
Couleurs, polices, rayons et ombres restent ceux de `src/app/styles/app.css` (voir [charte](design-system.md)).

Toute nouvelle page se construit à partir des **4 gabarits** ci-dessous. Si une page ne rentre dans aucun,
c'est presque toujours qu'elle doit être découpée.

---

## 1. Principes

1. **Une page = un objet ou une liste.** Le titre dit lequel, en un ou deux mots (« Accès Internet », pas « Gestion des accès Internet de votre organisation »).
2. **Le contenu n'est pas dans une carte.** Le fond de page est la surface. Les cartes sont réservées aux éléments _répétés_ (grille de modèles, métriques) ou _autonomes_ (encart d'aide).
3. **Les séparateurs remplacent les boîtes.** Une bordure fine `border-b` sépare l'en-tête du contenu ; pas d'ombre, pas d'encadrement.
4. **Une seule action primaire par écran**, en haut à droite. Tout le reste est `outline` ou `ghost`.
5. **Les onglets naviguent, ils ne cachent pas.** Chaque onglet a une URL.
6. **Densité constante.** Mêmes hauteurs de contrôle (h-8), mêmes espacements, quelle que soit la page.

---

## 2. Échelle — tokens Tailwind (aucune valeur nouvelle)

| Rôle                        | Classe                 | Valeur (thème)  | Usage                                        |
| --------------------------- | ---------------------- | --------------- | -------------------------------------------- |
| Gouttière de page           | `px-4 sm:px-6 lg:px-8` | 16 / 24 / 32 px | Bord gauche/droit de tout contenu            |
| Espace en-tête → contenu    | `pt-6`                 | 24 px           | Sous la barre d'onglets ou le séparateur     |
| Entre sections              | `space-y-10`           | 40 px           | Sections d'une même page                     |
| Titre de section → contenu  | `space-y-4`            | 16 px           | Dans une `PageSection`                       |
| Entre contrôles d'une barre | `gap-2`                | 8 px            | Recherche, filtres, boutons                  |
| Hauteur de contrôle         | `h-8`                  | 32 px           | Input, Button `sm`, Select de barre d'outils |
| Hauteur de ligne de tableau | `h-11`                 | 44 px           | Lignes `TableRow` (cible tactile)            |

**Typographie (polices du thème) :**

| Niveau                    | Classe                                              | Usage                               |
| ------------------------- | --------------------------------------------------- | ----------------------------------- |
| Titre de page             | `font-heading text-xl font-semibold tracking-tight` | `PageHeader`                        |
| Titre de section          | `font-heading text-base font-semibold`              | « Templates », « Activité récente » |
| Étiquette de section menu | `text-xs font-medium text-muted-foreground`         | Groupes de la sidebar               |
| Corps                     | `text-sm`                                           | Texte, cellules, onglets            |
| Méta / aide               | `text-xs text-muted-foreground`                     | Descriptions, compteurs, dates      |
| Valeur clé                | `text-2xl font-semibold tabular-nums`               | Métriques                           |
| Identifiant technique     | `font-mono text-xs`                                 | UUID, référence, `trf_…`            |

> Le titre de page passe de `text-2xl` à `text-xl` : dans une console dense, c'est l'onglet actif et le contenu qui doivent attirer l'œil, pas le titre.

---

## 3. Coque de l'application

```
┌───────────────┬──────────────────────────────────────────────────────────┐
│ [Org ▾]   [⊟] │ Titre                                   [Secondaire] [Primaire ▾] │
│ [🔍 Rechercher]│ Onglet · Onglet · Onglet                                  │
│               │──────────────────────────────────────────────────────────│ border-b
│ Tableau de bord│                                                          │
│               │  contenu (gabarit)                                        │
│ EXPLOITATION  │                                                          │
│  Sites        │                                                          │
│  Routeurs     │                                                          │
│  Offres       │                                                          │
│  Accès        │                                                          │
│  Consommation │                                                          │
│ ORGANISATION  │                                                          │
│  Membres      │                                                          │
│  Paramètres   │                                                          │
│               │                                                          │
│ [encart]      │                                                          │
│ (●) Utilisateur│                                                         │
└───────────────┴──────────────────────────────────────────────────────────┘
```

### Sidebar (`AppSidebar`)

- Largeur : celle du composant `Sidebar` actuel (ne pas la modifier).
- **Haut** : sélecteur d'organisation (`TeamSwitcher`) + bouton replier ; dessous, recherche globale `h-8` avec raccourci `Ctrl K` en `kbd` (`text-xs text-muted-foreground`) — à ajouter quand la recherche existe, pas avant.
- **Corps** : `SidebarGroup` + `SidebarGroupLabel` pour chaque section. Entrées : icône 16 px + libellé `text-sm`. Élément actif : `isActive` du composant (fond `sidebar-accent`), jamais une couleur ad hoc.
- **Badge « Nouveau »** : `Badge variant="secondary"` aligné à droite, une seule entrée à la fois, retiré après un sprint.
- **Bas** : encart contextuel facultatif (carte `border bg-card p-3`, titre `text-sm font-medium`, texte `text-xs`, bouton `sm`, fermable), puis menu utilisateur.
- Ordre des sections : **Exploitation** puis **Organisation**. Une entrée n'apparaît que si l'utilisateur peut l'ouvrir.

### Zone de contenu

- Pleine largeur, **sans `max-w` par page**. Seuls les formulaires et paramètres limitent leur colonne (`max-w-2xl`).
- Le défilement est celui de la zone de contenu ; la sidebar reste fixe.

---

## 4. En-tête de page (`PageHeader`)

```
px-8 pt-6
Titre                                  [outline ⬈][primaire + ▾]   ← ligne 1, items-center
Onglet  Onglet  Onglet                                             ← ligne 2 (si onglets)
──────────────────────────────────────────────────────────────────  ← border-b pleine largeur
```

| Élément           | Règle                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Conteneur         | `border-b px-4 sm:px-6 lg:px-8 pt-6` ; `pb-0` si onglets (le soulignement touche la bordure), sinon `pb-4`                |
| Ligne 1           | `flex items-center justify-between gap-4 min-h-8`                                                                         |
| Titre             | une ligne, `truncate` ; pas de description sous le titre (la mettre dans un état vide ou une aide)                        |
| Actions           | à droite, `gap-2`, ordre : icône (`ghost` `size-8`) → secondaires (`outline` `sm`) → primaire (`default` `sm`) en dernier |
| Lien externe      | icône `↗` en `data-icon="inline-end"` (ex. « Documentation ↗ »)                                                           |
| Statut de l'objet | `StatusBadge` juste après le titre, même ligne                                                                            |
| Fil d'Ariane      | uniquement en page de détail (niveau 2+), **au-dessus** du titre, `text-xs`                                               |

---

## 5. Onglets de page

Composant : `Tabs` + `TabsList variant="line"` (déjà dans le thème).

| Règle      | Détail                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Position   | Dans l'en-tête, sous le titre, collés à la `border-b`                                                                                                                   |
| Style      | `gap-6`, déclencheurs `px-0 pb-3 text-sm`, soulignement = `after` du composant (ne pas recolorer)                                                                       |
| Pilotage   | **Toujours par l'URL** : chemin (`/sites/:id/settings`) pour une vue distincte, `?tab=` pour une variante de liste. `value` dérive de la route, `onValueChange` navigue |
| Nombre     | 2 à 7. Un seul onglet ⇒ pas d'onglet                                                                                                                                    |
| Contenu    | Onglets **parallèles** de même niveau (Informations / Routeurs / Offres / Paramètres). « Paramètres » est toujours le dernier                                           |
| Badge      | `Badge variant="secondary"` compact après le libellé, pour « Nouveau » ou un compteur                                                                                   |
| Permission | Un onglet interdit est **masqué**, pas désactivé                                                                                                                        |

**Onglets secondaires dans le contenu** (ex. « API capabilities / Spend categories » dans une section) : même composant `variant="line"`, posés sur une `border-b` de section, état dans l'URL (`?view=`).

---

## 6. Les quatre gabarits

### A. Liste (ex. API keys, Logs → Accès, Routeurs, Membres)

```
[PageHeader + onglets éventuels]
px-8 pt-4
[🔍 Rechercher…  w-64][+ Filtre][N résultats]                 ← barre d'outils
─────────────────────────────────────────────────────────────
Nom        Statut   Référence     Créé le     …          [✎][🗑]  ← en-tête bg-muted/50 text-xs
Ligne…                                                         ← h-11, border-b
```

- **Barre d'outils** : `flex items-center gap-2`. Recherche `Input h-8 w-64` avec icône ; « + Filtre » en `Button outline sm` qui ouvre un `Popover` ; compteur `text-sm text-muted-foreground` (« 2 résultats »). Filtres actifs = puces `Badge outline` avec ✕.
- **Tableau** : `DataTable` **hors carte**, pleine largeur, collé aux gouttières. En-tête `text-xs font-medium text-muted-foreground bg-muted/50`. Pas de bordure verticale.
- **Colonnes** : identifiant principal (lien `font-medium`) en premier ; statut en 2e ; identifiants techniques en `font-mono text-xs` ; dates en `text-sm` format court (« 15 avr. 2026 ») ; actions à droite.
- **Actions de ligne** : icônes `ghost size-8` avec `aria-label`, visibles en permanence (pas au survol) ; destructive en `text-destructive`. Plus de 2 actions ⇒ menu `⋯`.
- **Pagination** : en bas à droite, seulement si l'API est paginée.

### B. Vue d'ensemble / tableau de bord (ex. Usage)

```
[Alert dismissible pleine largeur]                      ← information système, facultative
Titre                 [Filtre ▾][Filtre ×][📅 Période ▾][↻][⤓]
────────────────────────────────────────────────┬───────────────
Métrique principale            [Grouper ▾][1j]  │ Résumé
Graphique / état vide                           │ Valeur
                                                │───────────────
────────────────────────────────────────────────│ Valeur + sparkline
Onglet · Onglet · Onglet                        │ Onglet · Onglet
[carte][carte]                                  │ liste
[carte][carte]                                  │
```

- Filtres globaux **dans la ligne du titre**, à droite (`Select`/`Button outline sm`), suivis des icônes rafraîchir et exporter.
- Grille `lg:grid-cols-[1fr_320px]`, séparation par `border-l` (pas de carte autour de la colonne).
- Colonne latérale : empilement de métriques séparées par `border-b`, chacune `p-4` : libellé `text-sm`, valeur `text-2xl font-semibold tabular-nums`, visuel facultatif.
- Bloc principal : métrique en tête (libellé `text-sm` + valeur `text-2xl`), puis graphique ; l'état vide occupe la même hauteur que le graphique.
- Détail par catégorie : onglets secondaires + grille `md:grid-cols-2 gap-4` de cartes `border rounded-lg p-4` ; titre de carte = lien `text-sm font-medium` avec chevron `›`.

### C. Accueil de fonctionnalité / démarrage (ex. Agents)

```
Titre                                          [Documentation][Créer ▾]
Onglet · Onglet · Onglet
────────────────────────────────────────────────────────────
Section : « Bien démarrer »
[Carte action +][Carte vide]  │ Étapes (liste numérotée)   [✕]
[Carte vide   ][Carte vide]   │
Section : « Modèles »
[carte][carte][carte][carte][carte]                         ← grid auto-fill, minmax(220px,1fr)
```

- Cartes d'action : `border rounded-lg p-4 min-h-28`, icône dans un carré `size-8 rounded-md bg-primary text-primary-foreground`, titre `text-sm font-medium`, description `text-xs text-muted-foreground line-clamp-2`. **Toute la carte est un lien** (`<Link>`), avec `hover:bg-muted/50`.
- Emplacements vides : `border border-dashed bg-muted/30` — uniquement pour suggérer « vous en aurez plusieurs », jamais pour remplir.
- Encart d'étapes : liste à puces fines (`border-l` + point), titre `text-sm font-medium` + `text-sm text-muted-foreground`, fermable et mémorisé (`localStorage`).

### D. Détail d'un objet (site, routeur, offre, accès)

```
Sites › Douala Centre                                     ← fil d'Ariane text-xs
Douala Centre [Actif]                   [Action secondaire][Action primaire]
Informations · Routeurs · Offres · Paramètres
────────────────────────────────────────────────────────────
Section
Libellé       Valeur                                    ← <dl> grid-cols-[180px_1fr], lignes border-b py-3
Libellé       Valeur
Section
…
```

- Pas de carte autour des informations : liste de définitions en lignes séparées.
- L'onglet **Paramètres** contient les formulaires (`max-w-2xl`), la zone destructive en dernier, séparée par `border-t pt-6`.
- Les listes liées (routeurs d'un site) réutilisent le gabarit A, sans re-titre.

---

## 7. États (identiques partout)

| État                 | Rendu                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chargement initial   | Squelettes **à la forme du contenu** (lignes de tableau h-11, métriques) ; jamais de spinner pleine page                                                                               |
| Rechargement         | Contenu conservé + indicateur discret (bouton ↻ en rotation, `aria-busy`)                                                                                                              |
| Vide (aucune donnée) | Centré dans la zone : icône `size-8` dans un carré `rounded-md border`, titre `text-sm font-medium`, une phrase `text-sm text-muted-foreground`, lien ou action (« En savoir plus → ») |
| Vide (filtre)        | Même rendu, texte « Aucun résultat pour ces filtres » + « Effacer les filtres »                                                                                                        |
| Erreur               | `Alert variant="destructive"` sous la barre d'outils, avec `correlationId` et « Réessayer » ; le reste de la page reste utilisable                                                     |
| Information système  | `Alert` pleine largeur au-dessus du titre, fermable, mémorisée                                                                                                                         |
| Interdit             | Entrée de menu / onglet masqué ; accès direct ⇒ page 403 du shell                                                                                                                      |

---

## 8. Interactions

| Élément                   | Comportement                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Ligne de tableau          | Survol `hover:bg-muted/50` ; le nom est le seul lien (pas de ligne entière cliquable quand la ligne a des actions) |
| Bouton primaire avec menu | `ButtonGroup` : action + chevron `DropdownMenu` (« Créer ▾ »)                                                      |
| Filtres, onglets, période | Écrits dans l'URL ; Retour et partage de lien restaurent la vue                                                    |
| Action destructive        | `AlertDialog` nommant l'objet et la conséquence                                                                    |
| Transitions               | Celles du composant uniquement (≤ 150 ms) ; respecter `prefers-reduced-motion`                                     |

---

## 9. Responsive

| Largeur     | Changement                                                                                                                                                                                                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ≥ 1024 px   | Gabarits complets ; colonne latérale de B visible                                                                                                                                                                                                                                                                       |
| 768–1023 px | Colonne latérale de B passe **sous** le contenu ; grilles 2 colonnes                                                                                                                                                                                                                                                    |
| < 768 px    | Sidebar en `Sheet` (déclencheur dans l'en-tête mobile) ; actions secondaires dans un menu `⋯` ; onglets défilent horizontalement (`overflow-x-auto`, pas de retour à la ligne) ; tableau défile horizontalement dans son conteneur, première colonne figée ; barre d'outils : recherche pleine largeur, filtres dessous |

---

## 10. Contenu

- Titres et libellés : **casse de phrase** (« Créer un accès », pas « Créer Un Accès »).
- Noms : `truncate` avec `title` complet ; identifiants techniques jamais tronqués au milieu (retour à la ligne `break-all`).
- Montants : `Intl.NumberFormat("fr-FR")` + devise ; dates courtes, heure seulement si utile.
- Jamais de libellé brut d'API (`OWNER`, `ACTIVE`) : toujours via les dictionnaires de libellés.
- Jamais de texte « disponible dans un prochain sprint » : ne pas afficher la page.

---

## 11. Accessibilité

- Ordre de focus : sidebar → titre (h1) → actions d'en-tête → onglets → barre d'outils → contenu.
- Onglets : `role="tablist"` du composant ; flèches gauche/droite ; l'onglet actif porte `aria-selected`.
- Actions icône : `aria-label` nommant l'objet (« Supprimer la clé jkl »).
- Compteur de résultats et rechargement : `role="status"` (annonce non intrusive).
- Cibles tactiles ≥ 44 px sur mobile (lignes h-11, boutons icône `size-8` + zone de clic étendue).

---

## 12. Recette d'une nouvelle page

1. Choisir le gabarit (A, B, C ou D).
2. Ajouter la route et, si c'est une section principale, l'entrée de sidebar dans le bon groupe.
3. `PageHeader` : titre court, actions dans l'ordre, onglets pilotés par l'URL.
4. Contenu sans carte englobante, gouttières du shell.
5. Les 5 états de la section 7.
6. Vérifier clair/sombre à 375 / 768 / 1280 px, clavier, et l'absence de libellé brut.

## Écarts avec [ui-patterns.md](ui-patterns.md)

Ces directives **remplacent** : la limite de largeur par page (§3), le titre `text-2xl` (§2), les tableaux dans une carte (§6A) et la règle « paramètres dans la sidebar seulement » (les paramètres d'un objet sont un onglet, §6D). Le reste de `ui-patterns.md` reste valable.
