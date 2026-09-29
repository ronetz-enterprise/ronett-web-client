# Erreurs

ProblemDetail conserve type, title, status, detail, instance, code, errorCode, errors, correlationId et extensions. Les décisions reposent sur status/code ; les détails bruts et messages techniques ne sont pas affichés.

Le formulaire mappe uniquement les champs connus name/currency avec des messages sûrs et le focus approprié. correlationId reste copiable lorsqu’il est fourni.

401 : restauration coordonnée, au plus un rejeu pour une lecture ; aucune répétition automatique de mutation. 403 : aucune rotation pour contourner le refus. 404 : refus générique pour le contexte. 409 d’idempotence : vérification explicite, sans recyclage aveugle de clé.

Réseau/timeout/408/5xx/réponse invalide pendant création : résultat inconnu, reprise du même POST. Une erreur de chargement de liste ne devient jamais []. Une erreur technique de restauration ouvre l’écran de reprise et masque les données privées.

Les changements d’autorisation sont détectés au prochain contrôle serveur : montage, premier plan, mutation, ou refus d’une requête. Aucun mécanisme push n’est fourni par le contrat.
