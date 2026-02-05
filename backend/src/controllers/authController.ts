import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { env } from "../config/env";
import { registerSchema, loginSchema } from "../validators/auth";

function signToken(userId: string) {
  return jwt.sign(
    { sub: userId },
    env.JWT_SECRET as jwt.Secret,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] }
  );
}

function setAuthCookie(req: Request, res: Response, token: string) {
  const origin = req.headers.origin ?? "";
  const isLocalhost = origin.includes("http://localhost");
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: !isLocalhost,
    sameSite: isLocalhost ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    passwordHash,
    timezone: data.timezone
  });

  const token = signToken(user._id.toString());
  setAuthCookie(req, res, token);

  return res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    timezone: user.timezone
  });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email.toLowerCase().trim() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user._id.toString());
  setAuthCookie(req, res, token);

  return res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    timezone: user.timezone
  });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie("auth_token");
  return res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  // Debug: verify auth cookie arrives in production
  // eslint-disable-next-line no-console
  console.log(`[auth/me] origin=${req.headers.origin ?? "unknown"} cookie=${req.headers.cookie ?? "none"}`);
  const token = req.cookies?.auth_token;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await User.findById(payload.sub).select("_id name email timezone");
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      timezone: user.timezone
    });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
