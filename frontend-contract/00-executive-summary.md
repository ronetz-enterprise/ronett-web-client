# Résumé exécutif

## Produit et état exploitable

**OBSERVÉ :** Ronet gère des organisations exploitant des sites Wi-Fi, des routeurs, des offres,
des achats et paiements, des droits d'accès RADIUS, l'accounting, les notifications, le reporting,
le support, l'audit et l'administration plateforme.

| Mesure | Résultat |
|---|---:|
| Routes applicatives | 136 |
| Routes navigateur potentielles | 133 |
| Routes applicatives publiques configurées | 16 |
| Routes internes/webhook interdites au navigateur | 3 |
| Modules HTTP | 17 |
| Modèles HTTP candidats recensés | 72 |
| Phases frontend | 13 |
| OpenAPI | absent |

Répartition : access 9, accounting 6, audit 7, authentication 4, identity 6, membership 6,
notification 5, offer 13, onboarding 1, organization 2, payment 5, platformadmin 19, purchase 6,
reporting 12, router 10, site 7, support 18.

**PROUVÉ :** les suites REST couvrent l'essentiel des modules, l'isolation interorganisation et
plusieurs rejouements. Le parcours distant Access APPLY possède un E2E Java/HTTPS/Python/SQLite/
PostgreSQL. Cela ne valide pas FreeRADIUS réel.

## Parcours

- Réalisables : inscription, login/refresh/logout, création organisation OWNER, sites, routeurs,
  offres et publication, checkout, paiement, droits locaux, notifications, accounting, reporting,
  audit, support et opérations administratives connues.
- Partiels : restauration de session/profil, sélection d'organisation, invitations de membres,
  livraison distante après paiement, lecture d'artefact routeur, qualification Access distante.
- Bloqués : page `/me` fiable, liste des organisations du compte, découverte des permissions
  plateforme, administration des nœuds réseau, remboursement public/owner, préférences notification.

## Priorités

- P0 : CORS autorise `*` avec credentials; tokens sensibles sont renvoyés dans JSON; routes
  Identity authentifiées sans contrôle visible d'auto accès ou rôle dans le contrôleur.
- P1 : checkout public sans idempotence malgré la création d'un achat; absence de `/me`, liste d'organisations et permissions courantes; callbacks purchase
  présents mais `denyAll`; aucun OpenAPI; pas de route publique unifiée de suivi checkout→accès.
- P2 : pagination et erreurs hétérogènes; plusieurs DTO du domaine directement exposés; `errorCode`
  stable seulement sur quelques modules; tri rarement explicite.
- P3 : noms de paramètres et enveloppes de pages non uniformes, documentation automatisée absente.

**Première phase lançable :** Phase 0, client HTTP typé manuellement, ProblemDetail, correlation ID,
stockage de session en mémoire et mocks contractuels. La Phase 1 peut suivre, avec un écran profil
différé jusqu'à création de `/me`.
