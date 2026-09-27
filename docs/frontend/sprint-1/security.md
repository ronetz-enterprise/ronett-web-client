# Sécurité et limites

- Aucun token, credential, clé Flutterwave, HMAC ou WireGuard ajouté.
- Aucun stockage local/session pour les données serveur ou secrets.
- Le cookie sidebar_state existant ne contient qu'un booléen UI.
- Pas de refresh/login réel, décodage JWT pour autoriser, faux membership ou rôle présumé.
- Pas de dangerouslySetInnerHTML dans le code ajouté.
- fetch sans cookies, sans redirection automatique, bearer explicite par appel.
- Les routes public, organisation et plateforme sont distinctes; aucun appel privilégié dans les placeholders.
- Les caches tenant incluent organizationId et sont supprimés au changement de contexte.
- SensitiveValue : masquage initial, révélation/copie volontaires, pas de log/persistance.
  Le presse-papiers système n'est pas un stockage maîtrisé par React : copie toujours explicite.

Le paramètre UUID n'autorise pas une organisation. Les véritables guards sont différés :
ne brancher aucune donnée réelle avant le contrat de session et d'autorisation.
Le backend reste responsable de chaque autorisation.

Les rapports signalent CORS trop permissif, contrôle Identity incertain, absence de /me,
liste d'organisations et permissions plateforme. Ces limites sont documentées, pas contournées.
Pour lire le header de corrélation en cross-origin, vérifier l'exposition de X-Correlation-Id
dans CORS; le corps ProblemDetail sert de fallback. Aucun audit backend recommencé.

Les données serveur sensibles ne doivent jamais être placées dans QueryClient. Mutations sans retry,
HTTP sans retry. Les callbacks purchase, webhooks Flutterwave, Node Agent et Actuator sont hors scope.
