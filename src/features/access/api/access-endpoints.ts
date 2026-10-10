import { z } from "zod";

/**
 * Chemins réellement observés dans le backend (module `access`).
 *
 * Les routes de transition n'acceptent **aucun corps** : le backend ne prévoit
 * ni motif, ni raison, ni confirmation. Les filtres serveur se limitent à la
 * pagination ; tout autre critère est filtré côté page et annoncé comme tel.
 */
export const accessEndpoints = {
  organizationList: (organizationId: string) =>
    `/api/organizations/${z.uuid().parse(organizationId)}/access-grants`,
  siteList: (organizationId: string, siteId: string) =>
    `/api/organizations/${z.uuid().parse(organizationId)}/sites/${z
      .uuid()
      .parse(siteId)}/access-grants`,
  detail: (accessGrantId: string) =>
    `/api/access-grants/${z.uuid().parse(accessGrantId)}`,
  manualGrant: (organizationId: string, siteId: string) =>
    `/api/organizations/${z.uuid().parse(organizationId)}/sites/${z
      .uuid()
      .parse(siteId)}/access-grants/manual`,
  suspension: (accessGrantId: string) =>
    `${accessEndpoints.detail(accessGrantId)}/suspension`,
  revocation: (accessGrantId: string) =>
    `${accessEndpoints.detail(accessGrantId)}/revocation`,
  projectionRetries: (accessGrantId: string) =>
    `${accessEndpoints.detail(accessGrantId)}/projection-retries`,
  /**
   * Remise du mot de passe d'un accès préparé par le nœud du site. Le jeton de récupération va
   * dans le corps (POST), jamais dans l'URL ; `503` tant que le réseau n'a pas confirmé l'accès.
   */
  credentialDelivery: (accessGrantId: string) =>
    `/api/public/access-grants/${z.uuid().parse(accessGrantId)}/credential-delivery`,
};

/** Méthodes réelles des transitions métier. */
export const accessTransitions = {
  suspend: (accessGrantId: string) => ({
    method: "POST",
    path: accessEndpoints.suspension(accessGrantId),
  }),
  resume: (accessGrantId: string) => ({
    method: "DELETE",
    path: accessEndpoints.suspension(accessGrantId),
  }),
  revoke: (accessGrantId: string) => ({
    method: "POST",
    path: accessEndpoints.revocation(accessGrantId),
  }),
  retryProjection: (accessGrantId: string) => ({
    method: "POST",
    path: accessEndpoints.projectionRetries(accessGrantId),
  }),
} as const;

export type AccessTransition = keyof typeof accessTransitions;

/**
 * Contrats vérifiés mais hors de ce sprint.
 *
 * `POST /api/public/access-grants/{id}/credential-delivery` sert au gérant juste
 * après une création manuelle sur un site servi par un nœud (voir
 * `credentialDelivery`), et à l'acheteur dans le parcours d'achat public
 * (`features/purchase`), chacun avec le jeton reçu à la création.
 *
 * Le module `accounting` côté backend est financier (grand livre, soldes,
 * retraits) : il n'expose aucune session réseau, et son autorisation tenant est
 * absente. Aucun de ces endpoints n'est donc exposé.
 */
export const deferredAccessEndpoints = {
  /** Aucun lecteur HTTP de `access.access_changes`. */
  changeHistory: null,
  /** Aucune projection de `attemptCount`, `nextAttemptAt` ou `lastErrorCode`. */
  projectionDiagnostics: null,
  /** Aucun endpoint réseau : sessions, volumes, IP, MAC, CoA, export. */
  accountingSessions: null,
} as const;
