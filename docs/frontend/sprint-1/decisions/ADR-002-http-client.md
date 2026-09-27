# ADR-002 — fetch centralisé

Statut : accepté.
Aucun client HTTP n'était présent. fetch fournit AbortSignal, réponses JSON/texte et headers
sans ajouter Axios. Un seul module normalise timeout, erreurs et correlationId.
Bearer explicite, credentials omit conformément aux rapports, aucun interceptor refresh ni
retry mutation. Le client n'a aucune connaissance métier et ne redirige pas.
Conséquence : les features futures valideront leurs DTO et fourniront leurs paramètres contractuels.
