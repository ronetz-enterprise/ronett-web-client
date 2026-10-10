import type { Payment, PurchaseAccessStatus } from "../api/purchase-api";

/**
 * Étape montrée à l'acheteur, déduite de l'état du paiement et de celui de l'achat.
 *
 * - `approval` : le paiement attend la validation sur le téléphone (ou une page de validation).
 * - `preparing` : payé, l'accès est en cours d'activation sur le WiFi (quelques secondes ; jusqu'à
 *   deux minutes si le nœud du site répond mal).
 * - `ready` : l'accès est actif sur le WiFi ; `deliverable` indique si le serveur peut encore
 *   remettre les identifiants (fenêtre de 15 minutes, 5 remises au plus).
 * - `failed` : la dernière tentative a échoué ; `retryable` si le délai de paiement court encore.
 * - `unpaid` : aucune tentative enregistrée (achat créé, paiement pas encore lancé).
 * - `expired` : le délai de paiement de 20 minutes est dépassé sans paiement.
 * - `closed` : achat annulé ou expiré côté serveur.
 */
export type PurchaseStage =
  | { kind: "approval"; payment: Payment }
  | { kind: "preparing" }
  | { kind: "ready"; accessGrantId: string; deliverable: boolean }
  | { kind: "failed"; retryable: boolean }
  | { kind: "unpaid"; retryable: boolean }
  | { kind: "expired" }
  | { kind: "closed" };

const failedPayments = new Set(["FAILED", "CANCELLED", "EXPIRED"]);
const paidPurchases = new Set(["PAID", "FULFILLED"]);
const closedPurchases = new Set(["CANCELLED", "EXPIRED", "PAYMENT_FAILED"]);

export function purchaseStage({
  payment,
  access,
  payableUntil,
  now = Date.now(),
}: {
  payment: Payment | null;
  access: PurchaseAccessStatus | null;
  payableUntil: string;
  now?: number;
}): PurchaseStage {
  // Un accès actif reste « prêt » même quand la remise des identifiants n'est plus possible :
  // l'acheteur ne doit jamais retomber sur « Activation en cours ».
  if (
    access?.accessGrantId &&
    (access.credentialReady || access.accessStatus === "ACTIVE")
  )
    return {
      kind: "ready",
      accessGrantId: access.accessGrantId,
      deliverable: access.credentialReady,
    };
  if (
    (access && paidPurchases.has(access.purchaseStatus)) ||
    payment?.status === "SUCCEEDED"
  )
    return { kind: "preparing" };
  if (access && closedPurchases.has(access.purchaseStatus))
    return { kind: "closed" };
  const payable = now < new Date(payableUntil).getTime();
  if (payment && !failedPayments.has(payment.status))
    return { kind: "approval", payment };
  if (!payable) return { kind: "expired" };
  if (payment) return { kind: "failed", retryable: payable };
  return { kind: "unpaid", retryable: payable };
}

/**
 * Les vérifications s'espacent après deux minutes passées dans la même étape, pour ménager la
 * batterie. `waitedMs` vient de {@link createStageClock}.
 */
export function pollInterval(stage: PurchaseStage["kind"], waitedMs: number) {
  if (stage === "ready" || stage === "expired" || stage === "closed")
    return false;
  if (stage === "failed" || stage === "unpaid") return 15_000;
  return waitedMs < 120_000 ? 4_000 : 10_000;
}

/**
 * Mesure le temps passé dans l'étape en cours. Chaque nouvelle étape repart de zéro : un paiement
 * reçu après trois minutes de validation est suivi toutes les 4 s, pas toutes les 10 s.
 */
export function createStageClock(now: () => number = Date.now) {
  let current: { kind: PurchaseStage["kind"]; since: number } | null = null;
  return (kind: PurchaseStage["kind"]) => {
    const at = now();
    if (current?.kind !== kind) current = { kind, since: at };
    return at - current.since;
  };
}
