import type {Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware.js";

type AuthHandler<P> = (
  req: AuthenticatedRequest<P>,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

export function authRoute<P>(
  handler: AuthHandler<P>
) {
  return (
    req: Request<P>,
    res: Response,
    next: NextFunction
  ) => {
    return handler(
      req as AuthenticatedRequest<P>,
      res,
      next
    );
  };
}