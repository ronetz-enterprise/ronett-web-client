# Parcours métier reconstruits

Chaque flèche représente un appel navigateur, sauf mention contraire.

## A–D : compte, propriétaire, organisation, sites

- Compte : register → login → conserver les tokens en mémoire → refresh à 401 → logout.
  **MANQUANT :** `/me`; le profil ne peut être restauré après rechargement sans mémoriser userId.
- Propriétaire : register/login → `POST /api/organizations`. Cette façade onboarding crée
  organisation et membership OWNER atomiquement. Puis GET organisation.
  **MANQUANT :** liste des organisations du compte et contexte actif serveur.
- Organisation/membres : GET organisation → liste memberships → ajout/suspension/réactivation/
  révocation. **Partiel :** pas d'invitation/recherche email.
- Sites : liste → création → détail → patch → suspension/réactivation/fermeture. Afficher les
  conflits de transition; fermeture via DELETE est métier, pas suppression physique présumée.

## E–F : routeurs et offres

- Routeur : POST `/routers` avec organizationId/siteId → GET → POST provisioning → poll GET
  provisioning ou GET router → POST configuration-artifacts → lifecycle. Afficher PENDING/FAILED.
  **Partiel :** contrat de téléchargement de l'artefact insuffisamment explicite.
- Offre : créer sous site → modifier identité/prix/politique/ordre → publier → vérifier catalogue
  public → suspendre/reprendre/archiver. La politique transmet validity, quota, débits et sessions;
  leur présence ne prouve pas leur enforcement réseau.

## G–I : achat, paiement, accès

- Public : GET offres site → POST checkout sans mécanisme de rejeu → POST payments avec
  `X-Checkout-Token` et `idempotencyKey` → redirection fournisseur éventuelle → POST verify ou poll GET payment et GET
  purchase payment.
- Webhook Flutterwave est serveur-à-serveur. Les callbacks purchase paid/failed sont `denyAll` au
  navigateur et déclenchés en interne.
- Après confirmation, Access est créé de façon événementielle. Pour le local, le credential peut
  être inclus une fois dans le résultat métier; pour `REMOTE_TEST`, utiliser le token dédié sur
  POST credential-delivery, seulement après `APPLIED`.
- **MANQUANT public :** suivi unifié achat → droit Access et identifiant de grant facilement
  découvrable. Polling actuel doit combiner purchase/payment et une donnée obtenue hors contrat.
- Owner : liste/détail des grants, suspension, reprise, révocation, retry projection.

## J–N : exploitation

- Accès manuel : POST manual avec `Idempotency-Key`, bénéficiaire/politique → conserver le secret
  seulement depuis la réponse `no-store`; lister et tracer ensuite sans secret.
- Notifications : liste paginée → unread count → détail → read/read-all. Pas de préférences.
- Accounting/reporting : balance, ledger, retraits; rapports par période/site et exports CSV.
  Les listes performance retournent des listes avec page/size mais sans métadonnées de page.
- Support owner : créer/lister/lire/messages/cancel/reopen. Support public : créer avec preuve
  achat et clé d'idempotence, stocker l'accessToken retourné, puis bearer propre au ticket.
- Admin plateforme : overview/search → ressources → actions motivées; anomalies paiement,
  reporting, audit/intégrité, support. **MANQUANT :** administration des network nodes et découverte
  des permissions courantes.

## États asynchrones et récupération

| Parcours | Attente | Polling conseillé | Récupérable |
|---|---|---|---|
| Routeur provisioning | provisioning terminal | 2–5 s, backoff, plafond | retry endpoint |
| Paiement | confirmation/webhook | 2–5 s puis 10 s | verify idempotent selon service |
| Access projection | PENDING→APPLIED/FAILED | 2–5 s sur grant owner | projection-retries |
| Remote credential | APPLIED et fenêtre ouverte | après état grant | répéter jusqu'à limite |
| Export | synchrone CSV | aucun | relancer GET |

**Attention :** ne pas relancer automatiquement le checkout public sur timeout, car l'API peut
créer un second achat. Demander une action explicite et signaler ce blocage backend.
