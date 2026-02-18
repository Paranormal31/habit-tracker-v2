import request from "supertest";

describe("security", () => {
  it("allows configured CORS origin and blocks unknown origins", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    const allowed = await request(app)
      .options("/api/auth/me")
      .set("Origin", "http://localhost:3000")
      .set("Access-Control-Request-Method", "GET");

    expect(allowed.status).toBe(204);
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const blocked = await request(app).get("/health").set("Origin", "https://evil.example");
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toBe("CORS origin not allowed");
  });

  it("sets localhost auth cookie flags in development-style requests", async () => {
    const { createApp } = await import("../src/app");
    const app = createApp();

    const registerRes = await request(app)
      .post("/api/auth/register")
      .set("Origin", "http://localhost:3000")
      .send({
        name: "Secure User",
        email: "secure@example.com",
        password: "Password123",
        timezone: "UTC"
      });

    expect(registerRes.status).toBe(201);
    const setCookieHeader = registerRes.headers["set-cookie"];
    const cookieValues = Array.isArray(setCookieHeader) ? setCookieHeader : [];
    const authCookie = cookieValues.find((cookie) =>
      cookie.startsWith("auth_token=")
    );
    expect(authCookie).toBeDefined();
    expect(authCookie).toContain("HttpOnly");
    expect(authCookie).not.toContain("Secure");
    expect(authCookie).toContain("SameSite=Lax");
  });
});
