# Vérifications

Les tests utilisent uniquement des fixtures synthétiques @example.test et des chaînes fixture-access/fixture-refresh. Aucune vraie identité, clé, cookie ou JWT. MSW ne simule pas /me : l’absence de cette capacité est un résultat du contrat.

## Couverture

- Schémas : email, noms, minimum mot de passe, taille UTF-8 BCrypt et confirmation.
- API : DTO exact, normalisation, credentials omit, rotation/refus réutilisation, logout via ancien token, réponse invalide et réseau.
- Formulaires : succès login/register, absence d’auto-login, générique invalid/inactive, duplicate email, mapping errors et focus, correlationId, 429, reveal, verrou double submit.
- Session : initializing/anonymous, user:null, aucune persistance, cache précédent, logout confirmé/incertain, réponses tardives et annulation.
- Refresh : token valide, échéance timer, cinq 401/une rotation/cinq reprises, 401 tardif et access token identique après rotation, POST/PUT/PATCH/DELETE non rejoués, refus/réseau, second 401 terminal, exclusion endpoints auth, course logout et signal annulé.
- Guards : chargement SSR sans flash, login/register publics, redirection visiteur, session authentifiée et URL externe rejetée.
- E2E : inscription puis login, invalid credentials, retour interne/externe, expiration, logout et erreur serveur, absence de droits plateforme, formulaires clavier/320px/axe, sidebar conservée.
- Reload : test explicite de la perte de session mémoire et retour connexion ; **ce test ne valide pas une restauration**.

## Commandes

```sh
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test -- src/features/authentication src/app/router/guards
npm run build
npm run test:e2e
```

Résultats finaux : 104 tests unitaires/intégration réussis dans 15 fichiers, dont 57 tests ciblés authentication/guards. Typecheck, lint et build client/SSR réussis. La suite complète Playwright réussit ses 63 tests sur Chromium, Firefox et WebKit (dernier passage : 2,7 minutes, sans échec). Format:check et git diff --check réussissent également. Le backend réel, ses origines CORS et TLS ne sont pas testés par MSW. Les rapports Playwright/Vitest ne constituent pas une preuve de ces propriétés.

Un premier passage a détecté un contraste insuffisant du hover du bouton principal (opacité 80 %) et des anciens tests du layout sans AuthProvider. Le contraste et les fixtures de montage ont été corrigés, puis les vérifications relancées.

## Démonstration locale sans backend

```sh
VITE_ENABLE_MOCKS=true npm run dev
```

Uniquement en développement. Identifiants synthétiques : test@example.test / Fixture-pass-123. Utiliser la même valeur de mot de passe pour les scénarios suivants :

| Email synthétique           | Scénario                                     |
| --------------------------- | -------------------------------------------- |
| duplicate@example.test      | Inscription 409                              |
| validation@example.test     | Inscription avec erreur sur prénom           |
| inactive@example.test       | Login générique 401                          |
| limited@example.test        | Login 429                                    |
| network@example.test        | Panne réseau login                           |
| failure@example.test        | Login 500 avec correlationId                 |
| expired@example.test        | Login avec échéance courte et refresh refusé |
| logout-failure@example.test | Login réussi, logout réseau indisponible     |

Toute autre saisie de mot de passe retourne l’erreur générique de connexion (hors scénarios techniques explicites). Les fixtures ne constituent pas un service d’identité : aucun compte réel créé, aucune session restaurée au rechargement, aucun endpoint currentUser ajouté. MSW démarre avec quiet:true et ses handlers ne sont pas importés dans le bundle de production.

Une passe E2E a été perturbée par des événements HMR full-reload pendant l’écriture de la documentation : deux scénarios de sidebar WebKit ont perdu leur session mémoire. Les événements de rechargement sont confirmés dans les traces WebSocket. Exécuter les E2E sur un arbre stable, sans édition ni formatage concurrent ; un rechargement complet coupe volontairement la session mémoire. La relance sans écritures concurrentes réussit les 63 tests.

WebKit émet encore ponctuellement « Failed to fetch manifest patches » lors des navigations/rechargements explicites ; aucune assertion ni parcours ne manque lors du passage final. Ce message du serveur de développement n’est pas présenté comme une validation d’intégration en production.
