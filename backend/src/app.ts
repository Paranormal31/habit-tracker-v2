import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import habitsRoutes from "./routes/habits";
import completionsRoutes from "./routes/completions";
import progressRoutes from "./routes/progress";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true
    })
  );

  app.use((req, res, next) => {
    const url = req.originalUrl || req.url;
    if (!url.startsWith("/api/completions") && !url.startsWith("/api/progress")) {
      return next();
    }
    const start = Date.now();
    res.on("finish", () => {
      const ms = Date.now() - start;
      // eslint-disable-next-line no-console
      console.log(`[api] ${req.method} ${url} ${res.statusCode} ${ms}ms`);
    });
    return next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      message: "Habit Tracker API is running. See /health for status."
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/habits", habitsRoutes);
  app.use("/api/completions", completionsRoutes);
  app.use("/api/progress", progressRoutes);

  app.use(errorHandler);

  return app;
}
