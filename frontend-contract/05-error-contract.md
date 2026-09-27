# Contrat d'erreur

Format commun Spring `ProblemDetail` : `type`, `title`, `status`, `detail`, `instance` éventuel,
`correlationId`. La validation ajoute `errors:[{field,message}]`. Quelques handlers ajoutent
`errorCode`; ce champ n'est pas universel.

```json
{"type":"https://api.ronetz.com/problems/validation-failed","title":"Validation failed","status":400,"detail":"One or more fields are invalid","errors":[{"field":"email","message":"must be a well-formed email address"}],"correlationId":"…"}
```

| Catégorie | Statut/forme observée | Traitement frontend |
|---|---|---|
| JSON malformé | 400 `malformed-request` | message formulaire global |
| Validation | 400 + `errors` | associer par `field` |
| Absence | 404, type variable par module | page introuvable |
| Conflit métier/idempotence | 409 | conserver saisie, proposer actualisation |
| Ressource inactive | souvent 409/422 selon module | expliquer l'état requis |
| Non authentifié/token expiré | 401 + `WWW-Authenticate` | un refresh unique puis login |
| Interdit | 403 | masquer action et afficher refus générique |
| Rate limit support | 429 | attendre; aucun Retry-After garanti |
| Projection/fournisseur | 502/503 | état temporaire et retry contrôlé |
| Inattendu | 500 `internal-error` opaque | afficher correlationId, jamais stack trace |

**MANQUANT :** timestamp et code métier stable global. Les handlers de modules ne fixent pas tous
`type/title`; le frontend doit d'abord brancher sur `status`, puis `errorCode/type` si présents.

