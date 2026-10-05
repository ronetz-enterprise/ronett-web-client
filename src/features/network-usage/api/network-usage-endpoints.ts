import { z } from "zod";

/**
 * Consommation réseau : seuls contrats réellement exposés par le backend.
 *
 * Le module backend `networkusage` est vide et le module `accounting` est
 * financier (grand livre, soldes, retraits). Les agrégats réseau proviennent
 * donc du module `reporting`, qui lit ses propres tables de synthèse
 * (`reporting.access_summaries`, `reporting.router_performance`). Aucune table
 * RADIUS n'est lue, ni ici ni par ces endpoints.
 *
 * Les deux routes exigent une membership active et le rôle OWNER.
 */
export const networkUsageEndpoints = {
  /** Agrégats filtrables par période (`from`, `to`, `timeZone`) et `siteId`. */
  accessReport: (organizationId: string) =>
    `/api/organizations/${z.uuid().parse(organizationId)}/reports/access`,
  /** Cumul par routeur : pagination seule, aucun filtre de période. */
  routerReport: (organizationId: string) =>
    `/api/organizations/${z.uuid().parse(organizationId)}/reports/routers`,
  /** Instantané par site (routeurs, offres actives, accès) : pagination seule. */
  siteReport: (organizationId: string) =>
    `/api/organizations/${z.uuid().parse(organizationId)}/reports/sites`,
};

/** Contrats absents du backend : jamais simulés côté client. */
export const deferredNetworkUsageEndpoints = {
  /** Aucune liste ni détail de session (IP, MAC, NAS, début, fin). */
  sessions: null,
  /** Aucune vue des sessions actives ni déconnexion forcée (CoA). */
  activeSessions: null,
  /** `AccessReportView.series` est toujours renvoyée vide. */
  timeSeries: null,
  /** Aucun export de consommation. */
  export: null,
} as const;
