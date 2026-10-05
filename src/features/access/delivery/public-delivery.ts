import type { AccessGrant } from "../model/access-grant";

/**
 * Livraison publique du credential : protocole **absent**.
 *
 * Le backend expose `POST /api/public/access-grants/{id}/credential-delivery`,
 * mais le parcours client ne peut pas l'atteindre : aucun contrat public ne
 * retourne l'identifiant du droit, la preuve exigée (jeton de délivrance dédié
 * ou `checkoutToken`) n'est distribuée à personne, et l'enveloppe chiffrée
 * n'est écrite qu'en mode de qualification `REMOTE_TEST` (profil `test`).
 *
 * Ce module ne contient volontairement aucune fonction de requête, aucun jeton,
 * aucun conteneur de secret et aucun repli de démonstration. Il ne décrit que ce
 * qui est vérifié, pour interdire toute implémentation simulée.
 */
export const publicDeliveryContract = {
  status: "unavailable" as const,
  statusEndpoint: false,
  claimEndpoint: false,
  acknowledgementEndpoint: false,
  regenerationEndpoint: false,
  portalUrl: false,
} as const;

/**
 * Ce que l'interface peut affirmer à partir des seules données du backend.
 *
 * - `credential-missing` : aucun identifiant n'est attaché au droit.
 * - `credential-issued` : un identifiant existe. Sa présence ne dit rien de la
 *   disponibilité du mot de passe, que le backend n'expose à personne.
 *
 * Aucun état « disponible », « réclamé » ou « expiré » n'est introduit : ces
 * états appartiendraient à un contrat de délivrance inexistant.
 */
export type CredentialExposure =
  { kind: "credential-missing" } | { kind: "credential-issued" };

export function credentialExposure(grant: AccessGrant): CredentialExposure {
  return grant.username
    ? { kind: "credential-issued" }
    : { kind: "credential-missing" };
}
