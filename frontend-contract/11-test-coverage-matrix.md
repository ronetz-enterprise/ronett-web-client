# Matrice de couverture des parcours critiques

| Parcours | Test existant observé | Niveau | Manque | Risque |
|---|---|---|---|---|
| Inscription | AuthenticationApplicationServiceTest, OwnerOnboardingE2ETest | application + E2E backend | test REST dédié | moyen |
| Connexion/refresh/logout | AuthenticationApplicationServiceTest, AuthorizationE2ETest | application + sécurité E2E | test contrôleur refresh/logout | moyen |
| Organisation OWNER | OwnerOnboardingIntegrationTest | intégration atomique | sélection multi-org | moyen |
| Site | SiteRestTest | REST, sécurité, validation | E2E UI | faible |
| Routeur | RouterRestTest, RouterOutboxIntegrationTest, worker/client tests | REST/provisioning | nœud réel/artefact client | moyen |
| Offre/publication | OfferRestTest, OfferPersistenceIntegrationTest | CRUD/public | contrat généré | faible |
| Achat | PurchasePersistenceIntegrationTest | persistance/domaine | contrôleur checkout et rejeu absent | élevé |
| Paiement | PaymentIntegrationTest, FlutterwaveContractTest | PostgreSQL + fournisseur simulé | réel sandbox E2E | moyen |
| Création accès | AccessApplicationServiceTest, AccessIntegrationTest | domaine/REST/SQL | achat public→grant | moyen |
| Projection RADIUS | AccessIntegration + RemoteAccessNodeAgentE2ETest | SQL partagé | FreeRADIUS réel | élevé prod |
| Credential | RemoteQualificationCreation/E2E | refus avant APPLIED + succès | test contrôleur exhaustif | moyen |
| Administration plateforme | AdministrativeActionReasonTest; sécurité E2E indirecte | domaine seulement | contrôleur/permissions/actions E2E | élevé |

Commandes exécutées pendant les travaux précédents : tests Access ciblés, E2E Node Agent et 55
tests Python. Pour cet audit documentaire, extraction statique `rg/find` et contrôles de couverture
des mappings; aucun test fonctionnel supplémentaire n'était nécessaire et aucun code n'a changé.
