# Sprint 8 — Parcours public et préparation de l’achat

Verdict : **PARTIAL**. Le catalogue et le récapitulatif publics sont livrés. La création d’achat, sa récupération/reprise et l’administration Purchase sont bloquées par les contrats backend actuels. Le frontend ne simule aucune de ces garanties.

## Audit et matrices

Les [matrices publiques et administratives, preuves et tableau de maturité](audit-and-contracts.md) ont été produits avant l’implémentation. Contrôleurs, DTO, domaine, sécurité et API intermodules locaux ont été inspectés. Les contrats historiques de documentation ont été confrontés au code actuel ; aucun endpoint déduit d’une simple classe interne.

Le contexte réel est `siteId`, UUID utilisé explicitement par les endpoints publics Offer. Aucun identifiant public alternatif, slug, nom public ou token de portail n’est exposé. Le backend résout l’organisation depuis le site et impose offre PUBLISHED, même site, parents actifs et devise cohérente. Le visiteur ne choisit jamais d’organisation. Site inexistant, site inactif et catalogue vide sont indiscernables dans la réponse de liste : un message neutre commun les représente.

Le POST public checkout n’accepte pas de clé d’intention ; chaque appel crée un nouvel achat. Le champ `idempotencyKey` du DTO privé ne sert pas à dédupliquer dans le service. Aucune récupération HTTP par intention, ni lecture publique du statut Purchase, n’a été trouvée. Le GET administratif d’achat est protégé globalement par authentification mais sans contrôle de membership dans son contrôleur/service ; aucune liste administrative n’existe. Ces limites empêchent le PASS exigé pour ce sprint.

## Parcours livré

1. L’administrateur utilise sur son portail captif un lien frontend `/connect/{siteId}` correspondant au site. Aucun portail captif n’est créé ici.
2. Le visiteur, sans compte, consulte les cartes d’offres retournées par l’API publique. Nom, description, montant exact, devise, durée, quota, débits et sessions simultanées viennent de cette projection uniquement.
3. « Voir cette offre » ouvre `/connect/{siteId}/offers/{offerId}` et recharge le détail public. Une modification de prix entre liste et sélection est donc visible dans le récapitulatif.
4. L’achat est explicitement annoncé indisponible. Aucun formulaire de coordonnées, bouton de création, faux résultat, paiement ou credential n’est proposé.

Actualiser le catalogue ou le récapitulatif reste possible. Ce rechargement d’une offre **n’est pas une reprise d’achat**. Une offre devenue indisponible produit un état dédié, avec retour vers le catalogue qui sera rechargé. Erreurs temporaires et catalogue vide restent distincts.

## Architecture, routes et cache

- Layout `public-purchase-layout.tsx` : identité Ronetz discrète, contenu et pied de page, sans sidebar, menu membre, sélecteur d’organisation, nom interne de site ou lien administratif.
- `features/offer/queries/public-offers.ts` : DTO public strictement projeté, validation Zod, GET anonymes, validation UUID et site/offre, prix JSON exact via le codec du Sprint 7.
- `features/purchase` : composition du catalogue et du récapitulatif de sélection. Aucun store global et aucun module `public-storefront`.
- Pages minces, sans HTTP. React Router Framework, routes publiques hors guards d’authentification/organisation.
- Routes : `/connect/:siteId` et `/connect/:siteId/offers/:offerId`. Aucune route privée Purchase ni faux écran de résultat/statut.
- Cache public **distinct** du cache administratif, afin qu’un nettoyage de session privée n’interrompe pas un chargement anonyme. Cache vidé au démontage du layout, requêtes annulables, données inactives conservées au plus 60 s.
- Clés : `['public-offers', siteId, {page, size:20}]` et `['public-offer', siteId, offerId]`. Aucun contact, token ou secret. Aucun partage de données vers les clés administratives.
- Pagination serveur de 20 offres, page dans l’URL ; tri serveur conservé. Aucun filtre ou tri inventé. Paramètres monétaires ou organisationnels supplémentaires de l’URL non consommés.

Le socle global conserve sa restauration de session administrative ; les lectures métier publiques utilisent directement le client HTTP avec `credentials: 'omit'`, sans bearer ni membership. Les requêtes publiques ne chargent jamais le Site administratif.

