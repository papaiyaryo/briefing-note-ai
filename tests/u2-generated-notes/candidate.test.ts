import { describe, expect, it } from "vitest";
import { mapGeneratedCandidate } from "../../src/lib/generation/candidate";
import { candidate } from "./fixtures";
describe("C2 candidate / AC5.1.1-5 AC5.2.1-5", () => {
  it("preserves separate text/structure/OCR/event and provenance", () => {
    const c = candidate();
    expect(mapGeneratedCandidate(c)).toEqual(c);
  });
  it("does not trim or regenerate personal Markdown", () => {
    expect(mapGeneratedCandidate(candidate()).markdown).toBe(
      candidate().markdown,
    );
  });
  it("retains every adopted source identity and confidence", () => {
    expect(mapGeneratedCandidate(candidate()).adoptedWebSources).toEqual(
      candidate().adoptedWebSources,
    );
  });
  it("excludes images, filenames, URLs and unadopted sources", () => {
    const c = candidate();
    const mapped = mapGeneratedCandidate({
      ...c,
      imageFileNames: ["private.png"],
      imageUrl: "blob:private",
      file: { name: "private" },
      adoptedWebSources: [
        ...c.adoptedWebSources,
        { ...c.adoptedWebSources[0], id: "pending", status: "pending" },
      ],
    });
    expect(mapped).toEqual(c);
  });
  it.each(["javascript:alert(1)", "https://user:pass@example.test"])(
    "rejects unsafe source %s",
    (sourceUrl) => {
      const c = candidate();
      c.adoptedWebSources[0].sourceUrl = sourceUrl;
      expect(() => mapGeneratedCandidate(c)).toThrow();
    },
  );
  it("rejects invalid dates, missing structure and oversize input", () => {
    const c = candidate();
    expect(() =>
      mapGeneratedCandidate({
        ...c,
        event: { ...c.event, eventDate: "2026-02-30" },
      }),
    ).toThrow();
    expect(() =>
      mapGeneratedCandidate({ ...c, structuredContent: null }),
    ).toThrow();
    expect(() =>
      mapGeneratedCandidate({ ...c, markdown: "a".repeat(50001) }),
    ).toThrow();
  });
  it("rejects incomplete sources and missing proof", () => {
    const c = candidate();
    expect(() =>
      mapGeneratedCandidate({ ...c, generationReceipt: "" }),
    ).toThrow();
    expect(() =>
      mapGeneratedCandidate({
        ...c,
        adoptedWebSources: [
          { ...c.adoptedWebSources[0], id: "", fetchedAt: "invalid" },
        ],
      }),
    ).toThrow();
  });
});
