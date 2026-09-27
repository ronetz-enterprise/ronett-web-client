# Inventaire vérifié des endpoints

**Fait observé :** 136 routes HTTP applicatives ont été extraites des contrôleurs. Les chemins Actuator sont traités séparément. Aucun OpenAPI n'est présent.

Conventions communes : UUID canonique; dates `YYYY-MM-DD`; `Instant` ISO-8601 UTC; JSON sauf exports CSV; bearer JWT pour les routes authentifiées; erreurs `application/problem+json`; `X-Correlation-Id` accepté et renvoyé. `Idempotency-Key` n'est requis que lorsque la fiche groupe le précise.

| ID | Module | Visibilité | Méthode | Chemin | Finalité/handler | Phase | Maturité | Preuve |
|---|---|---|---|---|---|---:|---|---|
| ACC-001 | access | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/sites/{siteId}/access-grants/manual` | `create` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-002 | access | utilisateur authentifié | `GET` | `/api/access-grants/{id}` | `get` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-003 | access | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/sites/{siteId}/access-grants` | `listSite` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-004 | access | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/access-grants` | `listOrganization` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-005 | access | utilisateur authentifié | `POST` | `/api/access-grants/{id}/suspension` | `suspend` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-006 | access | utilisateur authentifié | `DELETE` | `/api/access-grants/{id}/suspension` | `resume` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-007 | access | utilisateur authentifié | `POST` | `/api/access-grants/{id}/revocation` | `revoke` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-008 | access | utilisateur authentifié | `POST` | `/api/access-grants/{id}/projection-retries` | `retry` | 9 | opérationnel et testé | `access/presentation/rest/AccessController.java` |
| ACC-009 | access | public | `POST` | `/api/public/access-grants/{id}/credential-delivery` | `deliver` | 9 | opérationnel et testé | `access/presentation/rest/RemoteCredentialDeliveryController.java` |
| ACT-001 | accounting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/accounting/balance` | `getBalance` | 10 | opérationnel, preuve partielle | `accounting/presentation/rest/AccountingController.java` |
| ACT-002 | accounting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/accounting/ledger` | `getLedger` | 10 | opérationnel, preuve partielle | `accounting/presentation/rest/AccountingController.java` |
| ACT-003 | accounting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/accounting/ledger/{transactionId}` | `getTransaction` | 10 | opérationnel, preuve partielle | `accounting/presentation/rest/AccountingController.java` |
| ACT-004 | accounting | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/withdrawals` | `requestWithdrawal` | 10 | opérationnel, preuve partielle | `accounting/presentation/rest/WithdrawalController.java` |
| ACT-005 | accounting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/withdrawals` | `getWithdrawals` | 10 | opérationnel, preuve partielle | `accounting/presentation/rest/WithdrawalController.java` |
| ACT-006 | accounting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/withdrawals/{withdrawalId}` | `getWithdrawal` | 10 | opérationnel, preuve partielle | `accounting/presentation/rest/WithdrawalController.java` |
| AUD-001 | audit | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/audit-entries/export` | `organization` | 11 | opérationnel et testé | `audit/presentation/rest/AuditExportController.java` |
| AUD-002 | audit | administrateur plateforme | `GET` | `/api/platform/audit-entries/export` | `platform` | 11 | opérationnel et testé | `audit/presentation/rest/AuditExportController.java` |
| AUD-003 | audit | administrateur plateforme | `GET` | `/api/platform/audit-integrity/status` | `status` | 11 | opérationnel et testé | `audit/presentation/rest/AuditIntegrityController.java` |
| AUD-004 | audit | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/audit-entries` | `list` | 11 | opérationnel et testé | `audit/presentation/rest/OrganizationAuditController.java` |
| AUD-005 | audit | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/audit-entries/{id}` | `get` | 11 | opérationnel et testé | `audit/presentation/rest/OrganizationAuditController.java` |
| AUD-006 | audit | administrateur plateforme | `GET` | `/api/platform/audit-entries` | `list` | 11 | opérationnel et testé | `audit/presentation/rest/PlatformAuditController.java` |
| AUD-007 | audit | administrateur plateforme | `GET` | `/api/platform/audit-entries/{id}` | `get` | 11 | opérationnel et testé | `audit/presentation/rest/PlatformAuditController.java` |
| AUTH-001 | authentication | public | `POST` | `/api/auth/register` | `register` | 1 | opérationnel et testé | `authentication/presentation/rest/AuthenticationController.java` |
| AUTH-002 | authentication | public | `POST` | `/api/auth/login` | `login` | 1 | opérationnel et testé | `authentication/presentation/rest/AuthenticationController.java` |
| AUTH-003 | authentication | public | `POST` | `/api/auth/refresh` | `refresh` | 1 | opérationnel et testé | `authentication/presentation/rest/AuthenticationController.java` |
| AUTH-004 | authentication | public | `POST` | `/api/auth/logout` | `logout` | 1 | opérationnel et testé | `authentication/presentation/rest/AuthenticationController.java` |
| ID-001 | identity | utilisateur authentifié | `POST` | `/api/identities` | `create` | 3 | opérationnel et testé | `identity/presentation/rest/UserIdentityController.java` |
| ID-002 | identity | utilisateur authentifié | `GET` | `/api/identities/{userId}` | `findById` | 3 | opérationnel et testé | `identity/presentation/rest/UserIdentityController.java` |
| ID-003 | identity | utilisateur authentifié | `PATCH` | `/api/identities/{userId}` | `updateProfile` | 3 | opérationnel et testé | `identity/presentation/rest/UserIdentityController.java` |
| ID-004 | identity | utilisateur authentifié | `POST` | `/api/identities/{userId}/suspension` | `suspend` | 3 | opérationnel et testé | `identity/presentation/rest/UserIdentityController.java` |
| ID-005 | identity | utilisateur authentifié | `POST` | `/api/identities/{userId}/reactivation` | `reactivate` | 3 | opérationnel et testé | `identity/presentation/rest/UserIdentityController.java` |
| ID-006 | identity | utilisateur authentifié | `POST` | `/api/identities/{userId}/closure` | `close` | 3 | opérationnel et testé | `identity/presentation/rest/UserIdentityController.java` |
| MEM-001 | membership | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/memberships` | `create` | 3 | opérationnel et testé | `membership/presentation/rest/MembershipController.java` |
| MEM-002 | membership | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/memberships` | `listByOrganization` | 3 | opérationnel et testé | `membership/presentation/rest/MembershipController.java` |
| MEM-003 | membership | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/memberships/{userId}` | `findByUser` | 3 | opérationnel et testé | `membership/presentation/rest/MembershipController.java` |
| MEM-004 | membership | propriétaire organisation | `PATCH` | `/api/organizations/{organizationId}/memberships/{userId}/suspension` | `suspend` | 3 | opérationnel et testé | `membership/presentation/rest/MembershipController.java` |
| MEM-005 | membership | propriétaire organisation | `PATCH` | `/api/organizations/{organizationId}/memberships/{userId}/reactivation` | `reactivate` | 3 | opérationnel et testé | `membership/presentation/rest/MembershipController.java` |
| MEM-006 | membership | propriétaire organisation | `DELETE` | `/api/organizations/{organizationId}/memberships/{userId}` | `revoke` | 3 | opérationnel et testé | `membership/presentation/rest/MembershipController.java` |
| NOT-001 | notification | utilisateur authentifié | `GET` | `/api/notifications` | `getNotifications` | 10 | opérationnel et testé | `notification/presentation/rest/NotificationController.java` |
| NOT-002 | notification | utilisateur authentifié | `GET` | `/api/notifications/{notificationId}` | `getNotification` | 10 | opérationnel et testé | `notification/presentation/rest/NotificationController.java` |
| NOT-003 | notification | utilisateur authentifié | `PATCH` | `/api/notifications/{notificationId}/read` | `markAsRead` | 10 | opérationnel et testé | `notification/presentation/rest/NotificationController.java` |
| NOT-004 | notification | utilisateur authentifié | `PATCH` | `/api/notifications/read-all` | `markAllAsRead` | 10 | opérationnel et testé | `notification/presentation/rest/NotificationController.java` |
| NOT-005 | notification | utilisateur authentifié | `GET` | `/api/notifications/unread-count` | `getUnreadCount` | 10 | opérationnel et testé | `notification/presentation/rest/NotificationController.java` |
| OFR-001 | offer | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/sites/{siteId}/offers` | `create` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-002 | offer | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/sites/{siteId}/offers` | `list` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-003 | offer | utilisateur authentifié | `GET` | `/api/offers/{offerId}` | `get` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-004 | offer | utilisateur authentifié | `PATCH` | `/api/offers/{offerId}` | `update` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-005 | offer | utilisateur authentifié | `PATCH` | `/api/offers/{offerId}/price` | `price` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-006 | offer | utilisateur authentifié | `PATCH` | `/api/offers/{offerId}/access-policy` | `policy` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-007 | offer | utilisateur authentifié | `PATCH` | `/api/offers/{offerId}/display-order` | `displayOrder` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-008 | offer | utilisateur authentifié | `POST` | `/api/offers/{offerId}/publication` | `publish` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-009 | offer | utilisateur authentifié | `POST` | `/api/offers/{offerId}/suspension` | `suspend` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-010 | offer | utilisateur authentifié | `DELETE` | `/api/offers/{offerId}/suspension` | `resume` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-011 | offer | utilisateur authentifié | `POST` | `/api/offers/{offerId}/archival` | `archive` | 6 | opérationnel et testé | `offer/presentation/rest/OfferController.java` |
| OFR-012 | offer | public | `GET` | `/api/public/sites/{siteId}/offers` | `list` | 6 | opérationnel et testé | `offer/presentation/rest/PublicOfferController.java` |
| OFR-013 | offer | public | `GET` | `/api/public/sites/{siteId}/offers/{offerId}` | `get` | 6 | opérationnel et testé | `offer/presentation/rest/PublicOfferController.java` |
| ONB-001 | onboarding | utilisateur authentifié | `POST` | `/api/organizations` | `create` | 2 | opérationnel et testé | `onboarding/presentation/rest/OwnedOrganizationController.java` |
| ORG-001 | organization | propriétaire organisation | `GET` | `/api/organizations/{organizationId}` | `findById` | 3 | opérationnel et testé | `organization/presentation/rest/OrganizationController.java` |
| ORG-002 | organization | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/active` | `requireActive` | 3 | opérationnel et testé | `organization/presentation/rest/OrganizationController.java` |
| PAY-001 | payment | webhook fournisseur | `POST` | `/api/webhooks/flutterwave` | `receive` | 8 | opérationnel et testé | `payment/presentation/rest/FlutterwaveWebhookController.java` |
| PAY-002 | payment | public | `POST` | `/api/payments` | `initiate` | 8 | opérationnel et testé | `payment/presentation/rest/PaymentController.java` |
| PAY-003 | payment | public | `GET` | `/api/payments/{id}` | `get` | 8 | opérationnel et testé | `payment/presentation/rest/PaymentController.java` |
| PAY-004 | payment | public | `GET` | `/api/purchases/{purchaseId}/payment` | `byPurchase` | 8 | opérationnel et testé | `payment/presentation/rest/PaymentController.java` |
| PAY-005 | payment | public | `POST` | `/api/payments/{id}/verify` | `verify` | 8 | opérationnel et testé | `payment/presentation/rest/PaymentController.java` |
| ADM-001 | platformadmin | administrateur plateforme | `GET` | `/api/platform/overview` | `overview` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-002 | platformadmin | administrateur plateforme | `GET` | `/api/platform/search` | `search` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-003 | platformadmin | administrateur plateforme | `GET` | `/api/platform/organizations/{id}` | `organization` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-004 | platformadmin | administrateur plateforme | `POST` | `/api/platform/organizations/{id}/suspend` | `suspendOrganization` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-005 | platformadmin | administrateur plateforme | `POST` | `/api/platform/organizations/{id}/reactivate` | `reactivateOrganization` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-006 | platformadmin | administrateur plateforme | `POST` | `/api/platform/organizations/{id}/close` | `closeOrganization` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-007 | platformadmin | administrateur plateforme | `GET` | `/api/platform/identities/{id}` | `identity` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-008 | platformadmin | administrateur plateforme | `POST` | `/api/platform/identities/{id}/suspend` | `suspendIdentity` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-009 | platformadmin | administrateur plateforme | `POST` | `/api/platform/identities/{id}/reactivate` | `reactivateIdentity` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-010 | platformadmin | administrateur plateforme | `GET` | `/api/platform/routers/{id}` | `router` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-011 | platformadmin | administrateur plateforme | `POST` | `/api/platform/routers/{id}/{operation}` | `routerOperation` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-012 | platformadmin | administrateur plateforme | `GET` | `/api/platform/payments/{id}` | `payment` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-013 | platformadmin | administrateur plateforme | `POST` | `/api/platform/payments/{id}/reconcile` | `reconcile` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-014 | platformadmin | administrateur plateforme | `GET` | `/api/platform/payment-anomalies` | `anomalies` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-015 | platformadmin | administrateur plateforme | `GET` | `/api/platform/payment-anomalies/{id}` | `anomaly` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-016 | platformadmin | administrateur plateforme | `POST` | `/api/platform/payment-anomalies/{id}/review` | `reviewAnomaly` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-017 | platformadmin | administrateur plateforme | `POST` | `/api/platform/payment-anomalies/{id}/resolve` | `resolveAnomaly` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-018 | platformadmin | administrateur plateforme | `GET` | `/api/platform/accesses/{id}` | `access` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| ADM-019 | platformadmin | administrateur plateforme | `POST` | `/api/platform/accesses/{id}/revoke` | `revoke` | 12 | opérationnel, preuve partielle | `platformadmin/presentation/rest/PlatformOperationsController.java` |
| PUR-001 | purchase | public | `POST` | `/api/public/sites/{siteId}/checkout` | `create` | 7 | opérationnel et testé | `purchase/presentation/rest/PublicCheckoutController.java` |
| PUR-002 | purchase | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/sites/{siteId}/purchases` | `create` | 7 | opérationnel et testé | `purchase/presentation/rest/PurchaseController.java` |
| PUR-003 | purchase | utilisateur authentifié | `GET` | `/api/purchases/{purchaseId}` | `get` | 7 | opérationnel et testé | `purchase/presentation/rest/PurchaseController.java` |
| PUR-004 | purchase | public | `POST` | `/api/purchases/{purchaseId}/payment` | `markAsPaid` | 7 | opérationnel et testé | `purchase/presentation/rest/PurchaseController.java` |
| PUR-005 | purchase | utilisateur authentifié | `POST` | `/api/purchases/{purchaseId}/payment-failed` | `markAsPaymentFailed` | 7 | opérationnel et testé | `purchase/presentation/rest/PurchaseController.java` |
| PUR-006 | purchase | utilisateur authentifié | `POST` | `/api/purchases/{purchaseId}/cancel` | `cancel` | 7 | opérationnel et testé | `purchase/presentation/rest/PurchaseController.java` |
| REP-001 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/overview` | `overview` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-002 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/sales` | `sales` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-003 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/financial` | `financial` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-004 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/payments` | `payments` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-005 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/access` | `access` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-006 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/sites` | `sites` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-007 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/offers` | `offers` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-008 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/routers` | `routers` | 10 | opérationnel et testé | `reporting/presentation/rest/OrganizationReportingController.java` |
| REP-009 | reporting | administrateur plateforme | `GET` | `/api/platform/reports/overview` | `overview` | 10 | opérationnel et testé | `reporting/presentation/rest/PlatformReportingController.java` |
| REP-010 | reporting | administrateur plateforme | `GET` | `/api/platform/reports/revenue` | `overview` | 10 | opérationnel et testé | `reporting/presentation/rest/PlatformReportingController.java` |
| REP-011 | reporting | administrateur plateforme | `GET` | `/api/platform/reports/infrastructure` | `overview` | 10 | opérationnel et testé | `reporting/presentation/rest/PlatformReportingController.java` |
| REP-012 | reporting | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/reports/sales/export` | `sales` | 10 | opérationnel et testé | `reporting/presentation/rest/ReportingExportController.java` |
| RTR-001 | router | utilisateur authentifié | `POST` | `/api/routers` | `create` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-002 | router | utilisateur authentifié | `GET` | `/api/routers/{routerId}` | `get` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-003 | router | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/routers` | `list` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-004 | router | utilisateur authentifié | `PATCH` | `/api/routers/{routerId}/name` | `rename` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-005 | router | utilisateur authentifié | `GET` | `/api/routers/{routerId}/provisioning` | `provisioning` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-006 | router | utilisateur authentifié | `POST` | `/api/routers/{routerId}/provisioning` | `provision` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-007 | router | utilisateur authentifié | `POST` | `/api/routers/{routerId}/configuration-artifacts` | `artifact` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-008 | router | utilisateur authentifié | `POST` | `/api/routers/{routerId}/suspension` | `suspend` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-009 | router | utilisateur authentifié | `DELETE` | `/api/routers/{routerId}/suspension` | `resume` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| RTR-010 | router | utilisateur authentifié | `POST` | `/api/routers/{routerId}/revocation` | `revoke` | 5 | opérationnel et testé | `router/presentation/rest/RouterController.java` |
| SITE-001 | site | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/sites` | `create` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SITE-002 | site | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/sites` | `list` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SITE-003 | site | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/sites/{siteId}` | `get` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SITE-004 | site | propriétaire organisation | `PATCH` | `/api/organizations/{organizationId}/sites/{siteId}` | `update` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SITE-005 | site | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/sites/{siteId}/suspension` | `suspend` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SITE-006 | site | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/sites/{siteId}/reactivation` | `reactivate` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SITE-007 | site | propriétaire organisation | `DELETE` | `/api/organizations/{organizationId}/sites/{siteId}` | `close` | 4 | opérationnel et testé | `site/presentation/rest/SiteController.java` |
| SUP-001 | support | administrateur plateforme | `GET` | `/api/platform/support/tickets` | `list` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-002 | support | administrateur plateforme | `GET` | `/api/platform/support/tickets/{id}` | `get` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-003 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/start` | `start` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-004 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/request-customer-response` | `waitCustomer` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-005 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/messages` | `message` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-006 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/internal-notes` | `note` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-007 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/resolve` | `resolve` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-008 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/close` | `close` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-009 | support | administrateur plateforme | `POST` | `/api/platform/support/tickets/{id}/reopen` | `reopen` | 11 | opérationnel et testé | `support/presentation/rest/PlatformSupportController.java` |
| SUP-010 | support | public | `POST` | `/api/public/support/tickets` | `create` | 11 | opérationnel et testé | `support/presentation/rest/PublicSupportTicketController.java` |
| SUP-011 | support | public | `GET` | `/api/public/support/tickets/{number}` | `get` | 11 | opérationnel et testé | `support/presentation/rest/PublicSupportTicketController.java` |
| SUP-012 | support | public | `POST` | `/api/public/support/tickets/{number}/messages` | `message` | 11 | opérationnel et testé | `support/presentation/rest/PublicSupportTicketController.java` |
| SUP-013 | support | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/support/tickets` | `create` | 11 | opérationnel et testé | `support/presentation/rest/SupportTicketController.java` |
| SUP-014 | support | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/support/tickets` | `list` | 11 | opérationnel et testé | `support/presentation/rest/SupportTicketController.java` |
| SUP-015 | support | propriétaire organisation | `GET` | `/api/organizations/{organizationId}/support/tickets/{id}` | `get` | 11 | opérationnel et testé | `support/presentation/rest/SupportTicketController.java` |
| SUP-016 | support | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/support/tickets/{id}/messages` | `message` | 11 | opérationnel et testé | `support/presentation/rest/SupportTicketController.java` |
| SUP-017 | support | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/support/tickets/{id}/cancel` | `cancel` | 11 | opérationnel et testé | `support/presentation/rest/SupportTicketController.java` |
| SUP-018 | support | propriétaire organisation | `POST` | `/api/organizations/{organizationId}/support/tickets/{id}/reopen` | `reopen` | 11 | opérationnel et testé | `support/presentation/rest/SupportTicketController.java` |

