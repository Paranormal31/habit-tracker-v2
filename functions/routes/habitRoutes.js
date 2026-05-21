const express = require("express");
const { getFirestore } = require("firebase-admin/firestore");
const auth = require("../middleware/authMiddleware");

const router = express.Router();
const db = getFirestore();

// GET all habits
router.get("/", auth, async (req, res) => {
  try {
    const habitsRef = db.collection("habits");
    const snapshot = await habitsRef.where("userId", "==", req.userId).get();
    
    const habits = snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      return {
        _id: docSnapshot.id,
        ...data,
        records: data.records || {}
      };
    });

    // Sort by creation date (descending)
    habits.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json(habits);
  } catch (err) {
    console.error("Fetch habits error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ADD habit
router.post("/", auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const habitData = {
      name: name.trim(),
      userId: req.userId,
      records: {},
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection("habits").add(habitData);
    
    res.json({
      _id: docRef.id,
      ...habitData
    });
  } catch (err) {
    console.error("Add habit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// TOGGLE habit day
router.patch("/:id", auth, async (req, res) => {
  try {
    const { date, status } = req.body;
    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const habitDocRef = db.collection("habits").doc(req.params.id);
    const docSnapshot = await habitDocRef.get();

    if (!docSnapshot.exists || docSnapshot.data().userId !== req.userId) {
      return res.status(404).json({ message: "Habit not found" });
    }

    // Update specific nested date key in the records map using dot notation
    await habitDocRef.update({
      [`records.${date}`]: !!status
    });

    const updatedSnapshot = await habitDocRef.get();
    const updatedData = updatedSnapshot.data();

    res.json({
      _id: updatedSnapshot.id,
      ...updatedData,
      records: updatedData.records || {}
    });
  } catch (err) {
    console.error("Toggle habit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE habit
router.delete("/:id", auth, async (req, res) => {
  try {
    const habitDocRef = db.collection("habits").doc(req.params.id);
    const docSnapshot = await habitDocRef.get();

    if (!docSnapshot.exists || docSnapshot.data().userId !== req.userId) {
      return res.status(404).json({ message: "Habit not found" });
    }

    await habitDocRef.delete();
    res.json({ message: "Habit deleted" });
  } catch (err) {
    console.error("Delete habit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
