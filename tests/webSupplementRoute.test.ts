import { describe, expect, it } from "vitest";

import { POST } from "../app/api/web-supplement/route";

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/web-supplement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/web-supplement", () => {
  it("rejects blank company names", async () => {
    const response = await POST(createRequest({ companyName: " " }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_input");
  });

  it("keeps the endpoint disabled unless explicitly enabled", async () => {
    const originalEnabled = process.env.WEB_SUPPLEMENT_ENABLED;
    delete process.env.WEB_SUPPLEMENT_ENABLED;

    try {
      const response = await POST(
        createRequest({ companyName: "青葉フューチャーリンク株式会社" }),
      );
      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body.error.code).toBe("not_configured");
    } finally {
      if (originalEnabled === undefined) {
        delete process.env.WEB_SUPPLEMENT_ENABLED;
      } else {
        process.env.WEB_SUPPLEMENT_ENABLED = originalEnabled;
      }
    }
  });

  it("returns dummy web supplement result when explicitly enabled and no API key is configured", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalProvider = process.env.WEB_SUPPLEMENT_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    const originalEnabled = process.env.WEB_SUPPLEMENT_ENABLED;
    delete process.env.WEB_SUPPLEMENT_PROVIDER;
    process.env.WEB_SUPPLEMENT_ENABLED = "true";

    try {
      const response = await POST(
        createRequest({ companyName: "青葉フューチャーリンク株式会社" }),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.provider).toBe("dummy");
      expect(body.result.companyName).toBe("青葉フューチャーリンク株式会社");
      expect(body.result.items[0].sourceUrl).toMatch(/^https:\/\//);
      expect(body.result.items[0].needsVerification).toBe(true);
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
      if (originalProvider === undefined) {
        delete process.env.WEB_SUPPLEMENT_PROVIDER;
      } else {
        process.env.WEB_SUPPLEMENT_PROVIDER = originalProvider;
      }
      if (originalEnabled === undefined) {
        delete process.env.WEB_SUPPLEMENT_ENABLED;
      } else {
        process.env.WEB_SUPPLEMENT_ENABLED = originalEnabled;
      }
    }
  });
});
