const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Load local environment variables (if any)
dotenv.config();

// Initialize Firebase Admin SDK
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var, falling back to default:", err);
    admin.initializeApp();
  }
} else {
  admin.initializeApp();
}

const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const habitRoutes = require("./routes/habitRoutes");

app.use("/auth", authRoutes);
app.use("/habits", habitRoutes);

// Base root endpoint
app.get("/", (req, res) => {
  res.send("Habit Tracker Serverless API is running");
});

module.exports = app;
