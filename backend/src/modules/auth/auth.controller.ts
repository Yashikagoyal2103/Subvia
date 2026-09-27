import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  loginSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.schema.js";

import {
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
  updateUserProfile,
} from "./auth.service.js";
import { prisma } from "../../config/prisma.js";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0].message,
      },
    });
  }

  try {
    const user = await registerUser(result.data);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0].message,
      },
    });
  }

  try {
    const tokens = await loginUser(result.data);

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = refreshSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0].message,
      },
    });
  }

  try {
    const tokens = await refreshAccessToken(
      result.data.refreshToken,
    );

    res.status(200).json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = refreshSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0].message,
      },
    });
  }

  try {
    await logout(result.data.refreshToken);

    res.status(200).json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(
  req: Request,
  res: Response,
) {
  const userId =
    (req as AuthenticatedRequest).userId;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
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

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return res.json({
    success: true,
    data: user,
  });
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const result = updateProfileSchema.safeParse(
    req.body,
  );

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: result.error.issues[0].message,
      },
    });
  }

  try {
    const userId =
      (req as AuthenticatedRequest).userId;

    const user = await updateUserProfile(
      userId,
      result.data,
    );

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}