# Modèles d’interface Ronetz

Lire d’abord la [charte](design-system.md). Les exemples de la galerie `/__dev/socle` sont fictifs et explicitement identifiés. Route uniquement en développement avec mocks ; aucun Storybook ajouté.

## Composition des pages

| Modèle           | Ordre et largeur                                                                 | Implémentation / exemple                        | État et mobile                                                                    |
| ---------------- | -------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Authentification | Marque, PageHeader, formulaire, retour serveur, liens ; 440 px                   | AuthLayout, LoginPage, RegisterPage             | Mot de passe visible/masqué, focus erreur, mutation stable ; plein écran étroit   |
| Dashboard        | Contexte, attention, infrastructure, activité, accès utile                       | DashboardPage                                   | Pas de faux KPI ; les services non disponibles sont explicites                    |
| Liste            | PageHeader, toolbar, recherche/filtres, résumé, table, pagination si API paginée | OrganizationMembers + DataTable                 | Recherche/filtre URL, skeleton initial, absence distincte du filtre, scroll local |
| Détail           | Contexte/breadcrumb, titre/statut, actions, résumé, sections liées               | OrganizationPage + SummaryCard                  | UUID lisible avec retour à la ligne ; pas d’onglets vides                         |
| Création         | Titre, description, champs groupés, action primaire                              | CreateOrganizationPage + ValidatedForm          | Une colonne ; conserver l’état et les garanties de création existantes            |
| Paramètres       | Titre, section générale, champs/valeurs, état de disponibilité                   | OrganizationSettings, max 896 px                | Consultation seule tant que l’API de modification n’existe pas                    |
| Erreur           | Titre sûr, explication, prochaine action, référence utile                        | ErrorState, QueryFailure, pages 403/404/session | Réessayer si approprié ; aucun message interne brut                               |
| Vide             | Titre spécifique, cause, action utile éventuelle                                 | EmptyState officiel composé                     | Action sous texte ; pas de cartes imbriquées                                      |

Le breadcrumb est facultatif. Il existe dans le shell ; ne pas le répéter systématiquement dans PageHeader. Les tabs sont réservés à plusieurs vues parallèles réelles. Les pages de paramètres actuelles partagent la navigation de sidebar ; une sous-navigation pourra être ajoutée lorsque sécurité et notifications existeront.

## Table de membres

La réponse actuelle est une collection complète non paginée : filtrage local conservé, critères `q` et `status` dans l’URL, résumé « N résultats sur M membres ». Pas de pagination client décorative ni de paramètre serveur inventé. TanStack Table n’est pas installé : introduire son état contrôlé et `manualPagination` seulement avec un contrat paginé réel, en gardant la composition Table shadcn.

Colonnes : identifiant, statut, rôle, date (desktop), actions. L’identifiant n’est pas tronqué silencieusement ; il revient à la ligne. Les actions sont nommées pour la ressource. Le menu conserve les protections du dernier OWNER. Les statuts utilisent `businessStatusTone` et les libellés du domaine, sans changer la logique d’autorisation.

```tsx
<PageHeader title="Membres" description="Les accès de votre organisation." />
<DataTable density="standard">
  <TableCaption>Membres de l’organisation</TableCaption>
  <TableHeader>…</TableHeader>
  <TableBody>…</TableBody>
</DataTable>
```

Ne pas ajouter de colonnes configurables, sélection groupée, pagination ou recherche globale tant qu’elles n’apportent pas de valeur métier vérifiable.

## Formulaires et confirmations

Les champs utilisent label visible, contrôle, aide éventuelle et erreur liée. Indiquer « facultatif » explicitement. Éviter deux colonnes sur mobile. RHF/Zod et la gestion actuelle des secrets restent inchangés ; les mots de passe peuvent être effacés après erreur selon le comportement sécurité existant.

`ValidatedForm` empêche les soumissions doubles, conserve le libellé du bouton en mutation et annonce l’opération. L’alerte racine est structurée. Les paramètres modifiables futurs devront prévenir la perte des modifications non sauvegardées ; ce besoin ne concerne pas les paramètres actuels en lecture seule.

Dialog : ajout d’un utilisateur, un champ. AlertDialog : suspension/réactivation/révocation, nom/identifiant, conséquence et réversibilité. Sheet : contexte riche ou navigation mobile. Processus longs : page dédiée. Les zones destructives futures vont en fin de paramètres, pas dans le header.

## Familles de cartes

- MetricCard : seulement une donnée disponible, avec unité, période et contexte. Exemple fictif dans la galerie uniquement.
- Resource : SummaryCard + nom + statut + métadonnées + lien nommé. Pas de onClick sur un div.
- Status : Alert + cause + prochaine action ; pas une grande surface saturée.
- Onboarding : PageSection + objectif + étape suivante ; progression uniquement si réellement connue.
- SummaryCard : synthèse d’un détail, padding cohérent, texte aligné à gauche.

Préférer PageSection et une séparation à une carte supplémentaire. Ne pas imbriquer les cartes.

## Validation avant extension

Exécuter typecheck, lint, tests et build. Pour chaque nouveau modèle : clair/sombre à 375/768/1280/1440, clavier, focus, zoom, reduced motion, débordements et contraste. Tester les permissions et le changement d’organisation avec des fixtures isolées. La galerie montre composants et états ; les tests de matrice capturent aussi les vrais écrans et la sidebar ouverte/réduite/mobile.
