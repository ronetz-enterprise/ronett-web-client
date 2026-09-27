# Manquements backend

| Priorité | Preuve observée | Conséquence frontend | Recommandation | Contournement | Responsable |
|---|---|---|---|---|---|
| P0 | CORS `*` + credentials | origine hostile autorisée | allowlist par environnement | aucun acceptable en prod | authentication |
| P0 | IdentityController protégé seulement par authentification globale; contrôle fin non visible | risque lecture/mutation d'un autre compte | auto accès ou permission admin explicite + tests | ne pas exposer UI admin identity | identity/security |
| P1 | checkout public ne reçoit aucune clé de rejeu | timeout peut créer plusieurs achats | Idempotency-Key persistant lié au contenu | aucun retry automatique | purchase |
| P1 | support public lit `Idempotency-Key` mais ne l'utilise pas | tickets dupliqués au rejeu | persister et vérifier la clé | aucun retry automatique | support |
| P1 | aucun `/me` | restauration et guards impossibles | profil + memberships + permissions | mémoriser profil de login, fragile | authentication |
| P1 | aucune liste des organisations d'un utilisateur | sélecteur impossible | `GET /api/me/organizations` paginé | conserver org créée | membership |
| P1 | permissions plateforme non exposées | menus/guards admin incertains | les inclure dans `/me` | laisser le serveur refuser | platformadmin |
| P1 | aucun OpenAPI | types manuels et dérive | springdoc + snapshot CI segmenté | fixtures maintenues | plateforme |
| P1 | pas de suivi public achat→access grant | livraison post-paiement bloquée | vue checkout status unifiée | polling payment seulement insuffisant | purchase/access |
| P1 | callbacks purchase HTTP présents mais denyAll | contrat trompeur | supprimer du contrôleur ou authentifier interne | navigateur interdit | purchase/security |
| P1 | network_nodes sans contrôleur | admin nœud impossible | API plateforme sécurisée | opération SQL interdite | router |
| P2 | erreurs module hétérogènes | mapping fragile | code/type stable global | mapper d'abord status | tous |
| P2 | pages et tris non uniformes | composants multiples | enveloppe page commune et tri documenté | adaptateurs frontend | tous |
| P2 | statuts sérialisés en String | unions inconnues | enums OpenAPI versionnées | union ouverte + fallback | router/offer/access |
| P2 | support DTO peu annotés | erreurs tardives | Bean Validation taille/formats | validation UX sans présumer serveur | support |
| P2 | refresh réutilisé sans révocation de famille visible | détection vol limitée | rotation familiale/reuse detection | logout utilisateur | authentication |
| P3 | préférences notifications absentes | écran impossible | endpoints préférences | masquer écran | notification |
| P3 | filtres accounting limités | UX recherche réduite | filtres/tri documentés | filtrage page courante | accounting |
