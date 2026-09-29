# État des anciens prérequis

Les prérequis du premier passage sont maintenant livrés et intégrés. Ce fichier remplace la liste historique de blocages.

| Ancien blocage               | Résolution                                             |
| ---------------------------- | ------------------------------------------------------ |
| Identité courante absente    | GET /api/me                                            |
| Appartenances absentes       | GET /api/me/memberships, enveloppe complète            |
| Accès non vérifiable         | GET /api/me/memberships/{id}, contrôles serveur tenant |
| Résultat de création inconnu | POST idempotent, même clé/contenu, reprise 30 jours    |
| Session perdue au reload     | /api/auth/web/csrf puis /refresh avec cookie HttpOnly  |

Voir [contrats et preuves](contract-final.md), [tests exécutés](testing.md) et [configuration de sécurité](security.md). Aucun endpoint indispensable au périmètre implémenté n’est encore absent. Le CORS du déploiement doit être configuré avec l’origine frontend exacte.
