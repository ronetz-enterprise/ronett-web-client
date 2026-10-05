import { describe, expect, it } from "vitest";
import type { Withdrawal } from "../model/finance";
import { withdrawalTimeline } from "./finance-overview";

const base: Withdrawal = {
  id: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c20",
  organizationId: "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c21",
  amount: 5000,
  currency: "XAF",
  network: "MTN",
  country: "CM",
  maskedMsisdn: "6•••••12",
  recipientName: "Ada",
  status: "PENDING_APPROVAL",
  requestedAt: "2026-09-01T10:00:00+00:00",
  decidedAt: null,
  decisionReason: null,
  completedAt: null,
  failureReason: null,
};
const ids = (w: Withdrawal) => withdrawalTimeline(w).map((e) => e.id);

describe("withdrawalTimeline", () => {
  it("montre les étapes à venir d'un retrait en attente", () => {
    const steps = withdrawalTimeline(base);
    expect(ids(base)).toEqual(["requested", "approved", "paid"]);
    expect(steps.filter((s) => s.upcoming).map((s) => s.id)).toEqual([
      "approved",
      "paid",
    ]);
  });
  it("termine la frise sur un refus", () => {
    expect(ids({ ...base, status: "REJECTED" })).toEqual([
      "requested",
      "rejected",
    ]);
  });
  it("date le versement effectué", () => {
    const at = "2026-09-02T10:00:00+00:00";
    const steps = withdrawalTimeline({
      ...base,
      status: "COMPLETED",
      decidedAt: at,
      completedAt: at,
    });
    expect(steps.at(-1)).toMatchObject({ id: "paid", title: "Versé", at });
  });
});
