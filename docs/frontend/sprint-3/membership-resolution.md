# Résolution des memberships

GET /api/me/memberships renvoie {items:[...]}, sans pagination. L’enveloppe stricte refuse une extension de pagination inattendue afin de ne pas traiter une réponse incomplète comme une liste complète. Les doublons d’organisation et les DTO invalides produisent une erreur.

Chaque item porte membershipId, organizationId, organizationName, organizationStatus, role OWNER, membershipStatus et permissions. Les enums sont ACTIVE/SUSPENDED/CLOSED pour l’organisation et ACTIVE/SUSPENDED/REVOKED pour le membership. Aucun PENDING inventé.

La liste ne suffit pas à autoriser l’ouverture d’un espace. GET /api/me/memberships/{organizationId} est appelé au montage, au retour au premier plan et après une mutation ou un refus serveur. Le backend vérifie permissions, membership et état.

Les 403 stables distinguent suspension/révocation/fermeture uniquement pour les appartenances connues. ORGANIZATION_ACCESS_DENIED reste générique pour une organisation inconnue ou étrangère. Le frontend n’essaie pas d’autres lectures pour découvrir son existence.
