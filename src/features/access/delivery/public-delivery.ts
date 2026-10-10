import type { AccessGrant } from "../model/access-grant";

/**
 * Remise du mot de passe vue depuis l'espace gérant : **aucune** action possible.
 *
 * L'acheteur récupère lui-même ses identifiants sur son téléphone, dans le parcours d'achat
 * public (`features/purchase`) : `POST /api/public/access-grants/{id}/credential-delivery` avec le
 * jeton d'achat gardé par son navigateur, 5 fois au plus pendant 15 minutes. Le gérant, lui, ne
 * détient ni ce jeton ni une route pour renvoyer ou régénérer un mot de passe : cet objet le
 * décrit, pour que l'espace gérant n'annonce aucune remise qu'il ne peut pas faire.
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
