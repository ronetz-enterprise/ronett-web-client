# Plan de refonte frontend — Ronetz

Objectif : terminer la refonte de toutes les pages et rendre la console **vivante et agréable**
sans modifier le thème (`src/app/styles/app.css`) ni introduire de couleurs hors charte.

Documents liés : [charte](design-system.md) · [directives de mise en page](ui-layout-guidelines.md) ·
[modèles d'interface](ui-patterns.md).

---

## 1. Diagnostic de départ (mesuré dans le code)

| Constat | Mesure | Conséquence |
|---|---|---|
| Couleurs brutes Tailwind (`bg-red-500`…) | **0** occurrence hors `shared/ui` | Acquis à protéger par un garde-fou automatique |
| En-têtes de page concurrents | 3 (`PageHeader`, `SitePageHeader`, `PlatformPageHeader`) | Titres, actions et fils d'Ariane positionnés différemment |
| Largeurs fixées page par page | 24 `max-w-*` différents (de `md` à `6xl`) | La largeur « saute » d'un écran à l'autre |
| Mouvement / visualisation | 1 transition dans `features/`, aucun graphique | Interface plate : rien ne réagit, rien ne se lit en un coup d'œil |
| Composants shadcn disponibles | 23 (`shared/ui`) | Manquent : `chart`, `command`, `popover`, `toggle-group`, `kbd`, `scroll-area`, `hover-card`, `input-group`, `item`, `spinner` |
| Thème | Primaire émeraude, gris neutres, 4 tons sémantiques doux, **`chart-1…5` = rampe du même vert** | La palette est monochrome : le relief doit venir de la rampe, des opacités et du mouvement |

**Pourquoi l'interface paraît ennuyeuse :** ce n'est pas le manque de couleurs, c'est le manque de
*relief* — tout est texte gris dans des boîtes de même poids, sans chiffres mis en scène, sans icône
d'objet, sans graphique, sans réaction au survol, sans moment de réussite.

---

## 2. Le budget couleur (règle non négociable)

Toute la vivacité vient **des tokens existants**. Rien d'autre n'est autorisé.

| Usage | Tokens autorisés | Exemple |
|---|---|---|
| Action principale | `bg-primary text-primary-foreground` | Un seul bouton plein par écran |
| Accent de surface | `bg-primary/5`, `bg-primary/10`, `ring-primary/20` | Tuile d'icône, carte « hero » du solde, ligne sélectionnée |
| Texte d'accent | `text-primary` | Lien, chiffre clé, icône active |
| Données (graphiques, jauges, heatmaps) | `--chart-1` → `--chart-5` (clair → foncé) | Série principale `chart-4`, secondaire `chart-2`, fond de jauge `muted` |
| Statuts | `success`, `warning`, `info`, `danger` (+ `-foreground`) | Points de statut, badges, deltas ▲▼ |
| Destruction | `destructive` | Bouton et texte de suppression uniquement |
| Neutres | `background`, `card`, `muted`, `border`, `muted-foreground` | Tout le reste |

**Interdits :** couleurs Tailwind nommées (`blue-500`, `emerald-600`…), hexadécimal/oklch en dur dans
un composant, dégradés multicolores, `primary` en aplat sur une grande surface, deux tons sémantiques
différents pour le même statut.

**Garde-fou (Lot 0) :** script `scripts/check-colors.mjs` exécuté par `npm run lint`, qui échoue sur
`\b(bg|text|border|ring|fill|stroke|from|via|to)-(red|blue|…|stone)-\d{2,3}\b`, sur `#[0-9a-f]{3,8}` et
sur `oklch(` hors `app.css`.

---

## 3. Les dix leviers « moins ennuyeux » (sans nouvelle couleur)

| # | Levier | Mise en œuvre | Où |
|---|---|---|---|
| 1 | **Chiffres mis en scène** | `text-3xl font-semibold tabular-nums`, unité en `text-muted-foreground`, delta `▲ +12 %` en `text-success-foreground` / `▼` en `text-danger-foreground` | Tableau de bord, finances, consommation, sites |
| 2 | **Rampe verte pour les données** | Composant `Chart` shadcn (Recharts) avec `chart-1…5` ; aires à `fill-opacity: .15` | Ventes par jour, volumes, sessions |
| 3 | **Sparklines** | Mini-courbe 64×24 dans les tuiles de métrique | Revenu, accès actifs, routeurs en ligne |
| 4 | **Icône par type d'objet** | Dictionnaire `objectIcons` (site, routeur, offre, accès, retrait…) rendu dans une `IconTile` 32 px `bg-primary/10 text-primary rounded-md` | En-têtes de détail, cartes, états vides, palette de commandes |
| 5 | **Statut vivant** | `StatusDot` (point 8 px + libellé) ; « en ligne » avec halo `animate-ping` très discret, coupé par `prefers-reduced-motion` | Routeurs, accès, retraits |
| 6 | **Jauges** | `Meter` (barre `muted` + remplissage `chart-3`, `warning` > 80 %, `danger` > 95 %) | Quota de données d'un accès, sessions simultanées, solde réservé/disponible |
| 7 | **Micro-interactions** | Survol `bg-muted/50` + chevron qui glisse de 2 px ; transitions 150 ms ; compteur qui s'anime à l'arrivée d'une valeur ; skeleton à la forme du contenu | Cartes, lignes, métriques |
| 8 | **États vides illustrés** | Composition d'icônes (objet en `IconTile` + 2 icônes fantômes `text-muted-foreground/40`), titre utile, action | Toutes les listes |
| 9 | **Contenu humain** | « Bonjour Ada », temps relatif (« il y a 3 min »), phrases d'aide orientées action | Tableau de bord, détails, listes |
| 10 | **Moments de réussite** | Écran/encart de succès sobre : check animé (`scale` 0.8→1, 200 ms), message, prochaine étape | Première vente, site créé, retrait versé, onboarding terminé |

Rythme visuel : alterner zones **denses** (tableaux) et zones **respirantes** (cartes de chiffres),
grilles asymétriques `lg:grid-cols-[2fr_1fr]`, une « carte héros » `bg-primary/5` maximum par page.

---

## 4. Lots de travail

Estimation pour un développeur familier du code. Chaque lot se termine par typecheck, lint, tests,
build et vérification visuelle (clair/sombre, 375/768/1280 px).

### Lot 0 — Garde-fous et galerie · 0,5 j
- [x] `scripts/check-colors.mjs` + branchement dans `npm run lint` (§2).
- [x] Mettre à jour la galerie `/__dev/socle` : une section par nouveau composant du Lot 2, en clair et sombre.
- [x] Ajouter au [design-system](design-system.md) le tableau « budget couleur » (§2).

**Fini quand :** une couleur brute ajoutée fait échouer `npm run lint`.

### Lot 1 — Coque et navigation · 2 j

> Livré, sauf l'onglet Offres (Lot 4). Découverte : un thème local `sites-theme.css` (couleurs, rayon, densité) redéfinissait l'apparence des pages Sites ; supprimé au Lot 0.
- [x] Barre latérale en deux groupes (`SidebarGroupLabel`) : *Exploitation* (Tableau de bord, Sites, Routeurs, Accès Internet, Consommation, Finances) et *Organisation* (Membres, Paramètres).
- [x] Supprimer la page `Organisation` et son entrée ; rediriger `/organization` vers `/settings/general`.
- [x] *(livré au Lot 4)* Offres : deviennent un onglet du site ; l'entrée de menu disparaît, `matchPatterns`/`excludePatterns` supprimés.
- [x] **Un seul `PageHeader`** (fusion des trois) : titre `text-xl`, statut, actions ordonnées, onglets intégrés, `border-b` pleine largeur ; `SitePageHeader` et `PlatformPageHeader` deviennent des usages.
- [x] Supprimer les 24 `max-w-*` de page ; seuls formulaires et paramètres gardent `max-w-2xl`.
- [x] Titre d'onglet du navigateur par section : « Routeurs · Mon organisation · Ronetz » (calculé dans la coque, pas un `meta()` par fichier).
- [x] Focus sur le `h1` après chaque navigation (hors premier rendu) ; titre mobile déduit de l'entrée active.
- [x] Espace administration plateforme : repère permanent (étiquette « Administration Ronetz » en tête de sidebar, `bg-sidebar-accent`).

**Fini quand :** les 43 pages utilisent le même en-tête et la même largeur ; aucun onglet de navigateur ne s'appelle seulement « Ronetz ».

### Lot 2 — Bibliothèque expressive · 3 j

> Livré. Composants shadcn ajoutés : `chart`, `command`, `popover`, `toggle-group`, `toggle`, `kbd`,
> `scroll-area`, `hover-card`, `input-group`, `item`, `spinner` (dépendances `recharts`, `cmdk`) ; aucun
> composant existant écrasé, `app.css` inchangé. Composants partagés dans `src/shared/components/`,
> formats dans `src/shared/utils/format.ts`, galerie `/__dev/socle` (section « Relief »), 13 tests.
> `MetricCard` est conservé ; `StatTile` le remplacera page par page aux lots 4 et 5.
Ajouter via la CLI shadcn (thème inchangé) : `chart` (Recharts), `command`, `popover`, `toggle-group`,
`kbd`, `scroll-area`, `hover-card`, `input-group`, `item`, `spinner`.

Créer dans `shared/components/` :

| Composant | Rôle | Remplace |
|---|---|---|
| `IconTile` | Icône d'objet dans un carré `bg-primary/10` (tailles sm/md/lg) | Icônes nues éparses |
| `objectIcons` | Dictionnaire type d'objet → icône Hugeicons, utilisé partout | Choix d'icônes au cas par cas |
| `StatTile` | Libellé, valeur, unité, delta, sparkline facultative, lien | `MetricCard` (étendu, API compatible) |
| `StatusDot` | Point + libellé + halo « vivant » | Badges de statut dans les tableaux |
| `Meter` | Jauge avec seuils `warning`/`danger` | Pourcentages en texte |
| `KeyValueList` | `<dl>` en lignes séparées (gabarit D) | Champs dans des cartes |
| `DetailTabs` | Onglets `line` pilotés par l'URL, extraits de `SiteDetailTabs` | 3 modèles d'édition concurrents |
| `DataToolbar` | Recherche `h-8`, bouton « + Filtre » (`Popover`), puces actives, compteur | Barres de filtres hétérogènes |
| `EmptyState` v2 | Illustration composée (§3-8), variantes « vide » / « filtre » / « prérequis » | `EmptyState` actuel (API compatible) |
| `Timeline` | Événements datés avec point et ligne verticale | Historiques en tableaux |
| `Amount`, `RelativeTime`, `CopyableId` | Formats uniques ; identifiant copiable avec retour « Copié » | 17 appels `Intl` dispersés |
| `SuccessMoment` | Encart de réussite animé + prochaine étape | Toasts seuls pour les grands moments |
| `AnimatedNumber` | Transition de valeur, désactivée en mouvement réduit | Valeurs figées |

**Fini quand :** chaque composant a un exemple clair/sombre dans la galerie et un test de rendu.

### Lot 3 — Retours et formulaires · 1,5 j

> Livré. `useNotifiedMutation` adopté par les finances et l'administration plateforme ; les autres
> mutations seront migrées avec leurs écrans (lots 4 à 8). La protection de saisie est intégrée à
> `ValidatedForm` (8 formulaires couverts, désactivée pour connexion et inscription).
- [x] `useNotifiedMutation` : toast de succès nommant l'objet, erreur dans le contexte (dialogue/formulaire), invalidation.
- [x] Toasts typés (`success`, `error`, `info`) avec icône et tons sémantiques ; erreurs persistantes ; région `aria-live`.
- [x] Garde de saisie non enregistrée (`useBlocker` si `isDirty`).
- [x] Bandeau hors ligne (`onlineManager`) qui suspend les boutons de mutation.
- [x] Confirmation destructive : `AlertDialog` centré (remplace la `Sheet` du bas sur bureau).
- [x] Squelettes à la forme du contenu pour tous les gabarits (remplacent `PageLoading`).

### Lot 4 — Écrans d'exploitation · 5 j

> Livré. Le site devient un espace à onglets (`/sites/:id`, `/routers`, `/offers`, `/settings`) ;
> `/offers` redirige vers les sites. Écarts assumés, faute de donnée backend (§6) : pas de `Meter`
> des ventes par offre, pas de heatmap jour × heure ; la jauge d'un accès porte sur la **durée**
> écoulée (le volume consommé n'est pas exposé) ; la `Timeline` d'un accès montre ses jalons datés,
> pas le journal des changements ; le bloc d'installation d'un routeur rend les références
> copiables, le script n'étant pas exposé. Le backend ne filtrant pas les routeurs, les filtres
> site/connexion portent sur les 100 premiers (signalé à l'écran). Dépendance ajoutée : `qrcode.react`.

| Écran | Gabarit | Changements « vivants » |
|---|---|---|
| **Sites** (liste) | A | Bascule tableau / cartes (`ToggleGroup`, mémorisée) ; carte : `IconTile`, ville, `StatusDot`, mini-stats (routeurs en ligne / total, offres actives) |
| **Site** (détail) | D | `DetailTabs` *Informations · Routeurs · Offres · Paramètres* ; bandeau de 3 `StatTile` ; encart prochaine étape (déjà livré) ; lien portail copiable + QR code du portail |
| **Routeurs** (liste) | A | `StatusDot` avec halo pour « en ligne », « vu il y a 3 min », filtre par site et connectivité |
| **Routeur** (détail) | D | `Timeline` de provisioning (déclaré → installé → qualifié → en ligne) ; bloc d'installation avec commande copiable ; `DetailTabs` |
| **Offres** (onglet du site) | A/C | Cartes d'offre : prix en grand, durée et quota en puces, `Meter` des ventes du mois ; création depuis une carte pointillée « + Nouvelle offre » |
| **Offre** (détail) | D | Aperçu « tel que vu par le client » (rendu du portail en miniature) à côté des réglages |
| **Accès Internet** (liste) | A | `DataToolbar` ; `Meter` de quota dans la ligne ; `StatusDot` ; source en `IconTile` sm |
| **Accès** (détail) | D | `Meter` données / sessions ; `Timeline` des changements ; identifiants `CopyableId` |
| **Consommation** | B | Graphique aire (`chart-4`) des sessions/volumes dès que le backend fournit la série ; heatmap jour × heure en rampe `chart-1…5` ; tableau par routeur avec `Meter` de part du volume |

### Lot 5 — Tableau de bord et finances · 2 j

> Livré. Les deux écrans partagent `useSalesReport` (`/reports/sales`, jour par jour, fuseau du
> navigateur ; les jours sans vente valent zéro). Évolutions : 30 derniers jours vs 30 précédents.
> Les graphiques (Recharts) sont chargés à la demande. La répartition disponible / réservé est une
> barre à deux segments (`chart-4` / `chart-2`) plutôt qu'un `Meter`, dont les seuils d'alerte
> n'ont pas de sens pour un solde. Seul le dernier retrait est montré en `Timeline`.
- [x] Tableau de bord : salutation (« Bonjour Ada »), `StatTile` avec sparklines, graphique des ventes 30 jours (`/reports/sales`, série déjà disponible), `SuccessMoment` à la première vente.
- [x] Finances : carte héros du solde `bg-primary/5` avec répartition disponible/réservé (`Meter`) ; graphique des encaissements ; retrait en `Timeline` (demandé → approuvé → versé) ; `SuccessMoment` « Versement effectué ».

### Lot 6 — Organisation et compte · 1,5 j

> Livré. Le backend n'expose ni les noms ni la dernière activité des autres membres, ni la liste
> des sessions : les membres sont désignés par leur identifiant (initiales pour vous seul, silhouette
> sinon), la colonne « Dernière modification » remplace la dernière activité, et le compte montre la
> session courante avec un encart honnête pour les autres appareils.
- [x] Paramètres avec `DetailTabs` : *Général · Membres* (puis *Facturation* plus tard).
- [x] Membres : `Avatar` avec initiales (fond `bg-primary/10`), rôle en badge, dernière activité relative.
- [x] Compte : sessions actives, déconnexion des autres appareils.

### Lot 7 — Parcours public et authentification · 2 j

> Livré, achat excepté. Le backend expose `POST /api/public/sites/{id}/checkout` et `/api/payments`,
> mais aucun contrat ne remet ses identifiants au client après paiement (`public-delivery.ts`) :
> brancher le paiement ferait payer sans connexion possible. Le portail reste donc en consultation —
> sélection d'offre, étapes visibles, récapitulatif avec bouton de paiement désactivé — et l'écran de
> succès avec identifiants copiables attend ce contrat. Le portail n'affiche pas le nom du site
> (absent de l'API publique). Page d'accueil produit refaite.
> Correctif transverse : la session authentifiée refuse tout `?` dans un chemin ; la liste des
> routeurs et `/reports/sales` passent désormais leurs paramètres par l'option `query`.
Seul endroit où la marque peut s'exprimer davantage, toujours avec les mêmes tokens.
- [~] Portail captif (offres publiques, revue d'achat) : mobile d'abord, nom du site en titre, cartes d'offre larges (prix `text-3xl`), sélection avec `ring-primary`, étapes de paiement en `Progress`, écran de succès avec identifiants copiables.
- [x] Connexion / inscription : colonne de marque `bg-primary/5` avec 3 arguments en `IconTile` (bureau seulement).
- [x] Onboarding : étapes visibles, `SuccessMoment` à la création de l'organisation qui mène au tableau de bord.

### Lot 8 — Administration plateforme · 2,5 j

> Livré. Nouvel écran *Opérations financières* (`/platform-admin/finance`) : file des retraits
> filtrable par statut, décision par `DecisionDialog` (motif validé comme côté serveur, case de
> confirmation pour l'approbation, `APPROVE_WITHDRAWAL` envoyé par la mutation) ; anomalies de
> paiement en `Timeline` avec prise en charge / résolution. Vue d'ensemble : `StatTile`, bloc
> « À traiter », répartitions organisations / routeurs en barres segmentées, actions récentes en
> `Timeline`. Audit : `DataToolbar` + frise. Palette `Ctrl K` dans toute l'administration.
> Écarts : pas de graphique temporel des revenus (le backend n'expose que des totaux) ; la
> recherche globale est exacte (identifiant complet ou email), la palette le dit.
- [x] File d'approbation des retraits (gabarit A) : montant, organisation, bénéficiaire masqué, ancienneté ; dialogue d'approbation/refus avec motif obligatoire et confirmation `APPROVE_WITHDRAWAL`.
- [x] Anomalies de paiement et audit en `Timeline`, filtres `DataToolbar`.
- [x] Vue d'ensemble plateforme : `StatTile` + graphiques (revenus, organisations actives).
- [x] Palette `Ctrl K` (`command`) : recherche globale organisations / utilisateurs / routeurs.

### Lot 9 — Recette finale · 2 j

> Outillage livré, références visuelles à générer. `tests/recette.spec.ts` couvre 15 pages
> (12 de la console, 3 publiques) : axe en clair et sombre, absence de défilement horizontal,
> captures clair/sombre × 375/1280 (`toHaveScreenshot`, horloge figée), animations à l'arrêt en
> mouvement réduit, navigation clavier de la barre latérale. Données déterministes :
> `src/shared/testing/operations-handlers.ts` (mocks MSW, chargés seulement en mode test).
> Mouvement réduit : squelettes et indicateurs de chargement sans animation infinie, graphiques
> Recharts sans animation. Performance : `npm run check:bundle` vérifie que Recharts reste hors du
> chargement initial et que celui-ci ne croît pas de plus de 10 %. La référence
> (`scripts/bundle-baseline.json`, 427 971 octets) date de la fin de la refonte : aucune mesure
> d'avant refonte n'existait. Corrigé pendant la recette : bouton d'alerte qui chevauchait le texte
> sur mobile ; `tests/example.spec.ts` pointait encore la page « Organisation » supprimée.
- [x] Captures de référence Playwright (clair/sombre × 375/1280) pour chaque gabarit ; échec si différence non validée.
- [x] Accessibilité : axe sur chaque page, navigation clavier complète, contraste des tons sur `bg-primary/5`.
- [x] Mouvement réduit : toutes les animations coupées ou remplacées par des fondus.
- [x] Performance : graphiques chargés à la demande (`lazy`), pas de régression du bundle initial > 10 %.

**Total estimé : ~22 jours.** Ordre recommandé : 0 → 1 → 2 → 3, puis 4, 5, 6, 7, 8 dans l'ordre de
valeur métier, et 9 en continu.

---

## 5. Correspondance des 43 pages

| Page | Gabarit | Lot | Note |
|---|---|---|---|
| `dashboard` | B | 5 | Déjà refait (base) ; ajouter graphiques et sparklines |
| `sites`, `site-create`, `site-details`, `site-settings` | A, form, D, D | 4 | `site-settings` = onglet Paramètres |
| `routers`, `router-create`, `router-details`, `router-settings` | A, form, D, D | 4 | Timeline de provisioning |
| `offer-sites`, `offers` | — | 4 | Fusionnés dans l'onglet Offres du site |
| `offer-create`, `offer-details`, `offer-settings` | form, D, D | 4 | Aperçu client |
| `access-grants`, `access-grant-details`, `manual-access` | A, D, form | 4 | Jauges de quota |
| `network-usage` | B | 4 | Graphiques dès la série backend |
| `finance` | B | 5 | Déjà livré (base) |
| `organization` | — | 1 | **Supprimée** |
| `organization-settings`, `organization-members` | D | 6 | Onglets Général · Membres |
| `select-organization` | C | 6 | Cartes d'organisation avec `IconTile` et rôle |
| `account` | D | 6 | Sessions |
| `login`, `register`, `session-expired` | auth | 7 | Colonne de marque |
| `onboarding`, `create-organization`, `onboarding-status` | C | 7 | `SuccessMoment` |
| `public-offers`, `purchase-review`, `portal` | public | 7 | Mobile d'abord |
| `home` | public | 7 | Page d'accueil produit |
| `platform-dashboard`, `platform-organizations`, `platform-organization`, `platform-network`, `platform-audit` | B, A, D, A, A | 8 | + file des retraits |
| `forbidden`, `not-found`, `unexpected-error` | état | 3 | `EmptyState` v2 illustré |
| `diagnostics` | dev | 0 | Galerie des composants |

---

## 6. Dépendances backend

| Besoin | État | Lot impacté |
|---|---|---|
| Série temporelle des ventes | **Disponible** (`/reports/sales`) | 5 |
| Série des sessions / volumes | `AccessReportView.series` toujours vide | 4 (graphiques Consommation) |
| Date de fraîcheur réelle des rapports | `dataLastUpdatedAt` = heure de la requête | 4, 5 |
| Historique des changements d'un accès | Aucun lecteur HTTP de `access_changes` | 4 (Timeline accès) |
| Ventes par offre sur le mois | `reporting.offer_performance` sans période | 4 (`Meter` des offres) |
| Recherche globale plateforme | `/api/platform/search` existe | 8 |

Les écrans concernés affichent un état vide honnête tant que la donnée manque — jamais de faux chiffres.

---

## 7. Définition de « terminé » pour une page

1. Construite sur un des 4 gabarits avec le `PageHeader` unique.
2. Au moins **un** levier de relief (§3) pertinent — pas tous : une page de paramètres reste calme.
3. Les 5 états : chargement (squelette), vide, vide après filtre, erreur, interdit.
4. Retour après chaque action (toast nommant l'objet ou `SuccessMoment`).
5. Aucun libellé brut d'API, aucune couleur hors §2 (`npm run lint` vert).
6. Clair/sombre à 375 / 768 / 1280 px, navigation clavier, mouvement réduit vérifiés.
7. Titre d'onglet du navigateur et fil d'Ariane corrects.

---

## 8. Risques

| Risque | Parade |
|---|---|
| « Sapin de Noël » : trop de leviers sur une page | Règle §7-2 : un levier pertinent minimum, revue de design par gabarit |
| Rampe verte peu lisible pour plus de 3 séries | Limiter à 3 séries ; au-delà, tableau plutôt que graphique |
| Contraste des tons sémantiques sur `bg-primary/5` | Vérification axe au Lot 9 ; texte toujours en `-foreground` |
| Poids de Recharts | Import paresseux des graphiques, une seule instance partagée |
| Régressions visuelles pendant la migration des en-têtes | Captures de référence dès le Lot 1 |
