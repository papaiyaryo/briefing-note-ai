import { describe, expect, it } from "vitest";

import { normalizeWhitespace } from "../src/lib/sample";

describe("normalizeWhitespace", () => {
  it("trims text and collapses repeated whitespace", () => {
    expect(normalizeWhitespace("  briefing   note\nai  ")).toBe(
      "briefing note ai",
    );
  });
});
