# Sécurité vérifiée et limites

Les blocages du premier rapport sont corrigés dans le backend actualisé. Le frontend utilise exclusivement le transport web cookie/CSRF et les endpoints courants vérifiés. Les refus interorganisation ont été exercés dans les tests backend et dans Playwright sans MSW.

Aucun access/refresh token dans localStorage, sessionStorage, l’URL ou les logs applicatifs. Le refresh reste HttpOnly. Seule l’intention non secrète de création (clé UUID, nom, devise) est persistée par userId ; elle n’accorde aucun droit et ne s’affiche pas sous un autre compte. Elle reste présente après logout si sa résolution est incertaine, conformément au protocole de reprise après reconnexion.

Cookie SameSite Strict : frontend/API doivent partager le même site. La configuration réelle doit autoriser l’origine exacte, jamais *. La qualification locale a utilisé localhost:4174 → localhost:8081, Secure=false pour HTTP uniquement. Le serveur 8080 existant n’a pas été reconfiguré.

Les DTO entrants sont validés. Le rôle OWNER provient du serveur. Les erreurs sont échappées par React et leurs détails techniques ne sont pas rendus. platformAdmin ne donne aucun bypass tenant. Les chemins de retour sont filtrés.

Le logout nettoie immédiatement l’état et les caches, puis révoque la session serveur ; les opérations cookie en cours sont attendues pour éviter une réauthentification tardive. Échec serveur : révocation non confirmée annoncée. Une réponse tardive de l’ancien compte ne peut pas réinjecter son contenu.

## Limites explicites

- Sans Web Locks, coordination du refresh limitée au provider ; les navigateurs modernes qualifiés disposent de Web Locks.
- Pas de notification push de révocation : détection au premier plan, à la prochaine requête ou après une mutation ; le contrôle périodique est désactivé. Le backend refuse immédiatement les appels non autorisés.
- Une clé expirée ou un stockage navigateur corrompu exige une vérification explicite ; aucune recréation automatique.
- Le test réel HTTP local ne remplace pas une qualification du déploiement HTTPS final.
- Les fixtures MSW simulent le serveur avec des données synthétiques dans sessionStorage et un cookie msw_session non HttpOnly. Ce stockage appartient uniquement au simulateur de développement, jamais au code de session de production. Les tests réels vérifient le vrai cookie HttpOnly.
- Le lot réel crée des comptes et organisations synthétiques dédiés ; aucune donnée utilisateur existante n’est modifiée.

Le Sprint 4 reste limité à ses futurs écrans d’administration des membres/paramètres. Aucune de ces capacités n’est exposée par l’interface de ce sprint.
