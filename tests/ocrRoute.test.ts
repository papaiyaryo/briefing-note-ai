import { describe, expect, it } from "vitest";

import { POST } from "../app/api/ocr/route";
import { MAX_IMAGE_SIZE_BYTES } from "../src/lib/upload";

function createRequest(file: File): Request {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/ocr", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/ocr", () => {
  it("rejects unsupported image MIME types", async () => {
    const response = await POST(
      createRequest(new File(["test"], "memo.gif", { type: "image/gif" })),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("invalid_input");
  });

  it("rejects files over the upload size limit", async () => {
    const response = await POST(
      createRequest(
        new File([new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1)], "memo.png", {
          type: "image/png",
        }),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("payload_too_large");
  });

  it("returns dummy OCR text when no API key is configured", async () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalProvider = process.env.OCR_PROVIDER;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OCR_PROVIDER;

    try {
      const response = await POST(
        createRequest(new File(["test"], "memo.png", { type: "image/png" })),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.provider).toBe("dummy");
      expect(body.text).toContain("青葉フューチャーリンク株式会社");
    } finally {
      if (originalApiKey === undefined) {
        delete process.env.OPENAI_API_KEY;
      } else {
        process.env.OPENAI_API_KEY = originalApiKey;
      }
      if (originalProvider === undefined) {
        delete process.env.OCR_PROVIDER;
      } else {
        process.env.OCR_PROVIDER = originalProvider;
      }
    }
  });
});
