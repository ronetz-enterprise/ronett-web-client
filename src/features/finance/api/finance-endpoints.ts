import { z } from "zod";

const org = (id: string) => `/api/organizations/${z.uuid().parse(id)}`;

/** Contrats du module backend `accounting` (grand livre en partie double, retraits, remboursements). */
export const financeEndpoints = {
  balance: (organizationId: string) =>
    `${org(organizationId)}/accounting/balance`,
  ledger: (organizationId: string) =>
    `${org(organizationId)}/accounting/ledger`,
  withdrawals: (organizationId: string) => `${org(organizationId)}/withdrawals`,
  withdrawalCancellation: (organizationId: string, withdrawalId: string) =>
    `${org(organizationId)}/withdrawals/${z.uuid().parse(withdrawalId)}/cancellation`,
  refunds: (organizationId: string, paymentId: string) =>
    `${org(organizationId)}/payments/${z.uuid().parse(paymentId)}/refunds`,
};
