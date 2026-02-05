import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Avoid Node inspect crashes on complex error shapes (seen with Node 24 + zod)
  const safeMessage =
    err instanceof Error ? `${err.name}: ${err.message}` : "Unknown error";
  // eslint-disable-next-line no-console
  console.error(safeMessage);
  if (err instanceof ZodError) {
    return res.status(400).json({ message: "Invalid request", issues: err.issues });
  }
  res.status(500).json({ message: "Internal server error" });
}
