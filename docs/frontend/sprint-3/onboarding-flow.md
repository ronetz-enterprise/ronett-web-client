# Création et reprise

Une liste serveur réellement vide redirige vers /onboarding/organization. Une organisation supplémentaire peut être créée depuis la sidebar ou la sélection.

Le formulaire valide le nom non vide (150 caractères maximum) et le format de devise (trois lettres). Le catalogue des devises reste une décision serveur. Le DTO trimme le nom et normalise la devise en majuscules.

Chaque intention reçoit un UUID. Avant le POST, le navigateur conserve sous ronetz.onboarding.{userId} uniquement la clé et le formulaire normalisé, pour pouvoir reprendre après actualisation ou reconnexion. Aucun token, membership ou rôle n’est persisté. Le stockage d’un autre compte n’est jamais chargé dans le contexte courant.

États : idle → creating → created / failed / unknown. Le verrou synchrone empêche les doubles soumissions. Un rejet établi permet la correction ; un formulaire modifié reçoit une nouvelle intention. Réseau, timeout, annulation, succès illisible, 401 ou 5xx restent inconnus. La reprise explicite rejoue la même clé et le même contenu.

IDEMPOTENCY_CONFLICT et IDEMPOTENCY_KEY_EXPIRED imposent une vérification administrative ; aucune nouvelle clé automatique. Le backend garantit un rejeu de 30 jours et conserve ensuite la clé comme tombstone. Aucun polling fictif.

Après 201, /api/me/memberships/{id} doit confirmer un accès actif avec le OWNER réel. La liste est invalidée, puis la navigation ouvre /app/{id}. L’intention est nettoyée après le changement effectif d’URL, pour ne pas provoquer une course de redirection avec /onboarding/status.

Une création confirmée ne remplace pas la revalidation lors de l’ouverture du dashboard. Si le stockage est indisponible, l’interface annonce la limite de reprise durable ; elle ne promet pas une restauration après fermeture.
