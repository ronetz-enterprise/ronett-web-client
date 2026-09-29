# ADR-008 — Organisation dans l’URL

Décision confirmée : /app/:organizationId est l’intention de navigation. Le UUID est validé syntaxiquement puis par GET /api/me/memberships/{id}. L’URL seule ne donne aucun droit. Les helpers centralisent les liens ; aucun contexte basé uniquement sur localStorage.
