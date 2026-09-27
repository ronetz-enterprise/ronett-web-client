# Endpoints non destinés au frontend

| Endpoint | Appelant | Sécurité | Pourquoi hors navigateur | OpenAPI public |
|---|---|---|---|---|
| `POST /api/webhooks/flutterwave` | Flutterwave | signature brute vérifiée | événement fournisseur, secret/signature | non |
| `POST /api/purchases/{id}/payment` | logique backend | `denyAll` HTTP | callback métier interne | non |
| `POST /api/purchases/{id}/payment-failed` | logique backend | `denyAll` HTTP | callback métier interne | non |
| `/actuator/health/**` | orchestrateur/monitoring | public | sondes techniques | document ops séparé |
| autres `/actuator/**` | opérateur authentifié selon Security | auth globale | métriques/gestion | non |
| Node Agent `/agent/v1/**` | worker Java/opérateur | HTTPS + HMAC/enrollment | contient commandes techniques | OpenAPI interne distinct |
| projection/reconciliation Access | worker/OWNER autorisé | JWT et ownership | action de maintenance, pas parcours public | owner/admin seulement |
| endpoints RADIUS | aucun contrôleur plateforme | DB roles/fencing | stockage technique | non |

Les exports CSV audit/reporting et l'intégrité audit restent utilisables par les écrans autorisés,
mais ce sont des opérations sensibles à journaliser. Les routes plateforme ne doivent figurer que
dans un contrat admin séparé.
