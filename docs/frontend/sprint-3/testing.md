# Validation finale du Sprint 3

Verdict : PASS pour le périmètre Sprint 3 qualifié localement.

| Commande                                                                                  | Résultat                                                                                           |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| npm ci                                                                                    | Réussite ; 729 packages ; audit npm : zéro vulnérabilité signalée                                  |
| npm run typecheck                                                                         | Réussite                                                                                           |
| npm run lint                                                                              | Réussite, frontières/imports compris                                                               |
| npm run format:check                                                                      | Réussite                                                                                           |
| npm run test -- --coverage                                                                | 144 tests, 18 fichiers, tous réussis                                                               |
| npm run build                                                                             | Build client/SSR réussi                                                                            |
| npm run test:e2e                                                                          | Première passe : 87 réussis, 12 échecs dans la simulation du retour au premier plan                |
| npm run test:e2e -- --grep revalidates                                                    | Réussite après correction de l’événement de test (window, pas document), sur les trois navigateurs |
| npm exec playwright -- test --config=playwright.real.config.ts                            | 1 parcours réel complet réussi, sans MSW                                                           |
| Backend : ./mvnw -Dtest=Sprint3BrowserIntegrationTest,OwnerOnboardingIntegrationTest test | 30 tests HTTP/PostgreSQL réussis, aucun ignoré                                                     |

Les 12 anciens cas de sidebar sont tous réactivés et réussis. Les 12 échecs de la première passe concernaient les nouveaux tests de changement de statut, pas la sidebar ; ils ont été rejoués avec succès. La suite complète sera aussi rejouée avec le Sprint 4.

Couverture V8 : statements 72,51 %, branches 67,52 %, fonctions 67,20 %, lignes 73,56 %. Le périmètre inclut src hors tests, fixtures, composants shadcn générés et entrypoints. Le rapport HTML est dans coverage/index.html. Seul @vitest/coverage-v8 5.0.2 a été ajouté comme dépendance de développement ; aucune version existante du lockfile n’a été modifiée.

Le parcours réel valide CSRF, cookie HttpOnly, login, zéro organisation, création OWNER, actualisation, refus d’Org-B par le frontend et les GET backend, réponse perdue puis rejeu identique, changement de tenant, révocation de son membership et logout révoquant le bearer.

La fixture de révocation conserve un second OWNER conformément au backend. Les comptes et organisations synthétiques créés pour cette qualification restent identifiables par frontend-/foreign- et Qualification ; aucune donnée existante n’a été modifiée. L’instance temporaire 8081 a été arrêtée.

Limites : le déploiement HTTPS de production n’est pas qualifié ici ; Secure=false était réservé au HTTP local. Les fixtures MSW ne prouvent pas la sécurité serveur, d’où les tests réels distincts. Les premiers échecs de redirection et de simulation focus ont été corrigés, sans suppression de scénario.
