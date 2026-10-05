import { z } from "zod";

const amount = z.number();
const instant = z.iso.datetime({ offset: true });

export const balanceSchema = z.object({
  organizationId: z.uuid(),
  availableAmount: amount,
  reservedAmount: amount,
  paidOutAmount: amount,
  currency: z.string().length(3),
});
export type Balance = z.infer<typeof balanceSchema>;

export const ledgerTransactionSchema = z.object({
  id: z.uuid(),
  reference: z.string(),
  type: z.string(),
  grossAmount: amount,
  commissionAmount: amount,
  netAmount: amount,
  currency: z.string().length(3),
  externalReference: z.string().nullable(),
  createdAt: instant,
});
export type LedgerTransaction = z.infer<typeof ledgerTransactionSchema>;

export const ledgerPageSchema = z.object({
  content: z.array(ledgerTransactionSchema),
  page: z.number().int(),
  size: z.number().int(),
  totalElements: z.number().int(),
  totalPages: z.number().int(),
});

export const withdrawalSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  amount,
  currency: z.string().length(3),
  network: z.string(),
  country: z.string(),
  maskedMsisdn: z.string(),
  recipientName: z.string(),
  status: z.string(),
  requestedAt: instant,
  decidedAt: instant.nullable(),
  decisionReason: z.string().nullable(),
  completedAt: instant.nullable(),
  failureReason: z.string().nullable(),
});
export type Withdrawal = z.infer<typeof withdrawalSchema>;

export const withdrawalPageSchema = z.object({
  content: z.array(withdrawalSchema),
  page: z.number().int(),
  size: z.number().int(),
  totalElements: z.number().int(),
  totalPages: z.number().int(),
});

export const refundSchema = z.object({
  refundId: z.uuid(),
  paymentId: z.uuid(),
  amount,
  currency: z.string().length(3),
  status: z.string(),
});

/** Effet de chaque type de mouvement sur le solde disponible de l'organisation. */
export const ledgerTypeLabels: Record<
  string,
  { label: string; sign: 1 | -1 | 0 }
> = {
  SALE: { label: "Vente", sign: 1 },
  WITHDRAWAL: { label: "Retrait réservé", sign: -1 },
  WITHDRAWAL_RELEASE: { label: "Retrait annulé", sign: 1 },
  PAYOUT: { label: "Versement effectué", sign: 0 },
  PAYOUT_REVERSAL: { label: "Versement annulé", sign: 1 },
  REFUND: { label: "Remboursement client", sign: -1 },
  REFUND_SETTLEMENT: { label: "Remboursement réglé", sign: 0 },
  REFUND_REVERSAL: { label: "Remboursement refusé", sign: 1 },
  ADJUSTMENT: { label: "Ajustement", sign: 0 },
};

export const withdrawalStatusLabels: Record<
  string,
  { label: string; tone: "neutral" | "pending" | "success" | "danger" }
> = {
  PENDING_APPROVAL: { label: "En attente d’approbation", tone: "pending" },
  PROCESSING: { label: "Versement en cours", tone: "pending" },
  COMPLETED: { label: "Versé", tone: "success" },
  FAILED: { label: "Échoué", tone: "danger" },
  REJECTED: { label: "Refusé", tone: "danger" },
  CANCELLED: { label: "Annulé", tone: "neutral" },
  REVERSED: { label: "Annulé par l’opérateur", tone: "danger" },
};

export const networkLabels: Record<string, string> = {
  MTN: "MTN Mobile Money",
  ORANGEMONEY: "Orange Money",
};

/** Seuil d'approbation par défaut du backend (`accounting.withdrawal.approval-threshold`). */
export const APPROVAL_THRESHOLD = 100_000;
export const MINIMUM_WITHDRAWAL = 1_000;

/** Paiement d'une vente : référence `SALE:<paymentId>` du grand livre. */
export function salePaymentId(tx: LedgerTransaction) {
  if (tx.type !== "SALE") return null;
  const id = tx.reference.slice("SALE:".length);
  return z.uuid().safeParse(id).success ? id : null;
}

export function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "XAF" || currency === "XOF" ? 0 : 2,
  }).format(value);
}

export function newIdempotencyKey() {
  return crypto.randomUUID();
}

export const financeRoutes = {
  overview: (organizationId: string) =>
    `/app/${z.uuid().parse(organizationId)}/finance`,
  withdrawals: (organizationId: string) =>
    `/app/${z.uuid().parse(organizationId)}/finance?tab=withdrawals`,
};
