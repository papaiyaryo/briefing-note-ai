import { describe, expect, it, vi } from "vitest";
import { GenerationSaveIntent } from "../../src/lib/generation/save";
import { WorkspaceClient, ClientFailure } from "../../src/lib/workspace/client";
import { candidate, companyId, operationId, memoId } from "./fixtures";
const outcome = {
  operationId,
  action: "memo_create" as const,
  companyId,
  memoId,
  resultingVersion: operationId,
  committedAt: "2026-10-16T00:00:00Z",
};
function setup() {
  const client = new WorkspaceClient();
  vi.spyOn(client, "send").mockResolvedValue(outcome);
  vi.spyOn(client, "get").mockResolvedValue({ state: "unknown" });
  return {
    client,
    intent: new GenerationSaveIntent(client, companyId, candidate(), {
      operationId,
      memoId,
    }),
  };
}
describe("frozen generation save / AC6.2.2-4 BR4.1", () => {
  it("sends existing C2 to the selected company only", async () => {
    const { client, intent } = setup();
    await intent.save();
    expect(client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `/api/v1/companies/${companyId}/memos`,
        method: "POST",
      }),
      undefined,
    );
    expect(JSON.parse(vi.mocked(client.send).mock.calls[0][0].body)).toEqual({
      operationId,
      memoId,
      candidate: candidate(),
    });
    expect(intent.state).toBe("saved");
  });
  it("freezes body independently from current edits", () => {
    const client = new WorkspaceClient();
    const c = candidate();
    const intent = new GenerationSaveIntent(client, companyId, c, {
      operationId,
      memoId,
    });
    c.markdown = "edited";
    expect(JSON.parse(intent.request.body).candidate.markdown).toBe(
      candidate().markdown,
    );
    expect(Object.isFrozen(intent.request)).toBe(true);
  });
  it("suppresses double clicks while saving", async () => {
    const { client, intent } = setup();
    let finish!: (v: typeof outcome) => void;
    vi.mocked(client.send).mockImplementation(
      () =>
        new Promise((r) => {
          finish = r;
        }),
    );
    const pending = intent.save();
    await intent.save();
    expect(client.send).toHaveBeenCalledTimes(1);
    finish(outcome);
    await pending;
  });
  it("retains unknown without automatic replay", async () => {
    const { client, intent } = setup();
    vi.mocked(client.send).mockRejectedValue(
      new ClientFailure("unavailable", 0, true),
    );
    await intent.save();
    expect(intent.state).toBe("unknown");
    await intent.lookup();
    expect(intent.state).toBe("unknown");
    expect(client.send).toHaveBeenCalledTimes(1);
    expect(client.get).toHaveBeenCalledWith(
      `/api/v1/operations/${operationId}`,
      undefined,
    );
  });
  it("explicit retry uses exactly the same frozen request", async () => {
    const { client, intent } = setup();
    vi.mocked(client.send).mockRejectedValueOnce(
      new ClientFailure("unavailable", 0, true),
    );
    await intent.save();
    await intent.save();
    expect(vi.mocked(client.send).mock.calls[0][0]).toEqual(
      vi.mocked(client.send).mock.calls[1][0],
    );
    expect(intent.state).toBe("saved");
  });
  it("committed lookup is successful without replay", async () => {
    const { client, intent } = setup();
    vi.mocked(client.get).mockResolvedValue({ state: "committed", outcome });
    await intent.lookup();
    expect(intent.state).toBe("saved");
    expect(intent.outcome).toEqual(outcome);
    expect(client.send).not.toHaveBeenCalled();
  });
  it("explicit rejection retains the candidate and error", async () => {
    const { client, intent } = setup();
    vi.mocked(client.send).mockRejectedValue(
      new ClientFailure("not_found", 404),
    );
    await intent.save();
    expect(intent.state).toBe("rejected");
    expect(intent.error).toBeInstanceOf(ClientFailure);
    expect(JSON.parse(intent.request.body).candidate).toEqual(candidate());
  });
  it("lookup failure does not assert a write failed", async () => {
    const { client, intent } = setup();
    vi.mocked(client.get).mockRejectedValue(new ClientFailure("unavailable"));
    await intent.lookup();
    expect(intent.state).toBe("unknown");
  });
});
