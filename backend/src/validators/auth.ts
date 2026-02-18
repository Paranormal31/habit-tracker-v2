import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
  timezone: z.string().min(1).default("Asia/Kolkata")
});

export const loginSchema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(8)
});
