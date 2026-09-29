# ADR-010 — Clés tenant

Décision confirmée : ["organization", organizationId, resource, ...parts] pour chaque donnée tenant. La liste courante et le profil restent globaux au compte. Annulation et suppression ciblées au switch ; nettoyage complet au logout. Les réponses tardives ne se mélangent pas entre tenants.
