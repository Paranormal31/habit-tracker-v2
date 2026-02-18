import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll } from "@jest/globals";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  process.env.JWT_SECRET = "test_secret_1234567890_1234567890";
  process.env.JWT_EXPIRES_IN = "7d";
  process.env.CORS_ORIGIN = "http://localhost:3000";
  process.env.NODE_ENV = "test";
  process.env.PORT = "0";

  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;
  const collections = await db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});
