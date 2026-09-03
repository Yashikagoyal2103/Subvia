import type { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, refreshSchema } from "./auth.schema.js";
import { registerUser, loginUser, refreshAccessToken, logout } from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
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
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error); // Pass to global error handler
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
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
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
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
    const tokens = await refreshAccessToken(result.data.refreshToken);
    res.status(200).json({ success: true, data: tokens });
  } catch (error) {
    next(error);
  }
}

export async function logoutUser(req: Request, res: Response, next: NextFunction) {
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
    res.status(200).json({ success: true, data: { message: "Logged out successfully" } });
  } catch (error) {
    next(error);
  }
}
