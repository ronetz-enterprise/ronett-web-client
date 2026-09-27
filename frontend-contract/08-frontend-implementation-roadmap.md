# Roadmap frontend

| Phase | Objectif / acteur | Pages | État nécessaire | Entrée et acceptation | Tests | Blocage/simulation |
|---:|---|---|---|---|---|---|
| 0 | socle tous acteurs | shell, erreurs | env, HTTP, session mémoire, correlation | build + mocks + ProblemDetail | unit/contract | OpenAPI absent; types manuels |
| 1 | authentification | register/login/logout | tokens, expiry, refresh mutex | 401→refresh unique | sécurité/session | `/me` simulé ou profil minimal |
| 2 | onboarding OWNER | création organisation | userId, organizationId | OWNER créé et détail accessible | parcours | liste organisations manquante |
| 3 | organisation/membres | dashboard, membres | active org, rôles | isolation org | guards | invitation simulable, pas inventer API |
| 4 | sites | liste/formulaire/détail | site courant, pagination | lifecycle complet | validation/transition | aucun majeur |
| 5 | routeurs | liste/détail/provisioning | polling opérations | états terminal/erreur | polling | artefact à clarifier |
| 6 | offres | CRUD/publication | drafts, policy | catalogue public reflète publication | formulaires | enums ouvertes |
| 7 | checkout public | portail/catalogue/récap | site, offer, proof | rejeu stable | idempotence | résolution site externe |
| 8 | paiement | méthode/attente/résultat | payment, redirect, polling | confirmed/failed | reprise | webhook hors navigateur |
| 9 | accès | attente/credential | grant, retrieval token | no-store et secret éphémère | sécurité/rejeu | découverte grant public |
| 10 | exploitation | accès manuels, notifications, finances, rapports | filtres/pages | exports et transitions | accessibilité/charts | préférences absentes |
| 11 | support/audit | tickets et journal | token ticket/filtres | isolation et CSV | auth/rate limit | aucun majeur |
| 12 | plateforme | supervision/actions | permissions, motif, confirmation | refus par permission | admin guards | permissions `/me` absentes |

Chaque phase dépend des précédentes, sauf le checkout public (7), développable après le socle et
les contrats offers/purchase. Les prompts associés détaillent endpoints et critères.

