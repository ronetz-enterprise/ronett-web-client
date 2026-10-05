import type { Membership } from "@/features/memberships";
import {
  isFailedProjection,
  isTerminalGrant,
  type AccessGrant,
} from "../model/access-grant";

/**
 * Capacités du module `access`.
 *
 * Le backend exige, pour toutes les routes `/api/access-grants/**` et pour
 * l'émission manuelle, une membership **active** et un rôle **OWNER**, plus une
 * organisation et un site **actifs**. Ces capacités ne font que refléter ce
 * contrat ; l'autorisation effective reste celle du serveur, qui répond `403`.
 *
 * Aucune capacité ne permet de lire un mot de passe : le backend n'expose aucun
 * endpoint de relecture, pour aucun rôle.
 */
export function accessPermissions(active: Membership, grant?: AccessGrant) {
  const readable =
    active.membershipStatus === "ACTIVE" &&
    active.organizationStatus === "ACTIVE";
  const owner = readable && active.role === "OWNER";
  const own = owner && grant?.organizationId === active.organizationId;
  const terminal = grant ? isTerminalGrant(grant) : false;
  // Une projection en échec doit être relancée avant toute autre transition.
  const projectionBlocked = grant
    ? isFailedProjection(grant.projectionStatus)
    : false;
  return {
    canViewAccessGrants: owner,
    canViewAccessDetails: owner,
    // Le service vérifie l'organisation et le site actifs avant d'émettre.
    canCreateManualAccess: owner,
    // `AccessGrant.suspend` : transition valide uniquement depuis ACTIVE.
    canSuspendAccess: own && grant.status === "ACTIVE" && !projectionBlocked,
    // `AccessGrant.activate` : la reprise est proposée depuis SUSPENDED. L'activation
    // initiale fait partie de l'émission et n'est pas une reprise.
    canResumeAccess: own && grant.status === "SUSPENDED" && !projectionBlocked,
    // `AccessGrant.revoke` : valide depuis tout état non terminal, dont
    // PENDING_PROVISIONING.
    canRevokeAccess: own && !terminal && !projectionBlocked,
    canRetryProvisioning: own && projectionBlocked && !terminal,
  };
}

export type AccessPermissions = ReturnType<typeof accessPermissions>;
