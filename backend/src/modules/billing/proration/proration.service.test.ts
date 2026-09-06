import { describe, expect, it } from "vitest";
import { calculateProration } from "./proration.service.js";

describe("calculateProration", () => {
  it("calculates a 50% remaining-period upgrade correctly", () => {
    const result = calculateProration({
      oldPlanPrice: 30000,
      newPlanPrice: 50000,
      billingPeriodStart: new Date("2026-08-01T00:00:00Z"),
      billingPeriodEnd: new Date("2026-09-01T00:00:00Z"),
      changeTime: new Date("2026-08-16T00:00:00Z"),
    });

    expect(result.oldPlanCredit).toBe(15484);
    expect(result.newPlanCharge).toBe(25806);
    expect(result.netAmount).toBe(10322);
  });

  it("calculates an upgrade near the end of the billing period", () => {
    const result = calculateProration({
      oldPlanPrice: 30000,
      newPlanPrice: 50000,
      billingPeriodStart: new Date("2026-08-01T00:00:00Z"),
      billingPeriodEnd: new Date("2026-09-01T00:00:00Z"),
      changeTime: new Date("2026-08-30T00:00:00Z"),
    });

    expect(result.oldPlanCredit).toBe(1935);
    expect(result.newPlanCharge).toBe(3226);
    expect(result.netAmount).toBe(1291);
  });

  it("works with a February billing period", () => {
    const result = calculateProration({
      oldPlanPrice: 28000,
      newPlanPrice: 56000,
      billingPeriodStart: new Date("2026-02-01T00:00:00Z"),
      billingPeriodEnd: new Date("2026-03-01T00:00:00Z"),
      changeTime: new Date("2026-02-15T00:00:00Z"),
    });

    expect(result.oldPlanCredit).toBe(14000);
    expect(result.newPlanCharge).toBe(28000);
    expect(result.netAmount).toBe(14000);
  });

  it("rejects an invalid billing period", () => {
    expect(() =>
      calculateProration({
        oldPlanPrice: 30000,
        newPlanPrice: 50000,
        billingPeriodStart: new Date("2026-09-01T00:00:00Z"),
        billingPeriodEnd: new Date("2026-08-01T00:00:00Z"),
        changeTime: new Date("2026-08-15T00:00:00Z"),
      })
    ).toThrow("INVALID_BILLING_PERIOD");
  });

  it("rejects a change at the billing period start", () => {
    expect(() =>
      calculateProration({
        oldPlanPrice: 30000,
        newPlanPrice: 50000,
        billingPeriodStart: new Date("2026-08-01T00:00:00Z"),
        billingPeriodEnd: new Date("2026-09-01T00:00:00Z"),
        changeTime: new Date("2026-08-01T00:00:00Z"),
      })
    ).toThrow("INVALID_CHANGE_TIME");
  });
});