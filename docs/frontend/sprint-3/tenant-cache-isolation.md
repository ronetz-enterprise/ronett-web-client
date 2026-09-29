# Isolation Query

Clés globales : ["identity","current"], ["memberships","current"]. La liste est globale au compte authentifié et disparaît au logout.

Clé d’accès : ["organization", organizationId, "access"]. Les ressources futures utilisent tenantKeys.resource(organizationId, resource, ...parts). Deux usernames identiques de tenants distincts restent sous des clés différentes.

Chaque arbre SSR possède son QueryClient. Aucun cache Query n’est persisté. Pas de placeholderData d’un tenant précédent ni de store serveur parallèle. Aucune mutation optimiste tenant n’est implémentée dans ce sprint.

Le switch et le démontage du guard annulent puis suppriment les queries du tenant sortant. Les queryFn consomment AbortSignal ; la session rejette également les réponses arrivant après changement d’époque. Les tests vérifient les réponses tardives et la conservation des autres tenants et du cache global.

En cas d’échec d’accès, les ressources sensibles de ce tenant sont annulées/supprimées. L’observateur de vérification reste disponible pour afficher l’erreur et réessayer, mais son ancienne donnée n’autorise jamais l’Outlet. Au logout ou à la perte de session, toutes les queries et mutations sont supprimées.