## Fiches contractuelles par famille

Chaque ligne ci-dessus hérite des conventions communes. Les corps et réponses sont les DTO cités par la signature du handler dans le fichier preuve; le catalogue DTO donne leurs champs.

### Authentification

- Register : `RegisterRequest`; succès 201 + `Location`; `RegistrationResponse`. Login/refresh : 200 `AuthenticationResponse`. Logout : 204. Aucun cookie. Les tokens sont dans JSON.
- Login reçoit implicitement `User-Agent` et l'adresse distante. Refresh et logout reçoivent le refresh token opaque dans le corps. Les erreurs d'identifiants sont volontairement ambiguës.

### Ressources propriétaires

- Les routes organisation/site/router/offer/access/accounting/reporting/audit/support exigent `Authorization: Bearer …`; le contrôle OWNER est effectué dans les services ou contrôleurs. Les créations mutantes peuvent publier des événements Modulith.
- Listes : paramètres `page`/`size` selon signature; lorsqu'ils sont absents la liste n'est pas paginée. Les valeurs et tris exacts sont décrits dans les contrôleurs et le catalogue.

### Achat, paiement et credential publics

- Checkout public ne prend aucune clé d'idempotence : un rejeu crée un nouvel achat et une nouvelle preuve. Paiement et vérification exigent `X-Checkout-Token`; la création de paiement porte aussi `idempotencyKey` dans son JSON. Les deux callbacks internes `/purchases/{id}/payment*` sont explicitement `denyAll` au niveau HTTP.
- La livraison distante reçoit `{"token":"…"}` en POST et répond avec le username, le mot de passe et l'expiration uniquement après projection `APPLIED`; réponse `no-store`.

### Administration

- `/api/platform/**` exige un JWT puis une permission applicative de plateforme; certaines routes utilisent directement `ROLE_SUPER_ADMIN`. Les mutations administratives prennent `AdministrativeCommand` avec motif et parfois clé d'idempotence.

### Effets, rejeu et erreurs

- Un GET est sans effet métier, sauf contrôle d'intégrité/export qui écrit une trace d'audit. Un POST/PATCH/DELETE n'est pas présumé idempotent sans clé ou invariant de service.
- Les erreurs possibles dérivent du handler du module : 400 validation, 401 bearer absent/invalide, 403 portée, 404 absence, 409 conflit/transition/rejeu, 422 selon validation métier, 429 support public, 502/503 projection ou fournisseur, 500 opaque.
