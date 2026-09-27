# Évaluation OpenAPI

**OBSERVÉ :** aucun fichier OpenAPI/Swagger, aucune dépendance springdoc et aucune annotation
OpenAPI trouvés. Un client ne peut pas être généré de façon sûre.

**RECOMMANDATION :** ajouter springdoc, documenter security bearer, ProblemDetail, exemples,
contraintes et réponses; produire quatre documents : public, owner, plateforme, interne. Exclure
webhook et callbacks internes du document navigateur public. Générer un snapshot JSON en CI,
valider sa dérive et exécuter des tests de compatibilité sur les clients.

L'introduction d'OpenAPI devra corriger avant publication les DTO domaine exposés, les enums String,
les routes `denyAll` et les divergences de pagination. L'inventaire présent reste la référence
auditée jusqu'à ce contrôle automatisé.

