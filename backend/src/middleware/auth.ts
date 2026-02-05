import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";

export type AuthRequest = Request & { userId?: string };

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await User.findById(payload.sub).select("_id");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.userId = user._id.toString();
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
