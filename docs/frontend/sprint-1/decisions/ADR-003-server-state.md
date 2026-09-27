# ADR-003 — TanStack Query sans persistance

Statut : accepté.
TanStack Query 5.104 était déjà installé. Un client par arbre React évite le partage SSR.
Clés organisationnelles obligatoires et purge à la sortie/changement; aucune donnée sensible
persistée ou mise en cache. Retry GET borné, mutations jamais rejouées.
Aucun Redux/Zustand ou provider métier global n'est nécessaire pour ce sprint.
