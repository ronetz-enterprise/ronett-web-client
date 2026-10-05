import { describe, expect, it } from "vitest";
import {
  decisionReasonSchema,
  platformCapabilities,
  searchableQuery,
  type PaymentAnomaly,
} from "./platform";
import { anomalyTimeline } from "../components/platform-finance";

describe("searchableQuery", () => {
  it("accepte un identifiant complet ou un email", () => {
    expect(searchableQuery(" 3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c20 ")).toBe(
      "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c20",
    );
    expect(searchableQuery("ada@example.test")).toBe("ada@example.test");
  });
  it("refuse un fragment que le serveur ne sait pas chercher", () => {
    expect(searchableQuery("Douala")).toBeNull();
    expect(searchableQuery("3f6c1f5e")).toBeNull();
  });
});

describe("decisionReasonSchema", () => {
  it("applique les règles du serveur", () => {
    expect(decisionReasonSchema.safeParse("court").success).toBe(false);
    expect(
      decisionReasonSchema.safeParse("Montant vérifié avec <b>").success,
    ).toBe(false);
    expect(
      decisionReasonSchema.safeParse("Le token du client était visible")
        .success,
    ).toBe(false);
    expect(
      decisionReasonSchema.safeParse("Bénéficiaire vérifié par téléphone")
        .success,
    ).toBe(true);
  });
});

describe("platformCapabilities", () => {
  it("n'autorise les décisions financières qu'avec leurs permissions", () => {
    const base = { userId: crypto.randomUUID(), administrator: true };
    expect(
      platformCapabilities({ ...base, permissions: ["platform:read"] })
        .canApproveWithdrawals,
    ).toBe(false);
    expect(
      platformCapabilities({
        ...base,
        permissions: ["platform:withdrawal:approve"],
      }).canApproveWithdrawals,
    ).toBe(true);
  });
});

describe("anomalyTimeline", () => {
  it("laisse en attente les étapes non atteintes", () => {
    const anomaly: PaymentAnomaly = {
      eventId: crypto.randomUUID(),
      paymentId: null,
      purchaseId: null,
      code: "AMOUNT_MISMATCH",
      occurredAt: "2026-09-01T10:00:00+00:00",
      correlationId: null,
      status: "OPEN",
      reviewedBy: null,
      reviewedAt: null,
      resolvedBy: null,
      resolvedAt: null,
      resolution: null,
    };
    expect(
      anomalyTimeline(anomaly)
        .filter((step) => step.upcoming)
        .map((step) => step.id),
    ).toEqual(["reviewed", "resolved"]);
  });
});
