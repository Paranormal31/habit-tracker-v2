import "dotenv/config";
import bcrypt from "bcryptjs";
import { User } from "./models/User";
import { Habit } from "./models/Habit";
import { HabitCompletion } from "./models/HabitCompletion";
import { formatDateParts } from "./utils/date";
import { recomputeStreak } from "./utils/streak";

function toDateString(date: Date, timeZone: string) {
  return formatDateParts(date, timeZone);
}

async function seed() {
  process.env.MONGODB_URI ??= "mongodb://localhost:27017/habit-tracker";
  process.env.JWT_SECRET ??= "seed_only_secret_1234567890";
  process.env.JWT_EXPIRES_IN ??= "7d";
  process.env.CORS_ORIGIN ??= "http://localhost:3000";
  process.env.NODE_ENV ??= "development";

  const { connectDb } = await import("./config/db");
  await connectDb();

  const demoEmail = "demo@habittracker.dev";
  const demoPassword = "DemoPass123";
  const demoTimezone = "Asia/Kolkata";

  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    user = await User.create({
      name: "Demo User",
      email: demoEmail,
      passwordHash,
      timezone: demoTimezone
    });
  }

  const existingHabits = await Habit.find({ userId: user._id }).sort({ order: 1 });
  if (existingHabits.length === 0) {
    const habits = await Habit.insertMany([
      { userId: user._id, name: "Morning Meditation", order: 0, streak: 0 },
      { userId: user._id, name: "Gym Workout", order: 1, streak: 0 },
      { userId: user._id, name: "Read 30 Minutes", order: 2, streak: 0 }
    ]);

    const today = new Date();
    const todayStr = toDateString(today, demoTimezone);

    for (const habit of habits) {
      const completions: string[] = [];
      const includeToday = habit.name === "Morning Meditation";
      const maxBack = habit.name === "Gym Workout" ? 2 : 4;

      if (includeToday) {
        completions.push(toDateString(today, demoTimezone));
      }

      for (let i = 1; i <= maxBack; i += 1) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        completions.push(toDateString(date, demoTimezone));
      }

      for (const date of completions) {
        await HabitCompletion.updateOne(
          { userId: user._id, habitId: habit._id, date },
          { $set: { completed: true } },
          { upsert: true }
        );
      }

      const streak = await recomputeStreak({
        userId: user._id.toString(),
        habitId: habit._id.toString(),
        today: todayStr,
        freezeDate: habit.streakFreezeDate ?? null
      });
      habit.streak = streak;
      await habit.save();
    }
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  // eslint-disable-next-line no-console
  console.log(`Demo login: ${demoEmail} / ${demoPassword}`);
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Seed failed", err);
  process.exit(1);
});
