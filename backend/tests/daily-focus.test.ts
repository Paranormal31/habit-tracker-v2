import request from "supertest";
import { describe, expect, it } from "@jest/globals";

describe("daily focus", () => {
  async function createAgent() {
    const { createApp } = await import("../src/app");
    const app = createApp();
    const agent = request.agent(app);
    await agent
      .post("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .send({
        name: "Daily Focus User",
        email: "daily-focus@example.com",
        password: "Password123",
        timezone: "UTC"
      });
    return agent;
  }

  it("saves and fetches daily focus for the same date", async () => {
    const agent = await createAgent();
    const date = "2026-02-18";

    const saveRes = await agent.put("/api/daily-focus").send({
      date,
      items: [
        { label: "primary", text: "Ship release", done: false },
        { label: "secondary", text: "Review PRs", done: true },
        { label: "tertiary", text: "Inbox zero", done: false }
      ]
    });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.date).toBe(date);

    const getRes = await agent.get(`/api/daily-focus?date=${date}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({
      date,
      items: [
        { label: "primary", text: "Ship release", done: false },
        { label: "secondary", text: "Review PRs", done: true },
        { label: "tertiary", text: "Inbox zero", done: false }
      ]
    });
  });

  it("keeps records isolated by date", async () => {
    const agent = await createAgent();
    const dateA = "2026-02-17";
    const dateB = "2026-02-18";

    await agent.put("/api/daily-focus").send({
      date: dateA,
      items: [
        { label: "primary", text: "A1", done: true },
        { label: "secondary", text: "A2", done: false },
        { label: "tertiary", text: "A3", done: false }
      ]
    });

    await agent.put("/api/daily-focus").send({
      date: dateB,
      items: [
        { label: "primary", text: "B1", done: false },
        { label: "secondary", text: "B2", done: true },
        { label: "tertiary", text: "B3", done: true }
      ]
    });

    const getA = await agent.get(`/api/daily-focus?date=${dateA}`);
    const getB = await agent.get(`/api/daily-focus?date=${dateB}`);

    expect(getA.status).toBe(200);
    expect(getA.body.items[0].text).toBe("A1");
    expect(getB.status).toBe(200);
    expect(getB.body.items[0].text).toBe("B1");
  });

  it("requires authentication", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    const getRes = await request(app).get("/api/daily-focus?date=2026-02-18");
    expect(getRes.status).toBe(401);

    const putRes = await request(app).put("/api/daily-focus").send({
      date: "2026-02-18",
      items: [
        { label: "primary", text: "", done: false },
        { label: "secondary", text: "", done: false },
        { label: "tertiary", text: "", done: false }
      ]
    });
    expect(putRes.status).toBe(401);
  });

  it("validates date format, labels, and item count", async () => {
    const agent = await createAgent();

    const invalidDate = await agent.get("/api/daily-focus?date=2026-2-18");
    expect(invalidDate.status).toBe(400);

    const wrongCount = await agent.put("/api/daily-focus").send({
      date: "2026-02-18",
      items: [
        { label: "primary", text: "", done: false },
        { label: "secondary", text: "", done: false }
      ]
    });
    expect(wrongCount.status).toBe(400);

    const invalidLabels = await agent.put("/api/daily-focus").send({
      date: "2026-02-18",
      items: [
        { label: "primary", text: "", done: false },
        { label: "secondary", text: "", done: false },
        { label: "secondary", text: "", done: false }
      ]
    });
    expect(invalidLabels.status).toBe(400);
  });
});
