import { describe, expect, it } from "vitest";

import { runDummyOcr } from "../src/lib/dummyOcr";
import { DEMO_OCR_TEXT } from "../src/lib/sampleData";

describe("runDummyOcr", () => {
  it("returns the demo OCR text", () => {
    const result = runDummyOcr();

    expect(result).toEqual({
      status: "success",
      text: DEMO_OCR_TEXT,
    });
  });

  it("can return a dummy failure state", () => {
    const result = runDummyOcr("failure");

    expect(result.status).toBe("failure");
    if (result.status === "failure") {
      expect(result.errorMessage).toContain("ダミー OCR");
    }
  });
});
