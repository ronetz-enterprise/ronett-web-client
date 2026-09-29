# Sprint 4 — Membres et paramètres

## Verdict : PARTIAL

Le périmètre exposé par le backend est implémenté : consultation de l’organisation, liste et filtres des membres, ajout d’un utilisateur existant comme OWNER, suspension, réactivation, révocation et retrait de son propre accès. Les fonctionnalités sans contrat restent différées. La protection serveur du dernier OWNER contre la suspension reste un besoin backend.

L’[audit et la matrice des contrats](audit-and-contracts.md) ont précédé l’implémentation. Le frontend conserve les couches app/pages/features/shared, la session cookie/CSRF, le guard et le contexte du Sprint 3. Aucun endpoint ni rôle supplémentaire n’a été créé.

## Fonctionnement et capacités

Routes sous le guard existant :

- /app/:organizationId/settings et /settings/general : informations générales en lecture.
- /app/:organizationId/settings/members : liste et gestion.
- Pas de route d’invitations sans contrat.

Seul OWNER est actuellement exposé. Les capacités sont centralisées dans features/memberships/model/member.ts et s’appuient sur les permissions explicites et les statuts validés. La sidebar filtre ses entrées ; les formulaires et mutations contrôlent également les capacités. Le serveur reste l’autorité.

La liste API est complète et non paginée. Recherche locale sur UUID utilisateur/appartenance et filtre local de statut sont conservés dans q et status dans l’URL. Le tri est stable par date puis identifiant. Les DTO n’offrent aucun nom/email : aucun lookup d’identité étrangère n’est effectué. Le formulaire d’ajout demande un UUID de compte existant et explique les pouvoirs OWNER ; il ne constitue pas une invitation.

ACTIVE peut être suspendu, SUSPENDED réactivé ; REVOKED est terminal. Les trois transitions utilisent une confirmation AlertDialog. Un verrou synchrone et le compteur des mutations empêchent les doubles soumissions dans l’organisation. Les mutations ne sont pas rejouées automatiquement. Après un résultat incertain, la liste est rechargée.

Le dernier OWNER actif ne peut être suspendu ni révoqué depuis l’interface. Le backend bloque la révocation lorsque le nombre d’OWNER actifs est inférieur ou égal à un, même pour une cible suspendue. Il ne fournit pas la même protection pour la suspension. L’interface ne peut garantir cet invariant lors d’appels directs ou de mutations concurrentes.

## Session, cache et perte d’accès

Les clés organisation, membres, accès et mutations incluent organizationId dans tenantKeys. Chaque réponse est validée avec Zod et son organisation est comparée au contexte. Une réponse étrangère est rejetée.

Le changement d’organisation démonte le contexte précédent, annule ses queries et purge son cache. Les callbacks d’une mutation dont le composant est démonté ne redirigent pas le nouveau contexte. Une révocation ou suspension de son propre membership navigue vers le sélecteur, purge le tenant et recharge les memberships ; le sélecteur ouvre l’unique autre organisation accessible ou présente les choix/l’absence d’accès.

Les autres mutations rechargent la liste et revalident le contexte. Les refus 401/403 déclenchent sa revalidation. Le logout supprime le cache sensible. Les routes bearer n’envoient pas les cookies ; les opérations de session web suivent le contrat CSRF du Sprint 3. Aucun token persistant n’est ajouté.

Les changements faits ailleurs sont détectés au montage, au retour au premier plan et lors d’un refus serveur. Le contrôle périodique est désactivé dans la configuration actuelle ; aucun push backend n’est fourni. Un écran inactif n’a donc pas de garantie de notification immédiate.

## shadcn/ui et thème

Réutilisés : Button, Input, Select, DropdownMenu, Skeleton et le système de formulaires React Hook Form/Zod, ainsi que la sidebar, Sheet, Tooltip et les notifications existantes.

Téléchargés depuis le registre officiel via npm exec shadcn -- add card table badge alert alert-dialog dialog --yes : Card, Table, Badge, Alert, AlertDialog, Dialog. Le remplacement de Button a été refusé. Les composants générés restent dans src/shared/ui grâce aux alias de components.json. Une Table simple convient à la liste complète ; aucune dépendance TanStack Table n’est nécessaire.

Sources officielles : [Table Base UI](https://ui.shadcn.com/docs/components/base/table), [Alert Dialog Base UI](https://ui.shadcn.com/docs/components/base/alert-dialog), [CLI](https://ui.shadcn.com/docs/cli).

Le fichier src/app/styles/app.css conserve son empreinte initiale :
e39c61d7de829052178c7eaa1b0c61a5ee5f5daba335a66189956617428f7d68.
Variables CSS, polices, tokens et thème sont inchangés. Les changements de navbar déjà présents ont été conservés, avec corrections de valeur du sélecteur, noms accessibles et débordement mobile. Aucun redesign.

## Différé et besoins backend

- Édition nom/devise : aucun endpoint HTTP ; ORGANIZATION_UPDATE ne suffit pas. Définir aussi la validation et la concurrence.
- Invitations : aucun contrat de création/liste/renvoi/annulation/acceptation/expiration. Aucun email simulé.
- Changement de rôle/transfert : seul OWNER existe, aucune mutation exposée.
- Nom/email/avatar des membres : données absentes du DTO.
- Pagination serveur : absente ; à intégrer uniquement avec un contrat explicite.
- Garantir transactionnellement au moins un OWNER actif pour suspension et révocation concurrentes.
- Notification des changements de droits : pas de push ; détection au prochain contrôle serveur.

Les tests des opérations absentes ne sont pas exécutés et ne sont pas remplacés par des mocks inventés. La concurrence de deux administrateurs sur le dernier OWNER n’est pas qualifiée. Le test réel HTTP local utilise Secure=false explicitement pour localhost ; il ne certifie pas une configuration HTTPS de production.

Voir [validation](testing.md) et [inventaire des fichiers](files.md). Aucun commit ni déploiement n’a été réalisé ; aucun code backend n’a été modifié.
