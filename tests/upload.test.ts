import { describe, expect, it } from "vitest";

import {
  MAX_IMAGES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  getUploadErrorMessage,
  validateImageFile,
  validateImageFiles,
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

describe("validateImageFiles", () => {
  it("returns validation results for every incoming file", () => {
    const valid = new File(["dummy"], "memo.png", { type: "image/png" });
    const invalid = new File(["dummy"], "memo.gif", { type: "image/gif" });

    expect(validateImageFiles([valid, invalid], 0)).toEqual({
      results: [
        { file: valid, error: null },
        { file: invalid, error: "unsupported-format" },
      ],
      tooMany: false,
    });
  });

  it("flags when incoming files exceed the image count limit", () => {
    const files = Array.from(
      { length: MAX_IMAGES + 1 },
      (_, index) =>
        new File(["dummy"], `memo-${index}.png`, { type: "image/png" }),
    );

    const result = validateImageFiles(files, 0);

    expect(result.tooMany).toBe(true);
    expect(result.results.every((item) => item.error === null)).toBe(true);
  });

  it("counts existing selected images when checking the limit", () => {
    const file = new File(["dummy"], "memo.png", { type: "image/png" });

    expect(validateImageFiles([file], MAX_IMAGES).tooMany).toBe(true);
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

  it("tells the user the image count limit", () => {
    expect(getUploadErrorMessage("too-many-files")).toContain(
      `${MAX_IMAGES} 枚`,
    );
  });
});
