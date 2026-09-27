# Configuration des environnements

Les variables applicatives sont lues par src/shared/config/environment.ts. L’entrée client utilise aussi la constante de compilation import.meta.env.DEV pour éliminer entièrement l’import MSW du build. Aucun composant ne lit directement les variables d’environnement.
La validation Zod rejette les configurations absentes, les environnements inconnus,
les URLs non HTTP(S), les credentials embarqués et les flags booléens non textuels.
Une configuration invalide interrompt le démarrage avec un message ne recopiant pas les valeurs.

| Variable          | Contrat                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| VITE_API_BASE_URL | URL HTTP(S) du backend sans query/fragment/credentials, sans /api ajouté automatiquement |
| VITE_APP_ENV      | development, test, staging ou production                                                 |
| VITE_ENABLE_MOCKS | chaîne true ou false                                                                     |

Aucune valeur secrète. VITE_* est visible dans le bundle navigateur.
Les fichiers .env.development et .env.test sont versionnables; .env.local et .env.*.local sont ignorés.
En production, les trois valeurs doivent être fournies au build (exemple dans README).
La CI utilise production/false pour le build et test/true dans le serveur Playwright.
Les mocks navigateur ne sont chargés qu'en mode Vite développement et si le flag est actif.

.env.production fournit des valeurs locales sans secret pour que le build soit exécutable directement. Remplacer VITE_API_BASE_URL au build avant tout déploiement réel.
