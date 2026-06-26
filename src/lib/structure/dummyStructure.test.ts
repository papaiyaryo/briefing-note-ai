import { describe, expect, it } from "vitest";

import { DEMO_BRIEFING_NOTE, DEMO_OCR_TEXT } from "../sampleData";
import { buildDummyStructure } from "./dummyStructure";

describe("buildDummyStructure", () => {
  it("builds deterministic structured data from the demo OCR text", () => {
    const first = buildDummyStructure(DEMO_OCR_TEXT, DEMO_BRIEFING_NOTE.companyEventInfo);
    const second = buildDummyStructure(DEMO_OCR_TEXT, DEMO_BRIEFING_NOTE.companyEventInfo);

    expect(first).toEqual(second);
    expect(first.overview.companyName).toBe("青葉フューチャーリンク株式会社");
    expect(first.facts).toContain("中小企業向けの業務支援クラウドを開発している");
    expect(first.esPoints).toEqual([]);
  });
});
