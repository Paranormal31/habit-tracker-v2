import request from "supertest";

describe("auth", () => {
  it("registers, reads session, logs out, and logs back in", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();
    const agent = request.agent(app);

    const registerRes = await agent.post("/api/auth/register").send({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
      timezone: "UTC"
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.email).toBe("test@example.com");

    const meRes = await agent.get("/api/auth/me");
    expect(meRes.status).toBe(200);
    expect(meRes.body.name).toBe("Test User");

    const logoutRes = await agent.post("/api/auth/logout");
    expect(logoutRes.status).toBe(200);

    const meAfterLogout = await agent.get("/api/auth/me");
    expect(meAfterLogout.status).toBe(401);

    const loginRes = await agent.post("/api/auth/login").send({
      email: "test@example.com",
      password: "Password123"
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.email).toBe("test@example.com");
  });
});
