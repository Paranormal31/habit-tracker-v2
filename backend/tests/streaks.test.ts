import request from "supertest";

describe("streaks", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-04T12:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("computes streaks across consecutive days ending today", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      name: "Streak User",
      email: "streak@example.com",
      password: "Password123",
      timezone: "UTC"
    });

    const habitRes = await agent.post("/api/habits").send({ name: "Daily Walk" });
    expect(habitRes.status).toBe(201);
    const habitId = habitRes.body.id;

    const day1 = await agent.post("/api/completions/toggle").send({
      habitId,
      date: "2026-02-02"
    });
    expect(day1.status).toBe(200);
    expect(day1.body.streak).toBe(0);

    const day2 = await agent.post("/api/completions/toggle").send({
      habitId,
      date: "2026-02-03"
    });
    expect(day2.status).toBe(200);
    expect(day2.body.streak).toBe(2);

    const day3 = await agent.post("/api/completions/toggle").send({
      habitId,
      date: "2026-02-04"
    });
    expect(day3.status).toBe(200);
    expect(day3.body.streak).toBe(3);
  });
});
