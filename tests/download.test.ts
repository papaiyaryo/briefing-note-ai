import { describe, expect, it } from "vitest";

import {
  buildMarkdownDownloadFileName,
  createMarkdownBlob,
} from "../src/lib/download";

describe("buildMarkdownDownloadFileName", () => {
  it("uses the sanitized company name when it is present", () => {
    expect(
      buildMarkdownDownloadFileName({
        companyName: "青葉 / Future:Link 株式会社",
      }),
    ).toBe("青葉-Future-Link-株式会社-briefing-note.md");
  });

  it("falls back to a timestamp when company name is missing", () => {
    expect(
      buildMarkdownDownloadFileName({
        companyName: "   ",
        now: new Date("2026-06-16T09:08:07.000Z"),
      }),
    ).toBe("briefing-note-2026-06-16T09-08-07.md");
  });

  it("falls back to a timestamp when company name has only unsafe characters", () => {
    expect(
      buildMarkdownDownloadFileName({
        companyName: "<>:\"/\\|?*",
        now: new Date("2026-06-16T09:08:07.000Z"),
      }),
    ).toBe("briefing-note-2026-06-16T09-08-07.md");
  });
});

describe("createMarkdownBlob", () => {
  it("creates a markdown blob with utf-8 text type", () => {
    const blob = createMarkdownBlob("# 見出し\n本文");

    expect(blob.type).toBe("text/markdown;charset=utf-8");
    expect(blob.size).toBeGreaterThan(0);
  });
});
