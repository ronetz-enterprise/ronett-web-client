# Matrices endpoints et écrans

| Endpoint | Module | Acteur | Écran frontend | Phase | Obligatoire | État |
|---|---|---|---|---:|---|---|
| `POST /api/organizations/{organizationId}/sites/{siteId}/access-grants/manual` | access | propriétaire organisation | Accès Internet | 9 | Oui | réel |
| `GET /api/access-grants/{id}` | access | utilisateur authentifié | Accès Internet | 9 | Oui | réel |
| `GET /api/organizations/{organizationId}/sites/{siteId}/access-grants` | access | propriétaire organisation | Accès Internet | 9 | Oui | réel |
| `GET /api/organizations/{organizationId}/access-grants` | access | propriétaire organisation | Accès Internet | 9 | Oui | réel |
| `POST /api/access-grants/{id}/suspension` | access | utilisateur authentifié | Accès Internet | 9 | Oui | réel |
| `DELETE /api/access-grants/{id}/suspension` | access | utilisateur authentifié | Accès Internet | 9 | Oui | réel |
| `POST /api/access-grants/{id}/revocation` | access | utilisateur authentifié | Accès Internet | 9 | Oui | réel |
| `POST /api/access-grants/{id}/projection-retries` | access | utilisateur authentifié | Accès Internet | 9 | Oui | réel |
| `POST /api/public/access-grants/{id}/credential-delivery` | access | public | Accès Internet | 9 | Oui | réel |
| `GET /api/organizations/{organizationId}/accounting/balance` | accounting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/accounting/ledger` | accounting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/accounting/ledger/{transactionId}` | accounting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `POST /api/organizations/{organizationId}/withdrawals` | accounting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/withdrawals` | accounting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/withdrawals/{withdrawalId}` | accounting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/audit-entries/export` | audit | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `GET /api/platform/audit-entries/export` | audit | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `GET /api/platform/audit-integrity/status` | audit | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `GET /api/organizations/{organizationId}/audit-entries` | audit | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `GET /api/organizations/{organizationId}/audit-entries/{id}` | audit | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `GET /api/platform/audit-entries` | audit | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `GET /api/platform/audit-entries/{id}` | audit | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/auth/register` | authentication | public | Session | 1 | Oui | réel |
| `POST /api/auth/login` | authentication | public | Session | 1 | Oui | réel |
| `POST /api/auth/refresh` | authentication | public | Session | 1 | Oui | réel |
| `POST /api/auth/logout` | authentication | public | Session | 1 | Oui | réel |
| `POST /api/identities` | identity | utilisateur authentifié | Organisation et membres | 3 | Oui | réel |
| `GET /api/identities/{userId}` | identity | utilisateur authentifié | Organisation et membres | 3 | Oui | réel |
| `PATCH /api/identities/{userId}` | identity | utilisateur authentifié | Organisation et membres | 3 | Oui | réel |
| `POST /api/identities/{userId}/suspension` | identity | utilisateur authentifié | Organisation et membres | 3 | Oui | réel |
| `POST /api/identities/{userId}/reactivation` | identity | utilisateur authentifié | Organisation et membres | 3 | Oui | réel |
| `POST /api/identities/{userId}/closure` | identity | utilisateur authentifié | Organisation et membres | 3 | Oui | réel |
| `POST /api/organizations/{organizationId}/memberships` | membership | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `GET /api/organizations/{organizationId}/memberships` | membership | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `GET /api/organizations/{organizationId}/memberships/{userId}` | membership | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `PATCH /api/organizations/{organizationId}/memberships/{userId}/suspension` | membership | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `PATCH /api/organizations/{organizationId}/memberships/{userId}/reactivation` | membership | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `DELETE /api/organizations/{organizationId}/memberships/{userId}` | membership | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `GET /api/notifications` | notification | utilisateur authentifié | Exploitation | 10 | Oui | réel |
| `GET /api/notifications/{notificationId}` | notification | utilisateur authentifié | Exploitation | 10 | Oui | réel |
| `PATCH /api/notifications/{notificationId}/read` | notification | utilisateur authentifié | Exploitation | 10 | Oui | réel |
| `PATCH /api/notifications/read-all` | notification | utilisateur authentifié | Exploitation | 10 | Oui | réel |
| `GET /api/notifications/unread-count` | notification | utilisateur authentifié | Exploitation | 10 | Oui | réel |
| `POST /api/organizations/{organizationId}/sites/{siteId}/offers` | offer | propriétaire organisation | Offres | 6 | Oui | réel |
| `GET /api/organizations/{organizationId}/sites/{siteId}/offers` | offer | propriétaire organisation | Offres | 6 | Oui | réel |
| `GET /api/offers/{offerId}` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `PATCH /api/offers/{offerId}` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `PATCH /api/offers/{offerId}/price` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `PATCH /api/offers/{offerId}/access-policy` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `PATCH /api/offers/{offerId}/display-order` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `POST /api/offers/{offerId}/publication` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `POST /api/offers/{offerId}/suspension` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `DELETE /api/offers/{offerId}/suspension` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `POST /api/offers/{offerId}/archival` | offer | utilisateur authentifié | Offres | 6 | Oui | réel |
| `GET /api/public/sites/{siteId}/offers` | offer | public | Offres | 6 | Oui | réel |
| `GET /api/public/sites/{siteId}/offers/{offerId}` | offer | public | Offres | 6 | Oui | réel |
| `POST /api/organizations` | onboarding | utilisateur authentifié | Onboarding | 2 | Oui | réel |
| `GET /api/organizations/{organizationId}` | organization | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `GET /api/organizations/{organizationId}/active` | organization | propriétaire organisation | Organisation et membres | 3 | Oui | réel |
| `POST /api/webhooks/flutterwave` | payment | webhook fournisseur | Paiement | 8 | Non | réel |
| `POST /api/payments` | payment | public | Paiement | 8 | Oui | réel |
| `GET /api/payments/{id}` | payment | public | Paiement | 8 | Oui | réel |
| `GET /api/purchases/{purchaseId}/payment` | payment | public | Paiement | 8 | Non | réel |
| `POST /api/payments/{id}/verify` | payment | public | Paiement | 8 | Oui | réel |
| `GET /api/platform/overview` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/search` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/organizations/{id}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/organizations/{id}/suspend` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/organizations/{id}/reactivate` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/organizations/{id}/close` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/identities/{id}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/identities/{id}/suspend` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/identities/{id}/reactivate` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/routers/{id}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/routers/{id}/{operation}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/payments/{id}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/payments/{id}/reconcile` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/payment-anomalies` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/payment-anomalies/{id}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/payment-anomalies/{id}/review` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/payment-anomalies/{id}/resolve` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `GET /api/platform/accesses/{id}` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/platform/accesses/{id}/revoke` | platformadmin | administrateur plateforme | Administration plateforme | 12 | Oui | réel |
| `POST /api/public/sites/{siteId}/checkout` | purchase | public | Checkout public | 7 | Oui | réel |
| `POST /api/organizations/{organizationId}/sites/{siteId}/purchases` | purchase | propriétaire organisation | Checkout public | 7 | Oui | réel |
| `GET /api/purchases/{purchaseId}` | purchase | utilisateur authentifié | Checkout public | 7 | Oui | réel |
| `POST /api/purchases/{purchaseId}/payment` | purchase | public | Checkout public | 7 | Non | réel |
| `POST /api/purchases/{purchaseId}/payment-failed` | purchase | utilisateur authentifié | Checkout public | 7 | Non | réel |
| `POST /api/purchases/{purchaseId}/cancel` | purchase | utilisateur authentifié | Checkout public | 7 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/overview` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/sales` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/financial` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/payments` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/access` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/sites` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/offers` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/routers` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `GET /api/platform/reports/overview` | reporting | administrateur plateforme | Exploitation | 10 | Oui | réel |
| `GET /api/platform/reports/revenue` | reporting | administrateur plateforme | Exploitation | 10 | Oui | réel |
| `GET /api/platform/reports/infrastructure` | reporting | administrateur plateforme | Exploitation | 10 | Oui | réel |
| `GET /api/organizations/{organizationId}/reports/sales/export` | reporting | propriétaire organisation | Exploitation | 10 | Oui | réel |
| `POST /api/routers` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `GET /api/routers/{routerId}` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `GET /api/organizations/{organizationId}/routers` | router | propriétaire organisation | Routeurs | 5 | Oui | réel |
| `PATCH /api/routers/{routerId}/name` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `GET /api/routers/{routerId}/provisioning` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `POST /api/routers/{routerId}/provisioning` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `POST /api/routers/{routerId}/configuration-artifacts` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `POST /api/routers/{routerId}/suspension` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `DELETE /api/routers/{routerId}/suspension` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `POST /api/routers/{routerId}/revocation` | router | utilisateur authentifié | Routeurs | 5 | Oui | réel |
| `POST /api/organizations/{organizationId}/sites` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `GET /api/organizations/{organizationId}/sites` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `GET /api/organizations/{organizationId}/sites/{siteId}` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `PATCH /api/organizations/{organizationId}/sites/{siteId}` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `POST /api/organizations/{organizationId}/sites/{siteId}/suspension` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `POST /api/organizations/{organizationId}/sites/{siteId}/reactivation` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `DELETE /api/organizations/{organizationId}/sites/{siteId}` | site | propriétaire organisation | Sites | 4 | Oui | réel |
| `GET /api/platform/support/tickets` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `GET /api/platform/support/tickets/{id}` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/start` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/request-customer-response` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/messages` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/internal-notes` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/resolve` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/close` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/platform/support/tickets/{id}/reopen` | support | administrateur plateforme | Support ou audit | 11 | Oui | réel |
| `POST /api/public/support/tickets` | support | public | Support ou audit | 11 | Oui | réel |
| `GET /api/public/support/tickets/{number}` | support | public | Support ou audit | 11 | Oui | réel |
| `POST /api/public/support/tickets/{number}/messages` | support | public | Support ou audit | 11 | Oui | réel |
| `POST /api/organizations/{organizationId}/support/tickets` | support | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `GET /api/organizations/{organizationId}/support/tickets` | support | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `GET /api/organizations/{organizationId}/support/tickets/{id}` | support | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `POST /api/organizations/{organizationId}/support/tickets/{id}/messages` | support | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `POST /api/organizations/{organizationId}/support/tickets/{id}/cancel` | support | propriétaire organisation | Support ou audit | 11 | Oui | réel |
| `POST /api/organizations/{organizationId}/support/tickets/{id}/reopen` | support | propriétaire organisation | Support ou audit | 11 | Oui | réel |

## Matrice inverse

| Écran | Endpoints nécessaires | Endpoints manquants | Blocage |
|---|---|---|---|
| Session | `/api/auth/*` | `/me`, sessions actives | Oui pour restauration fiable du profil |
| Sélection organisation | création et GET organisation | liste des organisations du compte | Oui |
| Membres | `/memberships` | recherche/invitation d'utilisateur par email | Partiel |
| Sites | routes site | aucun blocage CRUD majeur | Non |
| Routeurs | routes router/provisioning/artifacts | téléchargement/lecture explicite de l'artefact | Partiel |
| Offres | routes owner + public | aucun blocage majeur | Non |
| Checkout | offres publiques, checkout, paiement | résolution de site par portail/domaine | Selon intégration captive |
| Livraison accès | paiement, achat, credential delivery | statut public unifié achat→projection | Polling fragmenté |
| Accounting | balance, ledger, withdrawals | filtres avancés | Non critique |
| Support | routes support | aucun blocage majeur | Non |
| Admin plateforme | `/api/platform/**` | découverte fiable des rôles/permissions | Oui après login |
