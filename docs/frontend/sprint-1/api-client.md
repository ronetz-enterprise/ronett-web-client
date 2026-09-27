# Client HTTP

fetch natif centralisé dans src/shared/api/http-client.ts. Aucun client HTTP n'existait :
Axios serait une dépendance supplémentaire inutile (ADR-002).
baseUrl provient de la configuration Zod; seuls les chemins relatifs commençant par / sont acceptés,
sans // ni backslash. Les redirections fetch sont refusées pour éviter de transférer un bearer.

- Accept JSON/ProblemDetail, Content-Type JSON uniquement avec un corps.
- Authorization Bearer uniquement si accessToken est explicitement fourni à cet appel.
- credentials omit : aucun cookie selon le contrat 02.
- cache no-store, sans persistance ni logging des entrées/réponses sensibles.
- Timeout 15 s configurable; AbortSignal propagé; nettoyage systématique des timers/listeners.
- 204 retourne undefined, JSON décodé, texte/CSV retourne une chaîne.
- Aucun retry, refresh, toast ou redirect automatique.
- Aucun ajout de organizationId; chaque feature suivra le chemin/body contractuel de son endpoint.

ApiError distingue HTTP, réseau, timeout, annulation et JSON invalide.
Le statut HTTP transport fait autorité; le corps peut fournir le ProblemDetail.
X-Correlation-Id de la réponse prévaut, puis correlationId du corps. Aucun ID généré côté client.
Les headers de requête explicitement fournis ne sont pas réécrits sauf Content-Type du JSON.

Le type générique d'une réponse n'est pas une validation runtime de DTO. Les prochaines features
doivent valider les contrats incertains avec Zod. Pas d'API inventée, aucun endpoint métier appelé.
