# Catalogue DTO et enums

## Conventions

| Type Java | JSON | Format/contrainte |
|---|---|---|
| UUID | string | UUID canonique |
| Instant | string | ISO-8601 avec offset/UTC |
| LocalDate | string | `YYYY-MM-DD` |
| BigDecimal | number | ne pas convertir par flottant pour calcul métier |
| devise | string | généralement code ISO, XAF fréquent; validation variable |
| durée | integer | secondes |
| téléphone | string | checkout : `+[1-9][0-9]{7,14}` |
| email | string | `@Email`, taille généralement 255 |
| page | object | `content,page,size,totalElements`; certains ajoutent `totalPages` |

## DTO exposés principaux

| Famille | Requêtes | Réponses | Contraintes/sensibilité |
|---|---|---|---|
| Auth | Register, Login, RefreshToken, Logout | RegistrationResponse, AuthenticationResponse | password 8–72 octets; tokens secrets |
| Identity | Create/UpdateUserIdentityRequest | UserIdentityView | email, noms; statut ACTIVE/SUSPENDED/CLOSED |
| Organization | CreateOrganizationCommand | OrganizationView, ActivityResponse | nom/devise; domaine API directement exposé |
| Membership | CreateMembershipRequest | MembershipView | UUID utilisateur, rôle; isolation org |
| Site | CreateSiteRequest, UpdateSiteRequest | SiteView | timezone IANA, nom, adresse, statut |
| Router | CreateRouterRequest, RenameRouterRequest | RouterView | lifecycle/provisioning/connectivity en String |
| Offer | Create/Update, ChangePrice, ChangeAccessPolicy, DisplayOrder | OfferResponse/PublicOfferResponse/Page | validity 1..31536000; montants BigDecimal |
| Purchase | checkout Request, Create/Cancel/paid/failed | PurchaseResponse/PurchaseView | checkout proof sensible |
| Payment | Request inline | PaymentView | idempotencyKey, téléphone, fournisseur |
| Access | ManualAccessRequest/PolicyRequest, Claim | AccessGrantView, IssuanceResult, CredentialDelivery | mot de passe en clair très sensible, `no-store` |
| Accounting | CreateWithdrawalRequest | Balance/Ledger/Withdrawal responses | montants et références financières |
| Notification | MarkReadRequest | NotificationResponse/List/UnreadCount | contenu potentiellement personnel |
| Reporting | query params/ReportingFilters | overview, sales, financial, access, performances | agrégats financiers |
| Audit | AuditSearchCriteria | AuditEntryView/AuditPageView | IP/user-agent/métadonnées sensibles possibles |
| Support | CreateSupportTicketRequest, AddMessage | ticket/page/message/anonymous-created | email, téléphone, texte, accessToken sensible |
| Admin | AdministrativeCommand | action/search et vues métier directes | motif et confirmation requis selon action |

## Enums exposés

- Identité : `ACTIVE`, `SUSPENDED`, `CLOSED`.
- Reporting : `DAY`, `WEEK`, `MONTH`.
- Router admin : `RETRY_PROVISIONING`, `SUSPEND`, `REACTIVATE`.
- Support : catégories, priorités, statuts et visibilité définis dans `support.domain` mais exposés
  directement par les DTO REST.
- Plusieurs statuts offer/purchase/payment/access/router sont sérialisés comme `String`; le client
  doit les traiter comme unions ouvertes tant qu'un OpenAPI versionné n'existe pas.

**ANOMALIES :** objets API/domain directement retournés; deux implémentations de `PageResult`;
réponses paginées inconsistantes; validations de support principalement dans le service plutôt que
Jakarta; enums transformés en String dans plusieurs vues.