## Prix, modèle et snapshot

PublicOffer reprend uniquement le DTO public : offerId, siteId, name, description, price, accessPolicy, displayOrder. Les métadonnées privées ne sont pas copiées dans le modèle.

Les formatters et le codec précis du Sprint 7 sont réutilisés via le barrel public Offer. BigDecimal et int64 restent des chaînes exactes dans le modèle ; Intl.NumberFormat et BigInt assurent la présentation. Aucun montant calculé ou envoyé depuis le navigateur. Durée en secondes, quota en octets, débits en bit/s, unités SI, null=illimité et sessions distinctes des appareils.

Aucun modèle de snapshot fictif n’est créé. Le DTO Purchase réellement disponible, ses statuts et limites sont décrits dans l’audit : la projection Purchase expose notamment une durée en minutes tronquée, alors que checkout_sessions conserve une politique exacte accessible seulement par des méthodes internes. Le récapitulatif livré présente l’offre courante, jamais un achat historique.

Statuts Purchase documentés : CREATED, PAYMENT_PENDING, PAID, PAYMENT_FAILED, CANCELLED, EXPIRED, FULFILLED. Aucun n’est simulé à l’écran ni confondu avec Payment, Access ou RADIUS.

## Idempotence, récupération et reprise

**Bloquées**, et non remplacées par un verrou UI, un UUID inventé ou un stockage local. Le POST public ne sera pas appelé tant qu’une intention stable et son résultat ne peuvent pas être retrouvés sans doublon. Une réponse perdue après création serait actuellement irrécupérable depuis ce frontend.

Le secret `checkoutToken` retourné par le backend est un token porteur ; il autorise des méthodes internes et des endpoints Payment, pas un endpoint public Purchase de statut. Sa validité de paiement est de 20 min ; l’autorisation de lecture interne est de 24 h. Aucun de ces délais ne permet d’inventer l’expiration de l’achat. Aucune donnée de reprise n’est donc stockée en URL, query key, localStorage ou sessionStorage.

## Données personnelles et sécurité

Aucune coordonnée client collectée. Téléphone/email facultatifs côté contrat checkout, mais sans utilité tant que la création est bloquée. Aucun nouveau log ou analytics ; aucun token checkout reçu ; aucun HTML backend injecté. Métadonnées des routes : noindex/nofollow et no-referrer.

Le code livré n’appelle que les deux GET publics Offer. Aucun appel de création Purchase, de paiement, Flutterwave, credential, AccessGrant, RADIUS, ni endpoint administratif pour alimenter le catalogue. Aucun achat créé par les contrôles du parcours frontend. Les fixtures de qualification sont des organisations/sites/offres locales dédiées.

## Design system

Button, Card, Alert, Empty et Skeleton existants ; wrappers PageHeader, PageLoading, EmptyState, QueryFailure et référence de corrélation. Liste de cartes, navigation paginée avec boutons, récapitulatif sur une colonne, actions tactiles, labels textuels et lien d’évitement. Aucun composant téléchargé, aucune dépendance installée. Aucun formulaire inutile ni notifications transactionnelles éphémères.

Thème global intact : vert primaire clair `oklch(0.508 0.118 165.612)`, sombre `oklch(0.432 0.095 166.913)`, Inter/Manrope, tokens et rayons conservés. SHA-256 de `src/app/styles/app.css` inchangé : `0e36647884623f506d38d1ad648aa3c9f989978e696d7115f35c69c86ca48b47`.

## Qualification

Parcours ponctuels pilotés dans Chromium, frontend sans mocks et backend Spring réel. Pas de suite de tests ajoutée, aucune modification des tests existants ou configuration de coverage. Les outils de qualification et captures sont temporaires sous `/tmp`.

