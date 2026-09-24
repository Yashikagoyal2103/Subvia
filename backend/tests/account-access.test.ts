import { describe, expect, it } from "vitest";
import { registerAndLogin, request } from "./helpers.js";

describe("Admin/customer account separation", () => {
  it("allows ADMIN accounts to create businesses", async () => {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const response = await request("/api/v1/businesses", {
      method: "POST",
      headers: { authorization: `Bearer ${admin.accessToken}` },
      body: JSON.stringify({ name: "CloudBox" }),
    });
    expect(response.status).toBe(201);
  });

  it("rejects CUSTOMER accounts from creating businesses", async () => {
    const customer = await registerAndLogin("customer@example.com", "CUSTOMER");
    const response = await request("/api/v1/businesses", {
      method: "POST",
      headers: { authorization: `Bearer ${customer.accessToken}` },
      body: JSON.stringify({ name: "Should Not Exist" }),
    });
    expect(response.status).toBe(403);
  });

  it("requires a customer account for the global catalog", async () => {
    const admin = await registerAndLogin("admin@example.com", "ADMIN");
    const response = await request("/api/v1/catalog", { headers: { authorization: `Bearer ${admin.accessToken}` } });
    expect(response.status).toBe(403);
  });
});
