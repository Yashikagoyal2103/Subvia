import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import { registerAndLogin, request } from "./helpers.js";

describe("Authentication and account routing", () => {
  it("registers an admin with names, normalized email and ADMIN account type", async () => {
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        firstName: "Ruby",
        lastName: "Chew",
        email: "USER@Example.COM",
        password: "Password123!",
        confirmPassword: "Password123!",
        intent: "ADMIN",
      }),
    });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({ firstName: "Ruby", lastName: "Chew", email: "user@example.com", accountType: "ADMIN" });
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("registers a customer with CUSTOMER account type", async () => {
    const auth = await registerAndLogin("customer@example.com", "CUSTOMER");
    expect(auth.accountType).toBe("CUSTOMER");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: auth.userId } });
    expect(user.accountType).toBe("CUSTOMER");
  });

  it("rejects mismatched passwords", async () => {
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName: "Test", lastName: "User", email: "x@example.com", password: "Password123!", confirmPassword: "Password456!", intent: "CUSTOMER" }),
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate email case-insensitively", async () => {
    await registerAndLogin("duplicate@example.com", "CUSTOMER");
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstName: "Test", lastName: "User", email: "DUPLICATE@example.com", password: "Password123!", confirmPassword: "Password123!", intent: "CUSTOMER" }),
    });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("USER_ALREADY_EXISTS");
  });

  it("login returns the account type used for frontend destination routing", async () => {
    const auth = await registerAndLogin("login-customer@example.com", "CUSTOMER");
    const response = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "login-customer@example.com", password: "Password123!" }),
    });
    expect(response.status).toBe(200);
    expect((await response.json()).data.user.accountType).toBe("CUSTOMER");
    expect(auth.accessToken).toBeTruthy();
  });

  it("/me returns the complete authenticated user contract", async () => {
    const auth = await registerAndLogin("me@example.com", "CUSTOMER");
    const response = await request("/api/v1/auth/me", { headers: { authorization: `Bearer ${auth.accessToken}` } });
    expect(response.status).toBe(200);
    expect((await response.json()).data).toMatchObject({ id: auth.userId, email: "me@example.com", firstName: "Test", lastName: "User", accountType: "CUSTOMER" });
  });

  it("rejects unauthenticated and malformed /me requests", async () => {
    expect((await request("/api/v1/auth/me")).status).toBe(401);
    expect((await request("/api/v1/auth/me", { headers: { authorization: "Bearer invalid" } })).status).toBe(401);
  });

  it("rotates refresh tokens and revokes the old token", async () => {
    const auth = await registerAndLogin("refresh@example.com", "CUSTOMER");
    const response = await request("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: auth.refreshToken }) });
    expect(response.status).toBe(200);
    const rotated = (await response.json()).data;
    expect(rotated.refreshToken).not.toBe(auth.refreshToken);
    expect((await request("/api/v1/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: auth.refreshToken }) })).status).toBe(401);
  });
});
