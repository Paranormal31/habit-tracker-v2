const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");

// Initialize Firebase Admin SDK
admin.initializeApp();

// Load local environment variables (if any)
dotenv.config();

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
