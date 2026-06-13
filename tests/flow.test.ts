import { describe, expect, it } from "vitest";

import {
  STEPS,
  STEP_IDS,
  getNextStepId,
  getPreviousStepId,
  getStep,
} from "../src/lib/flow";

describe("flow steps", () => {
  it("defines upload, ocr, markdown in this order", () => {
    expect(STEPS.map((step) => step.id)).toEqual([
      "upload",
      "ocr",
      "markdown",
    ]);
    expect(STEPS.map((step) => step.number)).toEqual([1, 2, 3]);
  });

  it("keeps STEP_IDS and STEPS consistent", () => {
    expect(STEPS.map((step) => step.id)).toEqual([...STEP_IDS]);
  });

  it("returns the definition for a step id", () => {
    expect(getStep("ocr").label).toBe("OCR 確認");
  });
});

describe("getNextStepId", () => {
  it("moves forward through the flow", () => {
    expect(getNextStepId("upload")).toBe("ocr");
    expect(getNextStepId("ocr")).toBe("markdown");
  });

  it("returns null at the last step", () => {
    expect(getNextStepId("markdown")).toBeNull();
  });
});

describe("getPreviousStepId", () => {
  it("moves backward through the flow", () => {
    expect(getPreviousStepId("markdown")).toBe("ocr");
    expect(getPreviousStepId("ocr")).toBe("upload");
  });

  it("returns null at the first step", () => {
    expect(getPreviousStepId("upload")).toBeNull();
  });
});