| Vérification                                                         | Résultat                                                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Arrivée anonyme, site valide                                         | Catalogue public affiché sans compte                                                                      |
| Prix, unités, confidentialité                                        | 1,99 EUR, 1 Go, 10 Mbit/s ; nom interne du site et brouillon absents                                      |
| Sélection après modification serveur du prix                         | Récapitulatif à 2,99 EUR, pas l’ancien prix                                                               |
| Actualisation                                                        | Offre rechargée ; aucune reprise Purchase prétendue                                                       |
| Brouillon via URL directe                                            | Offre indisponible, aucune fuite du nom privé                                                             |
| Offre d’un autre site                                                | Refus public 404, aucune donnée étrangère                                                                 |
| UUID malformé                                                        | État indisponible                                                                                         |
| UUID inconnu / catalogue vide                                        | État neutre « Aucune offre disponible »                                                                   |
| Site suspendu                                                        | Aucune offre proposée                                                                                     |
| Erreur 503 simulée                                                   | Erreur persistante avec référence, pas de faux catalogue vide                                             |
| Réseau navigateur                                                    | Uniquement GET publics Offer, sans Authorization ; aucun POST checkout/payment/access                     |
| Mobile 360 px / desktop 1440 px                                      | Catalogue et récapitulatif inspectés, pas de débordement mobile                                           |
| Clair/sombre                                                         | Modes clair et sombre système vérifiés ; actions lisibles après stabilisation du thème                    |
| Accessibilité                                                        | Aucune violation axe dans le contenu principal du récapitulatif ; audit accessibilité complet non réalisé |
| Création idempotente / double clic / résultat inconnu / récupération | Bloqués : garanties backend absentes, aucun POST exposé                                                   |
| Achat expiré / résultat / reprise transactionnelle                   | Bloqués : contrat de statut/reprise public absent                                                         |
| Liste et détail administratifs / isolation Purchase Org-A/Org-B      | Bloqués par absence de liste et d’autorisation tenant suffisante ; pas de requête privée introduite       |

La défaillance initiale de chargement liée au nettoyage du cache de session a été corrigée par le cache public séparé ; le parcours a ensuite été entièrement rejoué. Les scénarios 503 sont simulés explicitement et ne constituent pas une défaillance observée du backend.

Non vérifié : autres navigateurs, lecteurs d’écran, contexte portail signé (absent), authentification d’un achat public (absente), garanties de concurrence transactionnelle (absentes). Le risque administratif est constaté par audit du code ; il n’a pas été exploité sur des achats réels.

## Contrôles techniques

Résultats déjà obtenus : **PASS** pour `npm run typecheck`, `npm run lint`, `npm run build`, `npm run format:check` et `git diff --check`. Les derniers typecheck, lint et build se sont terminés avec un code de sortie 0. Le contrôle de format et de diff précède la finalisation rédactionnelle de ce rapport.

À la demande de l’utilisateur, les vérifications sont arrêtées et seuls les documents sont finalisés. Les serveurs temporaires frontend et backend ont été arrêtés. Aucun nouveau contrôle n’est lancé. Aucune suite de tests existante exécutée pour ce sprint, aucun test modifié ou ajouté, aucun seuil de couverture changé. Aucune installation requise. Aucun changement backend, commit ou déploiement.

## Inventaire

8 fichiers ajoutés :

- `src/app/layouts/public-purchase-layout.tsx`
- `src/features/offer/queries/public-offers.ts`
- `src/features/purchase/components/public-offers.tsx`
- `src/features/purchase/index.ts`
- `src/pages/public-purchase/public-offers-page.tsx`
- `src/pages/public-purchase/purchase-review-page.tsx`
- `docs/frontend/sprint-8/audit-and-contracts.md`
- `docs/frontend/sprint-8/README.md`

2 fichiers modifiés par ce sprint : `src/app/routes.ts` et `src/features/offer/index.ts`. Les autres changements déjà présents dans l’espace de travail proviennent du Sprint 7 ou de l’utilisateur et sont conservés.

## Besoins backend et Sprint 9

Prioritaires : idempotence persistante de création, récupération par intention, statut/reprise publics sécurisés, projection de snapshot exacte, autorisation tenant serveur et liste administrative. Les critères de ces contrats sont détaillés dans l’audit. Le durcissement administratif ne peut pas être remplacé par une vérification frontend après réception de données privées.

Différé Sprint 9 : intégration Payment/Flutterwave, uniquement après disponibilité d’un achat public créé et récupérable de façon sûre. Aucun appel anticipé à ces endpoints. Credentials, AccessGrant, portail captif, consommation, remboursements et reporting restent hors périmètre.
