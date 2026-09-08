import { describe, expect, it } from "vitest";
import { createCredit } from "../../src/modules/credits/credit.service.js";

describe("credit service invariants", () => {
  it("rejects zero and negative credits", async () => {
    const tx = {
      creditLedger: {
        create: async () => {
          throw new Error("should not be called");
        },
      },
    } as never;

    await expect(
      createCredit(tx, {
        customerProfileId: "customer",
        amount: 0,
        currency: "INR",
        description: "invalid",
      })
    ).rejects.toThrow("INVALID_CREDIT_AMOUNT");

    await expect(
      createCredit(tx, {
        customerProfileId: "customer",
        amount: -1,
        currency: "INR",
        description: "invalid",
      })
    ).rejects.toThrow("INVALID_CREDIT_AMOUNT");
  });
});
