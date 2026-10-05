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
 * `POST /api/public/access-grants/{id}/credential-delivery` existe mais n'est pas
 * déclaré ici : l'identifiant du droit n'est découvrable par aucun contrat
 * public et la preuve requise n'est jamais distribuée au client.
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
