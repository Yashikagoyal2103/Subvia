import { describe, expect, it } from "vitest";
import { prisma } from "../src/config/prisma.js";
import {
  expectStatus,
  registerAndLogin,
  request,
} from "./helpers.js";

describe("Authentication API", () => {
  it("registers a user and normalizes the email", async () => {
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "USER@Example.COM",
        password: "Password123!",
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(body.data.email).toBe("user@example.com");
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("rejects duplicate emails case-insensitively", async () => {
    await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "user@example.com",
        password: "Password123!",
      }),
    });

    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "USER@EXAMPLE.COM",
        password: "Password123!",
      }),
    });

    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe("USER_ALREADY_EXISTS");
  });

  it("rejects invalid registration input", async () => {
    const response = await request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: "not-an-email",
        password: "short",
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects wrong credentials", async () => {
    await registerAndLogin("auth@example.com");

    const response = await request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "auth@example.com",
        password: "WrongPassword123!",
      }),
    });

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("INVALID_CREDENTIALS");
  });

  it("protects /me from unauthenticated access", async () => {
    const response = await request("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects malformed access tokens", async () => {
    const response = await request("/api/v1/auth/me", {
      headers: { authorization: "Bearer definitely-invalid" },
    });

    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("INVALID_TOKEN");
  });

  it("returns the authenticated user id from /me", async () => {
    const auth = await registerAndLogin("me@example.com");

    const response = await request("/api/v1/auth/me", {
      headers: { authorization: `Bearer ${auth.accessToken}` },
    });

    expect(response.status).toBe(200);
    expect((await response.json()).data.userId).toBe(auth.userId);
  });

  it("rotates refresh tokens", async () => {
    const auth = await registerAndLogin("refresh@example.com");

    const response = await request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.refreshToken).not.toBe(auth.refreshToken);

    const oldRefresh = await request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    expect(oldRefresh.status).toBe(401);
    expect((await oldRefresh.json()).error.code).toBe(
      "INVALID_REFRESH_TOKEN"
    );
  });

  it("revokes refresh tokens on logout", async () => {
    const auth = await registerAndLogin("logout@example.com");

    const logout = await request("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    expect(logout.status).toBe(200);

    const refresh = await request("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    expect(refresh.status).toBe(401);
  });
});
