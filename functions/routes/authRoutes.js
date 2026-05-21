const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getFirestore } = require("firebase-admin/firestore");

const router = express.Router();
const db = getFirestore();

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email.toLowerCase()).limit(1).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersRef.add({
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    });

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email.toLowerCase()).limit(1).get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const secret = process.env.JWT_SECRET || "habit-tracker-default-secret-key-123!";
    const token = jwt.sign({ userId: userDoc.id }, secret, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
