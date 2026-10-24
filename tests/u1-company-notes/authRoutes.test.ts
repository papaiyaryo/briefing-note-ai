import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createWorkspaceHandler } from "../../src/lib/server/workspace/http";
import { runtimeFixture } from "./runtimeFixture";
describe("auth HTTP boundaries", () => {
  let f: Awaited<ReturnType<typeof runtimeFixture>>,
    handle: ReturnType<typeof createWorkspaceHandler>;
  beforeAll(async () => {
    f = await runtimeFixture();
    handle = createWorkspaceHandler(() => f);
  });
  afterAll(async () => {
    await f?.close();
  });
  const login = (body: unknown, origin = "http://localhost") =>
    handle(
      new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        headers: { Origin: origin, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  it("login sets opaque HttpOnly cookie and never returns tokens", async () => {
    const r = await login({
      email: "owner@example.test",
      password: "dummy-password",
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("set-cookie")).toContain("HttpOnly");
    expect(await r.text()).not.toMatch(
      /accessToken|refreshToken|dummy-access|dummy-password/,
    );
  });
  it("wrong credentials return generic 401", async () => {
    const r = await login({ email: "owner@example.test", password: "wrong" });
    expect(r.status).toBe(401);
    expect(await r.text()).not.toContain("owner@example.test");
  });
  it("missing/mismatched Origin rejected", async () => {
    expect((await login({}, "https://other.test")).status).toBe(403);
  });
  it("strict login shape rejects extra fields", async () => {
    expect(
      (
        await login({
          email: "owner@example.test",
          password: "dummy-password",
          ownerId: "x",
        })
      ).status,
    ).toBe(400);
  });
  it("session returns only verified owner", async () => {
    const r = await handle(
      new Request("http://localhost/api/v1/auth/session", {
        headers: { Cookie: f.cookie },
      }),
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ userId: f.principal.userId });
  });
  it("no cookie is 401 with private cache policy", async () => {
    const r = await handle(new Request("http://localhost/api/v1/auth/session"));
    expect(r.status).toBe(401);
    expect(r.headers.get("cache-control")).toBe("private, no-store");
  });
  it("logout clears current cookie and session", async () => {
    const r = await handle(
      new Request("http://localhost/api/v1/auth/logout", {
        method: "POST",
        headers: {
          Cookie: f.cookie,
          Origin: "http://localhost",
          "Content-Type": "application/json",
        },
        body: "{}",
      }),
    );
    expect(r.status).toBe(200);
    expect(r.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(
      (
        await handle(
          new Request("http://localhost/api/v1/auth/session", {
            headers: { Cookie: f.cookie },
          }),
        )
      ).status,
    ).toBe(401);
  });
});
