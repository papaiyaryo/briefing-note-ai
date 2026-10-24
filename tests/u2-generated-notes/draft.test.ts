import { describe, expect, it } from "vitest";
import { GenerationDrafts } from "../../src/lib/generation/draft";
import { candidate, companyId, owner, otherOwner } from "./fixtures";
const value = () => ({
  correctedOcr: "訂正中",
  event: candidate().event,
  candidate: candidate(),
});
describe("generation memory / BR1.2 BR2.3 BR4.3", () => {
  it("retains same-owner draft only with explicit recovery", () => {
    const d = new GenerationDrafts();
    d.put(owner, companyId, value(), "v1");
    expect(d.recover(owner, companyId, "v1")?.value).toEqual(value());
  });
  it("does not expose draft to another owner or company", () => {
    const d = new GenerationDrafts();
    d.put(owner, companyId, value(), "v1");
    expect(d.recover(otherOwner, companyId, "v1")).toBeNull();
    expect(d.recover(owner, "another", "v1")).toBeNull();
  });
  it("keeps the original owner's draft after owner switch", () => {
    const d = new GenerationDrafts();
    d.put(owner, companyId, value(), "v1");
    d.recover(otherOwner, companyId, "v1");
    expect(d.recover(owner, companyId, "v1")?.value.correctedOcr).toBe(
      "訂正中",
    );
  });
  it("requires latest-version reconciliation", () => {
    const d = new GenerationDrafts();
    d.put(owner, companyId, value(), "v1");
    expect(d.recover(owner, companyId, "v2")?.needsRebase).toBe(true);
  });
  it("copies drafts and excludes file/image references", () => {
    const d = new GenerationDrafts();
    const input = {
      ...value(),
      file: { name: "private.png" },
      imageUrl: "blob:private",
    };
    d.put(owner, companyId, input, "v1");
    input.correctedOcr = "changed";
    expect(d.recover(owner, companyId, "v1")?.value).toEqual(value());
  });
  it("tracks dirty state and clears only selected owner/target", () => {
    const d = new GenerationDrafts();
    d.put(owner, companyId, value(), "v1");
    d.put(otherOwner, companyId, value(), "v1");
    expect(d.dirty(owner)).toBe(true);
    d.discard(owner, companyId);
    expect(d.dirty(owner)).toBe(false);
    expect(d.dirty(otherOwner)).toBe(true);
  });
});
