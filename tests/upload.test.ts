import { describe, expect, it } from "vitest";

import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  getUploadErrorMessage,
  validateImageFile,
} from "../src/lib/upload";

describe("validateImageFile", () => {
  it.each([
    ["image/png", "memo.png"],
    ["image/jpeg", "memo.jpg"],
    ["image/jpeg", "memo.jpeg"],
    ["image/webp", "memo.webp"],
  ])("accepts %s", (type, name) => {
    expect(validateImageFile({ name, type, size: 1024 })).toBeNull();
  });

  it("rejects unsupported MIME types", () => {
    expect(
      validateImageFile({ name: "memo.gif", type: "image/gif", size: 1024 }),
    ).toBe("unsupported-format");
    expect(
      validateImageFile({
        name: "memo.pdf",
        type: "application/pdf",
        size: 1024,
      }),
    ).toBe("unsupported-format");
  });

  it("falls back to the extension when the MIME type is empty", () => {
    expect(
      validateImageFile({ name: "memo.PNG", type: "", size: 1024 }),
    ).toBeNull();
    expect(validateImageFile({ name: "memo.gif", type: "", size: 1024 })).toBe(
      "unsupported-format",
    );
    expect(validateImageFile({ name: "memo", type: "", size: 1024 })).toBe(
      "unsupported-format",
    );
  });

  it("rejects files over the size limit", () => {
    expect(
      validateImageFile({
        name: "memo.png",
        type: "image/png",
        size: MAX_IMAGE_SIZE_BYTES + 1,
      }),
    ).toBe("file-too-large");
  });

  it("accepts files at exactly the size limit", () => {
    expect(
      validateImageFile({
        name: "memo.png",
        type: "image/png",
        size: MAX_IMAGE_SIZE_BYTES,
      }),
    ).toBeNull();
  });
});

describe("getUploadErrorMessage", () => {
  it("tells the user which formats are supported", () => {
    expect(getUploadErrorMessage("unsupported-format")).toContain("PNG");
  });

  it("tells the user the size limit", () => {
    expect(getUploadErrorMessage("file-too-large")).toContain(
      `${MAX_IMAGE_SIZE_MB}MB`,
    );
  });
});
