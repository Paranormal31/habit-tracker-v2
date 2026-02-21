import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import habitsRoutes from "./routes/habits";
import completionsRoutes from "./routes/completions";
import progressRoutes from "./routes/progress";
import dailyFocusRoutes from "./routes/dailyFocus";
import timeBlocksRoutes from "./routes/timeBlocks";
import taskStackRoutes from "./routes/taskStack";
import plannerNotesRoutes from "./routes/plannerNotes";
import { errorHandler } from "./middleware/errorHandler";

function parseAllowedOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function createApp() {
  const app = express();
  const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true
    })
  );

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many auth requests, please try again later." }
  });

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

  if (env.NODE_ENV === "test") {
    app.use("/api/auth", authRoutes);
  } else {
    app.use("/api/auth", authLimiter, authRoutes);
  }
  app.use("/api/habits", habitsRoutes);
  app.use("/api/completions", completionsRoutes);
  app.use("/api/progress", progressRoutes);
  app.use("/api/daily-focus", dailyFocusRoutes);
  app.use("/api/time-blocks", timeBlocksRoutes);
  app.use("/api/task-stack", taskStackRoutes);
  app.use("/api/planner-notes", plannerNotesRoutes);

  app.use(errorHandler);

  return app;
}
