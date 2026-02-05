import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  timezone: z.string().min(1).default("Asia/Kolkata")
});

export const loginSchema = z.object({
  identifier: z.string().min(2),
  password: z.string().min(6)
});
