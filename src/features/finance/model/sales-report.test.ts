import { describe, expect, it } from "vitest";
import { dailySales, relativeChange, sum } from "./sales-report";

const point = (periodStart: string, count: number, netAmount: number) => ({
  periodStart,
  count,
  grossAmount: netAmount,
  commissionAmount: 0,
  netAmount,
  refundedAmount: 0,
});

describe("dailySales", () => {
  it("complète les jours sans vente par zéro", () => {
    const days = dailySales(
      [point("2026-09-28", 2, 1000), point("2026-09-30", 1, 500)],
      new Date(2026, 8, 30),
      3,
    );
    expect(days.map((d) => d.day)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
    ]);
    expect(days.map((d) => d.net)).toEqual([1000, 0, 500]);
    expect(sum(days, "count")).toBe(3);
  });
});

describe("relativeChange", () => {
  it("calcule l'évolution relative", () => {
    expect(relativeChange(150, 100)).toBe(0.5);
  });
  it("ne compare pas à une base nulle", () => {
    expect(relativeChange(150, 0)).toBeNull();
  });
});
