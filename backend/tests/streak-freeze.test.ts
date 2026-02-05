import request from "supertest";

describe("streak freeze", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-04T12:00:00.000Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("keeps streak intact when freezing today", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/api/auth/register").send({
      name: "Freeze User",
      email: "freeze@example.com",
      password: "Password123",
      timezone: "UTC"
    });

    const habitRes = await agent.post("/api/habits").send({ name: "Hydrate" });
    expect(habitRes.status).toBe(201);
    const habitId = habitRes.body.id;

    await agent.post("/api/completions/toggle").send({
      habitId,
      date: "2026-02-02"
    });
    await agent.post("/api/completions/toggle").send({
      habitId,
      date: "2026-02-03"
    });

    const freezeOn = await agent.post(`/api/habits/${habitId}/freeze`);
    expect(freezeOn.status).toBe(200);
    expect(freezeOn.body.isFrozenToday).toBe(true);
    expect(freezeOn.body.streak).toBe(2);

    const freezeOff = await agent.post(`/api/habits/${habitId}/freeze`);
    expect(freezeOff.status).toBe(200);
    expect(freezeOff.body.isFrozenToday).toBe(false);
    expect(freezeOff.body.streak).toBe(0);
  });
});
