# Design system Ronetz — « console »

Référence technique : `src/app/styles/app.css` (tokens), `src/shared/ui` (primitives), `src/shared/components` (compositions). Compositions détaillées : [ui-patterns.md](ui-patterns.md).

## Inspiration et intention

Le système s'inspire des consoles développeur de **xAI**, **OpenAI Platform** et **Supabase**. Ce qu'elles ont en commun, et que Ronetz reprend :

| Observé dans les références                                                          | Règle Ronetz                                                                   |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Fond blanc franc, gris neutres sans teinte, presque aucune couleur                   | Interface neutre ; l'émeraude est la seule couleur vive                        |
| Une seule famille de police, hiérarchie par le poids et la taille                    | Geist partout, titres en semibold avec un léger resserrement                   |
| Barre latérale gris clair, entrées de 36 px, entrée active en pastille grise         | Gris très clair teinté d’émeraude ; entrée active en pastille émeraude pâle    |
| Sélecteur d'équipe/projet en tête de barre (xAI, OpenAI)                             | Sélecteur d'organisation en tête de barre, compte en pied                      |
| Titre et action principale tout en haut, séparés du contenu par un trait fin         | `PageHeader` : barre pleine largeur, collée en haut, trait bas                 |
| Onglets soulignés posés sur un trait (OpenAI, Supabase) ou pastilles (xAI)           | `TabsList variant="line"` pour les sous-pages, pastilles pour basculer une vue |
| Barre d'outils : recherche, filtre, compteur, sur une ligne                          | `DataToolbar` / barre de la liste des sites                                    |
| Tableaux : en-tête gris clair, libellés gris 13 px, lignes séparées par un trait fin | Primitive `Table`                                                              |
| Cartes : trait fin (OpenAI) ou fond gris chaud sans trait (xAI)                      | `Card` et `Card variant="surface"`                                             |
| États vides centrés : petite icône dans un carré gris, titre, phrase, un bouton      | `Empty` / `EmptyState`                                                         |
| Bandeaux teintés pâles, arrondis, avec icône et action à droite                      | `Alert` (variants `info`, `success`, `warning`, `destructive`)                 |
| Icônes au trait fin                                                                  | Hugeicons, trait 1,75                                                          |
| Pages denses en pleine largeur (Usage d'OpenAI), pages courtes centrées (xAI)        | Largeur déclarée par la page : `wide` (défaut) ou `narrow` (colonne centrée)   |

Ce qui distingue Ronetz : l'**émeraude** (boutons principaux, marque, focus, graphiques), le monogramme **R**, et les **teintes d'avatar** qui donnent une identité stable à chaque organisation et à chaque site.

## Couleurs

Toutes les couleurs sont des tokens dans `app.css`, déclarés en clair et en sombre, exposés dans `@theme inline`. Aucune couleur en dur dans les pages : `npm run lint` le vérifie.

| Rôle                  | Tokens                                                                    | Usage                                                                           |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Fond                  | `background`, `card`, `popover`                                           | Blanc franc ; niveaux 0, 1 et 2                                                 |
| Surface remplie       | `surface`, `surface-foreground`                                           | Bloc mis en avant sans trait (offre, bandeau, information)                      |
| Texte                 | `foreground`, `muted-foreground`                                          | Encre presque noire ; gris pour descriptions, en-têtes de colonnes, métadonnées |
| Neutres d'interaction | `muted`, `secondary`, `accent`                                            | Survol, pastille active, bouton secondaire plein                                |
| Traits                | `border`, `control-border`, `control-border-hover`                        | Un seul trait, très clair ; un peu plus marqué sur les champs                   |
| Action principale     | `primary` (émeraude), `primary-foreground`                                | Un seul bouton plein par zone ; logo ; focus                                    |
| Marque                | `brand` (= `primary`)                                                     | Monogramme, éléments d'identité                                                 |
| États                 | `success`, `warning`, `info`, `danger` (+ `-foreground`, `danger-border`) | Fond pâle + texte foncé de même teinte                                          |
| Accents ponctuels     | `brand-highlight` (orangé), `brand-secondary` (indigo)                    | Badge « Nouveau / Bêta », indicateurs partiels                                  |
| Avatars               | `tint-1` … `tint-6` (+ `-foreground`)                                     | Initiales d'organisation/site, teinte stable par identifiant (`tintFor`)        |
| Données               | `chart-1` … `chart-5`                                                     | Rampe émeraude des graphiques                                                   |
| Barre latérale        | `sidebar`, `sidebar-accent`, `sidebar-active`, `sidebar-border`           | Gris clair teinté d’émeraude ; survol neutre, entrée active émeraude pâle       |

Répartition visée : environ 90 % de neutres, 5 % d'états, 5 % d'émeraude et d'accents.

## Typographie

Une seule famille : **Geist** (`font-sans` et `font-heading`), paquet `@fontsource-variable/geist`. Code et identifiants : **Geist Mono** (`font-mono`). Inter n'est plus utilisée.

| Rôle                                      | Classe                                       | Rendu |
| ----------------------------------------- | -------------------------------------------- | ----- |
| Titre de page (h1)                        | `text-2xl font-semibold tracking-tight`      | 24 px |
| Section (h2)                              | `text-lg font-semibold tracking-tight`       | 18 px |
| Titre de carte / état vide                | `text-base font-semibold`                    | 16 px |
| Corps, champs, boutons, tableaux          | `text-sm`                                    | 15 px |
| Métadonnées, en-têtes de colonnes, badges | `text-xs`                                    | 13 px |
| Chiffre clé                               | `text-[1.625rem] font-semibold tabular-nums` | 26 px |

## Espacement, rayons, élévation

- Grille de 4 px. Entre sections : 32 px (`space-y-8`) ; entre en-tête et contenu : 24 px ; dans une carte : 20 px.
- Largeur de page : **centrée seulement quand le contenu est court**, jamais systématiquement.
  - `wide` (défaut) : toute la largeur disponible. Listes, tableaux, finances, tableau de bord, pages à onglets.
  - `narrow` : colonne centrée de 48 rem. Formulaires de création et autres pages au contenu court.
  - Une page la déclare dans son module de route : `export const handle = { width: "narrow" } satisfies PageHandle;` (`src/shared/hooks/use-page-width.ts`).
  - Les pages à onglets gardent la même largeur d'un onglet à l'autre, pour que l'en-tête ne saute pas.
- Marges 16 / 24 / 40 px selon la largeur, 40 px en haut sur desktop.
- Rayons : `rounded-lg` (10 px) pour boutons, champs, entrées de menu ; `rounded-xl` (14 px) pour cartes, tableaux, bandeaux, menus ; `rounded-full` pour pastilles, badges, avatars ronds.
- Élévation : aucune ombre sur le contenu, sauf `shadow-xs` sur boutons et champs. `shadow-elevated` est réservée aux menus, dialogues et à la carte d'authentification.

## Composants

| Composant                       | Spécification                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Button**                      | 36 px (`default`), 32 px (`sm`), 40 px (`lg`) ; icône 36 / 32 / 24 px. `default` émeraude, `outline` blanc avec trait, `secondary` gris plein, `ghost`, `destructive` (fond danger pâle), `link`. Anneau de focus émeraude à 20 %.                                                                                                                                       |
| **Input / Select / InputGroup** | 36 px, `rounded-lg`, trait `control-border`, fond blanc ; au focus, trait émeraude et halo de 3 px à 15 %. Icône de recherche à gauche dans un `InputGroup`.                                                                                                                                                                                                             |
| **Badge**                       | 22 px, `rounded-full`, 13 px. `default` émeraude pâle, `secondary` gris, `outline`, `new` (contour orangé, pour « Nouveau » / « Bêta »).                                                                                                                                                                                                                                 |
| **StatusBadge**                 | Pastille teintée avec point : `success`, `warning`, `info`, `danger`, `neutral`, `pending`.                                                                                                                                                                                                                                                                              |
| **Tabs**                        | `default` : pastilles, l'active en gris. `line` : onglets soulignés (trait de 2 px couleur encre) posés sur la bordure basse.                                                                                                                                                                                                                                            |
| **Table**                       | En-tête `bg-muted/60`, libellés 13 px gris ; cellules `px-4 py-3` ; lignes séparées par un trait à 70 % ; survol gris très léger. `DataTable` : `card` (défaut, cadre arrondi), `bleed` (bord à bord, Finances, Consommation et Routeurs), `flush` (sans cadre, dans une colonne déjà collée aux bords).                                                                 |
| **Card**                        | `rounded-xl`, trait fin, padding 20 px. `variant="surface"` : fond gris chaud sans trait.                                                                                                                                                                                                                                                                                |
| **Alert**                       | `rounded-xl`, 16 × 12 px, icône 16 px ; `default` (surface), `info`, `success`, `warning`, `destructive`. Action alignée à droite.                                                                                                                                                                                                                                       |
| **Empty / EmptyState**          | Centré, icône 20 px dans un carré gris de 40 px avec trait, titre 16 px, phrase grise, un bouton. Sans cadre en pointillés.                                                                                                                                                                                                                                              |
| **IconTile**                    | Carré gris neutre, icône en encre adoucie (plus de teinte verte).                                                                                                                                                                                                                                                                                                        |
| **StatTile / MetricCard**       | Libellé gris 15 px, chiffre 26 px semibold, contexte 13 px ; carte entière cliquable si `to`.                                                                                                                                                                                                                                                                            |
| **Stepper**                     | Composant maison (shadcn/ui n’en fournit pas), `src/shared/components/stepper.tsx`. Étapes en colonne : pastille de 24 px numérotée, cochée et émeraude une fois franchie, cerclée émeraude pour l’étape courante (spinner si l’opération tourne), rouge pâle en échec ; trait vertical plein jusqu’à l’étape courante. `Timeline` reste réservée aux historiques datés. |
| **DropdownMenu**                | `rounded-xl`, `shadow-elevated`, entrées de 32 px, icônes grises de 16 px.                                                                                                                                                                                                                                                                                               |
| **Sidebar**                     | Largeur 15,5 rem, fond `sidebar`, trait à droite. En tête : monogramme + nom, déclencheur de repli, sélecteur d'organisation. Entrées de 36 px, icône 16 px, groupes séparés par un simple espace, sans libellé. Pied : compte (nom, email).                                                                                                                             |

## Gabarits de page

**En-tête (toutes les pages de la console)** : barre tout en haut, sur toute la largeur de la zone de contenu, gouttière `--page-gutter` (16 px, 24 px dès `sm`), séparée du contenu par un trait fin, **fixe au défilement** (`sticky`, fond opaque). Titre 20 px à gauche, actions à droite (« Actualiser » en icône, puis l'action principale émeraude). Pas de description. Des onglets d'en-tête reposent directement sur le trait.

**Liste** (Sites, Membres, Accès), en pleine largeur

1. Barre d'outils : filtres (pastilles ou « + Filtre »), recherche, compteur.
2. Tableau dans un cadre arrondi ; la première colonne porte l'avatar teinté, le nom (lien) et une ligne de contexte grise.
3. Pagination : « Par page » à gauche, « Précédent / n / Suivant » à droite.

**Liste bord à bord** (Routeurs, grille de données inspirée de « Users » de Supabase) : même en-tête et même barre d’outils (`DataToolbar` : recherche, « Filtre », pastilles, compteur), plus à droite un choix des colonnes affichées (mémorisé dans le navigateur) et un tri. Tableau `page-bleed` à traits verticaux entre colonnes, une valeur brute par colonne, défilement horizontal sans barre visible (`scrollbar-none`, zone focalisable au clavier), pied « Total : N » avec la pagination.

**Détail / paramètres** : `PageHeader` avec `tabs={<DetailTabs … />}` (onglets soulignés), puis sections `PageSection` ; formulaires en une colonne de 560 à 720 px, libellé au-dessus, aide grise en dessous.

**Détail en paramètres** (Routeur) : même gabarit que les paramètres d’organisation ci-dessous. `PageHeader` avec fil d’Ariane, nom et statut, onglets « État » et « Paramètres » pilotés par l’URL ; contenu aligné à gauche (48 rem), sections sans cadre, champs empilés (`SettingField`, `ReadOnlyValue`), nom modifiable sur place avec « Enregistrer » secondaire actif après modification ; seule la liste des actions de gestion est encadrée (`SettingsCard` + `SettingsActionRow`). Pour se repérer : `SettingsBody` sépare les sections par un trait et chaque section a une phrase d’explication (pas de sommaire, retiré à la demande). La mise en service tient en une seule section : le stepper en cinq étapes et, sous l’étape en cours, un encadré de ce qu’il reste à faire (`Step.detail`). Le site suit le même gabarit avec trois onglets (Vue d’ensemble, Offres, Paramètres) : ses routeurs et ses accès ne sont pas des onglets, la bande « En bref » renvoie vers les listes globales filtrées (`?site=`), pour garder une seule liste par type d’objet.

**Paramètres d’organisation** (modèle « Organization settings » d’OpenAI) : sous `/settings`, la barre latérale bascule sur les seules sections des paramètres (Général, Membres), présentées comme des onglets, avec « Retour à l’espace » à la place de la marque et du sélecteur d’organisation. La page garde le `PageHeader` (titre seul), puis un contenu aligné à gauche : sections empilées sans cadre, champs empilés (`SettingField` : libellé, aide, contrôle de 24 rem), valeurs en lecture seule dans un cadre de champ (`ReadOnlyValue`).

**Tableau de bord** : bandeaux `Alert` en tête, puis rangée de `StatTile`, puis graphiques dans des cartes.

**Liste bord à bord avec panneau** (Accès Internet) : comme Finances, aucune carte arrondie, tout est collé sous l’en-tête et aux bords, blocs séparés par des traits : bande de compteurs (`MetricBlock`, séparés par des traits verticaux), bande de recherche et filtres (`DataToolbar`), tableau comme celui des routeurs mais sans traits verticaux, pied « Total ». Le détail d’une ligne ne change pas de page : il s’ouvre dans un panneau qui sort de la droite et pousse la recherche et la liste, jamais la bande de compteurs (`?access=…` dans l’URL, Échap ou ✕ pour fermer, le focus revient à la ligne) ; son contenu est réparti en onglets soulignés (État, Conditions, Origine, Gestion si une action est possible) ; sur téléphone, le panneau passe en plein écran.

**Analyse bord à bord** (Finances et Consommation, modèle « Usage » d'OpenAI) : aucune carte arrondie, uniquement des traits. Briques communes dans `src/shared/components/analytics-band.tsx` (`MetricBlock`, `PeriodDelta`, `SplitBar`, `SideColumnHeader`) ; chaque page garde son propre contenu (choix de métrique pour Finances ; site, période personnalisée et onglets « Par routeur / Par site » pour Consommation).

1. En-tête avec, à droite, la période (`Select` avec icône calendrier), « Actualiser » en icône et l'action principale.
2. Zone `page-bleed` collée sous le trait de l'en-tête : bandeau éventuel (refermable) sur sa propre bande.
3. Bande d'analyse : à gauche le montant de la période, son évolution, la courbe et un choix de métrique en pastilles ; à droite une colonne de 20 rem séparée par `border-l`, blocs séparés par `divide-y`.
4. Bande du bas : barre d'onglets soulignés et tableau `flush` à gauche ; à droite, dans la même colonne (le trait vertical est continu), le contexte (dernier retrait) sous un titre de même hauteur que la barre d'onglets.

**Authentification** : fond blanc, carte flottante (`shadow-elevated`) à droite sur desktop ; pages de compte (choix d'organisation, onboarding) : même carte, centrée.

## Iconographie

Hugeicons, trait **1,75** partout. 16 px dans les contrôles et la navigation, 20 px dans les états vides, 14 px dans les métadonnées. Icônes décoratives masquées (`aria-hidden`) ; tout bouton icône a un nom accessible.

## Accessibilité et comportement

- Focus visible : contour émeraude de 2 px (ou halo dans les champs), dans les deux thèmes.
- Cibles tactiles de 44 px minimum quand le pointeur est grossier (règle globale dans `app.css`).
- Ne jamais porter une information par la seule couleur : un statut a toujours un libellé.
- Transitions de 150 à 200 ms limitées aux couleurs et aux ombres ; `prefers-reduced-motion` respecté.

## À ne pas faire

- Ajouter une couleur hors thème, un dégradé ou une ombre sur du contenu.
- Mettre plus d'un bouton émeraude plein dans une même zone.
- Mettre le titre de page ailleurs que dans la barre du haut, ou ajouter un second trait sous des onglets d'en-tête.
- Mettre une page en bord à bord sans que ce soit demandé : pour l'instant, seules Finances, Consommation et Routeurs suivent ce modèle.
- Encadrer un état vide en pointillés ou l'illustrer.
- Changer une primitive pour une seule page : composer au-dessus.
