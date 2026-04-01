import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Habit } from "../models/Habit";
import { env } from "../config/env";

type ChatOperation = {
  type: "create" | "delete" | "rename" | "set_time";
  habitId?: string;
  habitName?: string;
  newName?: string;
  time?: string | null;
};

type ChatPlan = {
  reply: string;
  operations: ChatOperation[];
};

const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function isValidTime(value: string | null | undefined) {
  if (value === null || value === undefined) return true;
  return TIME_24H_REGEX.test(value);
}

export async function chatWithHabits(req: AuthRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!env.GROQ_API_KEY) {
    return res.status(500).json({ message: "GROQ_API_KEY is not configured on the server" });
  }

  const userMessage = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!userMessage) {
    return res.status(400).json({ message: "Message is required" });
  }

  const habits = await Habit.find({ userId: req.userId }).sort({ order: 1 });
  const habitContext = habits.map((h) => ({
    id: h._id.toString(),
    name: h.name,
    time: h.time ?? null,
    order: h.order
  }));

  const systemPrompt = [
    "You are a habit assistant.",
    "You may propose operations to manage habits: create, delete, rename, set_time.",
    "Use the provided habits list only.",
    "Time format must be 24-hour HH:MM.",
    "Return ONLY valid JSON with this exact shape:",
    '{"reply":"string","operations":[{"type":"create|delete|rename|set_time","habitId":"optional string","habitName":"optional string","newName":"optional string","time":"optional HH:MM or null"}]}'
  ].join(" ");

  const completionRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            userMessage,
            habits: habitContext
          })
        }
      ]
    })
  });

  if (!completionRes.ok) {
    return res.status(502).json({ message: "Groq request failed" });
  }

  const completionJson = (await completionRes.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawContent = completionJson.choices?.[0]?.message?.content ?? "{}";

  let plan: ChatPlan;
  try {
    const parsed = JSON.parse(rawContent) as ChatPlan;
    plan = {
      reply: typeof parsed.reply === "string" ? parsed.reply : "Done.",
      operations: Array.isArray(parsed.operations) ? parsed.operations : []
    };
  } catch {
    plan = { reply: "I could not parse that. Please try again.", operations: [] };
  }

  const applied: Array<{ operation: ChatOperation; status: "applied" | "skipped"; reason?: string }> = [];

  function findHabit(op: ChatOperation) {
    if (op.habitId) {
      return habits.find((h) => h._id.toString() === op.habitId) ?? null;
    }
    if (op.habitName) {
      const target = normalizeName(op.habitName);
      return habits.find((h) => normalizeName(h.name) === target) ?? null;
    }
    return null;
  }

  for (const op of plan.operations) {
    if (!op || typeof op.type !== "string") continue;

    if (op.type === "create") {
      const name = op.habitName?.trim();
      if (!name) {
        applied.push({ operation: op, status: "skipped", reason: "Missing habit name" });
        continue;
      }
      if (!isValidTime(op.time)) {
        applied.push({ operation: op, status: "skipped", reason: "Invalid time format" });
        continue;
      }
      const lastOrder = habits.length > 0 ? habits[habits.length - 1].order : -1;
      const created = await Habit.create({
        userId: req.userId,
        name,
        time: op.time ?? null,
        order: lastOrder + 1,
        streak: 0
      });
      habits.push(created);
      applied.push({ operation: op, status: "applied" });
      continue;
    }

    const target = findHabit(op);
    if (!target) {
      applied.push({ operation: op, status: "skipped", reason: "Habit not found" });
      continue;
    }

    if (op.type === "delete") {
      await Habit.deleteOne({ _id: target._id, userId: req.userId });
      const index = habits.findIndex((h) => h._id.toString() === target._id.toString());
      if (index >= 0) habits.splice(index, 1);
      applied.push({ operation: op, status: "applied" });
      continue;
    }

    if (op.type === "rename") {
      const nextName = op.newName?.trim();
      if (!nextName) {
        applied.push({ operation: op, status: "skipped", reason: "Missing newName" });
        continue;
      }
      target.name = nextName;
      await target.save();
      applied.push({ operation: op, status: "applied" });
      continue;
    }

    if (op.type === "set_time") {
      if (!isValidTime(op.time)) {
        applied.push({ operation: op, status: "skipped", reason: "Invalid time format" });
        continue;
      }
      target.time = op.time ?? null;
      await target.save();
      applied.push({ operation: op, status: "applied" });
    }
  }

  const updatedHabits = await Habit.find({ userId: req.userId }).sort({ order: 1 });

  return res.json({
    reply: plan.reply,
    applied,
    habits: updatedHabits.map((h) => ({
      id: h._id,
      name: h.name,
      time: h.time ?? null,
      order: h.order,
      streak: h.streak,
      streakFreezeDate: h.streakFreezeDate ?? null,
      isFrozenToday: false,
      createdAt: h.createdAt
    }))
  });
}
