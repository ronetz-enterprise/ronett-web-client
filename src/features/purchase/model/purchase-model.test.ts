import { describe, expect, it } from "vitest";
import {
  formatLocalNumber,
  guessNetwork,
  isMobileNumber,
  maskNumber,
  paymentFormSchema,
  toInternational,
} from "./mobile-money";
import {
  createStageClock,
  purchaseStage,
  pollInterval,
} from "./purchase-progress";
import { safeHotspotLogin } from "./purchase-session";
import type { Payment, PurchaseAccessStatus } from "../api/purchase-api";

const purchaseId = "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10";
const grant = "9b2f5a3e-6c1d-4e8f-a7b0-1c2d3e4f5a6b";
const later = new Date(Date.now() + 600_000).toISOString();
const earlier = new Date(Date.now() - 1_000).toISOString();
const payment = (status: Payment["status"]): Payment => ({
  id: grant,
  purchaseId,
  amount: "100",
  currency: "XAF",
  status,
  actionType: "payment_instruction",
  actionUrl: null,
  createdAt: earlier,
  confirmedAt: null,
});
const access = (
  purchaseStatus: string,
  credentialReady = false,
): PurchaseAccessStatus => ({
  purchaseId,
  purchaseStatus,
  accessGrantId: credentialReady || purchaseStatus === "PAID" ? grant : null,
  accessStatus: null,
  expiresAt: null,
  credentialReady,
});

describe("numéro mobile money", () => {
  it("accepte un numéro local ou international et le met au format du serveur", () => {
    expect(isMobileNumber("677 11 22 33")).toBe(true);
    expect(isMobileNumber("+237 6 77 11 22 33")).toBe(true);
    expect(toInternational("6 77 11 22 33")).toBe("+237677112233");
    expect(formatLocalNumber("677112233")).toBe("6 77 11 22 33");
    expect(maskNumber("677112233")).toBe("6 •• •• •• 33");
  });
  it("refuse un numéro qui n'est pas mobile", () => {
    expect(isMobileNumber("222 11 22 33")).toBe(false);
    expect(isMobileNumber("67711")).toBe(false);
    expect(
      paymentFormSchema.safeParse({ network: "MTN", phone: "2221", email: "" })
        .success,
    ).toBe(false);
  });
  it("présélectionne l'opérateur seulement pour les préfixes sûrs", () => {
    expect(guessNetwork("677112233")).toBe("MTN");
    expect(guessNetwork("699112233")).toBe("ORANGEMONEY");
    expect(guessNetwork("620000000")).toBeNull();
  });
});

describe("étape de l'achat", () => {
  it("attend la validation tant que le paiement n'est pas terminé", () => {
    expect(
      purchaseStage({
        payment: payment("ACTION_REQUIRED"),
        access: access("PAYMENT_PENDING"),
        payableUntil: later,
      }).kind,
    ).toBe("approval");
  });
  it("prépare l'accès dès que l'achat est payé, puis le remet", () => {
    expect(
      purchaseStage({
        payment: payment("SUCCEEDED"),
        access: access("PAID"),
        payableUntil: later,
      }).kind,
    ).toBe("preparing");
    expect(
      purchaseStage({
        payment: payment("SUCCEEDED"),
        access: access("FULFILLED", true),
        payableUntil: earlier,
      }),
    ).toEqual({ kind: "ready", accessGrantId: grant, deliverable: true });
  });
  it("reste prêt quand l'accès est actif mais que la remise est close", () => {
    expect(
      purchaseStage({
        payment: payment("SUCCEEDED"),
        access: {
          ...access("FULFILLED"),
          accessGrantId: grant,
          accessStatus: "ACTIVE",
        },
        payableUntil: earlier,
      }),
    ).toEqual({ kind: "ready", accessGrantId: grant, deliverable: false });
  });
  it("propose de réessayer un paiement échoué tant que le délai court", () => {
    expect(
      purchaseStage({
        payment: payment("FAILED"),
        access: access("PAYMENT_PENDING"),
        payableUntil: later,
      }),
    ).toEqual({ kind: "failed", retryable: true });
    expect(
      purchaseStage({
        payment: payment("FAILED"),
        access: access("PAYMENT_PENDING"),
        payableUntil: earlier,
      }).kind,
    ).toBe("expired");
  });
  it("s'arrête de vérifier une fois l'accès prêt", () => {
    expect(pollInterval("ready", 0)).toBe(false);
    expect(pollInterval("approval", 0)).toBe(4_000);
    expect(pollInterval("approval", 180_000)).toBe(10_000);
  });
  it("revient aux vérifications rapprochées à chaque nouvelle étape", () => {
    let now = 0;
    const waitedIn = createStageClock(() => now);
    expect(waitedIn("approval")).toBe(0);
    now = 190_000;
    expect(pollInterval("approval", waitedIn("approval"))).toBe(10_000);
    // Paiement reçu après plus de trois minutes : l'activation est suivie toutes les 4 s.
    expect(pollInterval("preparing", waitedIn("preparing"))).toBe(4_000);
    now = 200_000;
    expect(waitedIn("preparing")).toBe(10_000);
  });
});

describe("retour au portail du hotspot", () => {
  it("ne garde qu'une adresse de réseau local", () => {
    expect(safeHotspotLogin("http://10.5.50.1/login")).toBe(
      "http://10.5.50.1/login",
    );
    expect(safeHotspotLogin("http://192.168.88.1/login?dst=x")).toBe(
      "http://192.168.88.1/login?dst=x",
    );
    expect(safeHotspotLogin("https://evil.example/login")).toBeNull();
    expect(safeHotspotLogin("javascript:alert(1)")).toBeNull();
    expect(safeHotspotLogin("http://user:pw@10.0.0.1/")).toBeNull();
  });
});
