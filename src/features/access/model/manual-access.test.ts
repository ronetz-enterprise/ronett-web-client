import { describe, expect, it } from "vitest";
import {
  accessIssuanceResultSchema,
  manualAccessBody,
  manualAccessDefaults,
  manualAccessSchema,
} from "./manual-access";

const site = "3f6c1f5e-0f3a-4a1e-9c0f-2b7d1e4a9c10";

describe("création manuelle d'un accès", () => {
  it("convertit les unités lisibles vers celles du service", () => {
    const values = manualAccessSchema.parse({
      ...manualAccessDefaults,
      siteId: site,
      validityAmount: "3",
      validityUnit: "hours",
      dataAmount: "2",
      dataUnit: "GB",
      downloadMbps: "10",
      uploadMbps: "",
      maxConcurrentSessions: "2",
    });
    expect(manualAccessBody(values).policy).toEqual({
      validitySeconds: 10_800,
      dataAllowanceBytes: 2_000_000_000,
      downloadLimitBps: 10_000_000,
      uploadLimitBps: null,
      maxConcurrentSessions: 2,
    });
  });
  it("refuse une durée de plus de 365 jours", () => {
    const result = manualAccessSchema.safeParse({
      ...manualAccessDefaults,
      siteId: site,
      validityAmount: "366",
      validityUnit: "days",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["validityAmount"]);
  });
  it("exige une référence quand l'accès n'est pas pour un client sans compte", () => {
    const result = manualAccessSchema.safeParse({
      ...manualAccessDefaults,
      siteId: site,
      subjectType: "DEVICE",
    });
    expect(result.success).toBe(false);
  });
  it("garde le jeton de récupération d'un accès préparé par le nœud du site", () => {
    const token = "A".repeat(43);
    expect(
      accessIssuanceResultSchema.parse({
        created: true,
        credentialDelivery: null,
        retrievalToken: token,
      }).retrievalToken,
    ).toBe(token);
    expect(
      accessIssuanceResultSchema.parse({
        created: true,
        credentialDelivery: null,
      }).retrievalToken,
    ).toBeNull();
    expect(
      accessIssuanceResultSchema.safeParse({
        created: true,
        credentialDelivery: null,
        retrievalToken: "court",
      }).success,
    ).toBe(false);
  });
});
