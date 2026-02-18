import request from "supertest";

describe("streak rollover behavior", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-04T12:00:00.000Z"));
  });

  beforeEach(() => {
    jest.setSystemTime(new Date("2026-02-04T12:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  async function createUserAndHabit(email: string) {
    const { createApp } = await import("../src/app");
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      name: "Rollover User",
      email,
      password: "Password123",
      timezone: "UTC"
    });

    const habitRes = await agent.post("/api/habits").send({ name: "Read" });
    expect(habitRes.status).toBe(201);

    return { agent, habitId: habitRes.body.id as string };
  }

  it("breaks streak after rollover when yesterday was missed and no freeze exists", async () => {
    const { agent, habitId } = await createUserAndHabit("rollover1@example.com");

    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-02" });
    const day2 = await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-03" });
    expect(day2.body.streak).toBe(2);

    jest.setSystemTime(new Date("2026-02-05T12:00:00.000Z"));
    const habitsRes = await agent.get("/api/habits");
    expect(habitsRes.status).toBe(200);
    expect(habitsRes.body[0].streak).toBe(0);
  });

  it("keeps streak across rollover when yesterday was frozen, then consumes freeze", async () => {
    const { agent, habitId } = await createUserAndHabit("rollover2@example.com");

    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-02" });
    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-03" });

    const freezeOn = await agent.post(`/api/habits/${habitId}/freeze`);
    expect(freezeOn.status).toBe(200);
    expect(freezeOn.body.streak).toBe(2);
    expect(freezeOn.body.isFrozenToday).toBe(true);
    expect(freezeOn.body.streakFreezeDate).toBe("2026-02-04");

    jest.setSystemTime(new Date("2026-02-05T12:00:00.000Z"));
    const habitsRes = await agent.get("/api/habits");
    expect(habitsRes.status).toBe(200);
    expect(habitsRes.body[0].streak).toBe(2);
    expect(habitsRes.body[0].isFrozenToday).toBe(false);
    expect(habitsRes.body[0].streakFreezeDate).toBeNull();
  });

  it("does not allow one freeze to protect multiple missed days", async () => {
    const { agent, habitId } = await createUserAndHabit("rollover3@example.com");

    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-02" });
    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-03" });
    await agent.post(`/api/habits/${habitId}/freeze`);

    jest.setSystemTime(new Date("2026-02-05T12:00:00.000Z"));
    await agent.get("/api/habits");

    jest.setSystemTime(new Date("2026-02-06T12:00:00.000Z"));
    const habitsRes = await agent.get("/api/habits");
    expect(habitsRes.status).toBe(200);
    expect(habitsRes.body[0].streak).toBe(0);
    expect(habitsRes.body[0].streakFreezeDate).toBeNull();
  });

  it("recomputes from full history when backfilling a previously missed day", async () => {
    const { agent, habitId } = await createUserAndHabit("rollover4@example.com");

    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-02" });
    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-03" });

    jest.setSystemTime(new Date("2026-02-05T12:00:00.000Z"));
    const rolled = await agent.get("/api/habits");
    expect(rolled.status).toBe(200);
    expect(rolled.body[0].streak).toBe(0);

    const backfill = await agent.post("/api/completions/toggle").send({
      habitId,
      date: "2026-02-04"
    });
    expect(backfill.status).toBe(200);
    expect(backfill.body.streak).toBe(3);
  });

  it("preserves streak during current day when today is still unchecked", async () => {
    const { agent, habitId } = await createUserAndHabit("rollover5@example.com");

    await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-02" });
    const day2 = await agent.post("/api/completions/toggle").send({ habitId, date: "2026-02-03" });
    expect(day2.status).toBe(200);
    expect(day2.body.streak).toBe(2);

    const habitsRes = await agent.get("/api/habits");
    expect(habitsRes.status).toBe(200);
    expect(habitsRes.body[0].streak).toBe(2);
  });
});
