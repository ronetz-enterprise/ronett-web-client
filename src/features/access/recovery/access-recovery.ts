import type { AccessGrant } from "../model/access-grant";
import { publicDeliveryContract } from "../delivery/public-delivery";

/**
 * Reprise après actualisation.
 *
 * Toutes les données de cette page sont relues depuis le backend. Rien n'est
 * conservé dans `localStorage`, `sessionStorage`, une query key, un store global
 * ou l'historique du navigateur, et rien n'est reconstruit à partir d'un
 * précédent écran.
 *
 * Le seul élément placé dans l'URL est l'identifiant opaque du droit d'accès,
 * déjà visible dans la barre d'adresse. Aucun secret, aucun jeton de
 * délivrance et aucune donnée interne du backend n'y figurent.
 */
export const accessResumePolicy = {
  refreshStrategy: "reload-from-backend" as const,
  statusSurvivesReload: true,
  // Aucune étape de délivrance n'existe : rien à reprendre ni à rejouer.
  deliverySurvivesReload: false,
  storesSensitivePayload: false,
  deliveryContractAvailable: publicDeliveryContract.status === "unavailable",
};

/**
 * Un droit dont la projection n'est pas encore appliquée n'est pas présenté
 * comme utilisable. La décision reste celle du backend : cette fonction ne fait
 * que refuser d'affirmer une activation que la vue ne contient pas.
 */
export function isUsableAccess(grant: AccessGrant) {
  return grant.status === "ACTIVE" && grant.projectionStatus === "APPLIED";
}
