import { describe, expect, it } from "vitest";
import { getOcrProvider, getStructureProvider } from "./provider";

describe("getOcrProvider", () => {
  it("API キー未設定なら dummy を返す", () => {
    expect(getOcrProvider({})).toBe("dummy");
  });

  it("API キーがあれば openai を返す", () => {
    expect(getOcrProvider({ OPENAI_API_KEY: "sk-test" })).toBe("openai");
  });

  it("OCR_PROVIDER=dummy なら API キーがあっても dummy を返す", () => {
    expect(
      getOcrProvider({ OPENAI_API_KEY: "sk-test", OCR_PROVIDER: "dummy" }),
    ).toBe("dummy");
  });

  it("OCR_PROVIDER=openai なら API キーがなくても openai を返す", () => {
    expect(getOcrProvider({ OCR_PROVIDER: "openai" })).toBe("openai");
  });

  it("OCR_PROVIDER が不明な値なら API キーで判定する", () => {
    expect(
      getOcrProvider({ OPENAI_API_KEY: "sk-test", OCR_PROVIDER: "unknown" }),
    ).toBe("openai");
    expect(getOcrProvider({ OCR_PROVIDER: "unknown" })).toBe("dummy");
  });
});

describe("getStructureProvider", () => {
  it("API キー未設定なら dummy を返す", () => {
    expect(getStructureProvider({})).toBe("dummy");
  });

  it("API キーがあれば openai を返す", () => {
    expect(getStructureProvider({ OPENAI_API_KEY: "sk-test" })).toBe("openai");
  });

  it("STRUCTURE_PROVIDER=dummy なら API キーがあっても dummy を返す", () => {
    expect(
      getStructureProvider({
        OPENAI_API_KEY: "sk-test",
        STRUCTURE_PROVIDER: "dummy",
      }),
    ).toBe("dummy");
  });

  it("STRUCTURE_PROVIDER=openai なら API キーがなくても openai を返す", () => {
    expect(getStructureProvider({ STRUCTURE_PROVIDER: "openai" })).toBe(
      "openai",
    );
  });

  it("STRUCTURE_PROVIDER が不明な値なら API キーで判定する", () => {
    expect(
      getStructureProvider({
        OPENAI_API_KEY: "sk-test",
        STRUCTURE_PROVIDER: "unknown",
      }),
    ).toBe("openai");
    expect(getStructureProvider({ STRUCTURE_PROVIDER: "unknown" })).toBe(
      "dummy",
    );
  });
});
