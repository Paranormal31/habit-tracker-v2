import dotenv from "dotenv";
import path from "path";
import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function start() {
  await connectDb();
  const app = createApp();
  app.listen(Number(env.PORT), "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});
