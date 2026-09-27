
import bcrypt from "bcrypt";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";

import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "./auth.schema.js";

function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function createAccessToken(userId: string) {
  const options: SignOptions = {
    expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"], 
  };
  return jwt.sign({ sub: userId }, env.JWT_SECRET, options);
}

export async function registerUser(input: RegisterInput) {
  const email = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const passwordHash = await bcrypt.hash(
    input.password,
    12
  );

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      passwordHash,
      accountType: input.intent,
    },
  });

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    accountType: user.accountType,
    createdAt: user.createdAt,
  };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const accessToken = createAccessToken(user.id);

  const refreshToken = createRefreshToken();

  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS
  );

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      accountType: user.accountType,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const newRefreshToken = createRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + env.REFRESH_TOKEN_EXPIRES_DAYS
  );

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    }),

    prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.userId,
        expiresAt,
      },
    }),
  ]);

  const accessToken = createAccessToken(
    storedToken.userId
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput,
) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...(input.firstName !== undefined
        ? { firstName: input.firstName }
        : {}),
      ...(input.lastName !== undefined
        ? { lastName: input.lastName }
        : {}),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      accountType: true,
      createdAt: true,
    },
  });

  return user;
}
