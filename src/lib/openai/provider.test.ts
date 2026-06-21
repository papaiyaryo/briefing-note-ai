import { describe, expect, it } from "vitest";

import { getOcrProvider, getStructureProvider } from "./provider";

describe("getOcrProvider", () => {
  it("uses dummy when OPENAI_API_KEY is not set", () => {
    expect(getOcrProvider({})).toBe("dummy");
  });

  it("uses openai when OPENAI_API_KEY is set", () => {
    expect(getOcrProvider({ OPENAI_API_KEY: "test-key" })).toBe("openai");
  });

  it("prefers explicit dummy over OPENAI_API_KEY", () => {
    expect(
      getOcrProvider({ OPENAI_API_KEY: "test-key", OCR_PROVIDER: "dummy" }),
    ).toBe("dummy");
  });

  it("uses explicit openai without OPENAI_API_KEY", () => {
    expect(getOcrProvider({ OCR_PROVIDER: "openai" })).toBe("openai");
  });

  it("falls back to OPENAI_API_KEY when explicit value is unknown", () => {
    expect(
      getOcrProvider({ OPENAI_API_KEY: "test-key", OCR_PROVIDER: "other" }),
    ).toBe("openai");
  });
});

describe("getStructureProvider", () => {
  it("uses dummy when OPENAI_API_KEY is not set", () => {
    expect(getStructureProvider({})).toBe("dummy");
  });

  it("uses openai when OPENAI_API_KEY is set", () => {
    expect(getStructureProvider({ OPENAI_API_KEY: "test-key" })).toBe("openai");
  });

  it("prefers explicit dummy over OPENAI_API_KEY", () => {
    expect(
      getStructureProvider({
        OPENAI_API_KEY: "test-key",
        STRUCTURE_PROVIDER: "dummy",
      }),
    ).toBe("dummy");
  });

  it("uses explicit openai without OPENAI_API_KEY", () => {
    expect(getStructureProvider({ STRUCTURE_PROVIDER: "openai" })).toBe(
      "openai",
    );
  });

  it("falls back to dummy when explicit value is unknown and API key is missing", () => {
    expect(getStructureProvider({ STRUCTURE_PROVIDER: "other" })).toBe("dummy");
  });
});
