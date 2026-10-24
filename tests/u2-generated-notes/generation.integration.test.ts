import { randomUUID } from "node:crypto";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { runtimeFixture } from "../u1-company-notes/runtimeFixture";
import { createWorkspaceHandler } from "../../src/lib/server/workspace/http";
import { WorkspaceClient } from "../../src/lib/workspace/client";
import { GenerationSaveIntent } from "../../src/lib/generation/save";
import { mapGeneratedCandidate } from "../../src/lib/generation/candidate";
import { toMarkdown } from "../../src/lib/structure/toMarkdown";
import { candidate, otherOwner } from "./fixtures";
const state = vi.hoisted(() => ({ runtime: null as unknown }));
vi.mock("../../src/lib/server/workspace/runtime", () => ({
  getWorkspaceRuntime: () => state.runtime,
}));
import { POST as structurePost } from "../../app/api/structure/route";

describe("U2 dummy generation through real U1 HTTP / PostgreSQL", () => {
  let f: Awaited<ReturnType<typeof runtimeFixture>>;
  let handle: ReturnType<typeof createWorkspaceHandler>;
  let companyId: string;
  function request(path: string, method = "GET", body?: unknown) {
    return new Request(`http://localhost${path}`, {
      method,
      headers: {
        Origin: "http://localhost",
        Cookie: f.cookie,
        "Content-Type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  }
  const companyPath = () => `/api/v1/companies/${companyId}`;
  const memoPath = () => `${companyPath()}/memos`;
  async function generated() {
    const source = candidate();
    const response = await structurePost(
      request("/api/structure", "POST", {
        ocrText: source.correctedOcr,
        companyEventInfo: source.event,
      }),
    );
    expect(response.status).toBe(200);
    const result = await response.json();
    // A person confirms the C5 uncertain date before creating a C2 candidate.
    result.memo.overview.eventDate = source.event.eventDate;
    return mapGeneratedCandidate({
      ...source,
      providerOrigin: result.provider,
      generationReceipt: result.generationReceipt,
      structuredContent: result.memo,
      markdown: `  ${toMarkdown(result.memo, {
        ocrText: source.correctedOcr,
        webSupplements: source.adoptedWebSources,
      })}\n `,
    });
  }
  async function save(value: Awaited<ReturnType<typeof generated>>) {
    const body = {
      operationId: randomUUID(),
      memoId: randomUUID(),
      candidate: value,
    };
    const response = await handle(request(memoPath(), "POST", body));
    return { body, response };
  }
  beforeAll(async () => {
    vi.stubEnv("STRUCTURE_PROVIDER", "dummy");
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("Unexpected external request");
      }),
    );
    vi.spyOn(console, "info").mockImplementation(() => {});
    f = await runtimeFixture();
    state.runtime = f;
    handle = createWorkspaceHandler(() => f);
  });
  beforeEach(async () => {
    companyId = randomUUID();
    const response = await handle(
      request("/api/v1/companies", "POST", {
        operationId: randomUUID(),
        companyId,
        fields: { name: "固定の保存先企業" },
      }),
    );
    expect(response.status).toBe(201);
  });
  afterAll(async () => {
    try {
      await f?.close();
    } finally {
      vi.restoreAllMocks();
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });
  it("round trips every canonical field and provenance without images or a new company", async () => {
    const value = await generated();
    const before = await f.repo.listCards(f.principal);
    const { body, response } = await save(value);
    expect(response.status).toBe(201);
    const read = await handle(request(`${memoPath()}/${body.memoId}`));
    expect(read.status).toBe(200);
    const stored = await read.json();
    const persisted = Object.fromEntries(
      Object.entries(value).filter(([key]) => key !== "generationReceipt"),
    );
    expect(stored).toMatchObject({
      ...persisted,
      companyId,
      memoId: body.memoId,
    });
    expect(stored).not.toHaveProperty("generationReceipt");
    expect(JSON.stringify(stored)).not.toMatch(
      /blob:|imageFileNames|previewUrl|image\/png/,
    );
    expect((await f.repo.readCompany(f.principal, companyId)).name).toBe(
      "固定の保存先企業",
    );
    expect(await f.repo.listCards(f.principal)).toHaveLength(before.length);
  });
  it("keeps edited body independent of structured facts and corrected OCR", async () => {
    const value = await generated();
    value.markdown = " 本人だけの本文\n";
    const { body, response } = await save(value);
    expect(response.status).toBe(201);
    const stored = await f.repo.readMemo(f.principal, companyId, body.memoId);
    expect(stored.markdown).toBe(" 本人だけの本文\n");
    expect(stored.structuredContent).toEqual(value.structuredContent);
    expect(stored.correctedOcr).toBe(value.correctedOcr);
    expect(stored.adoptedWebSources).toEqual(value.adoptedWebSources);
  });
  it("rejects a foreign owner parent without leaking or writing", async () => {
    companyId = randomUUID();
    await f.db.admin.query(
      `insert into ${f.db.schema}.companies(company_id,owner_id,name) values($1,$2,$3)`,
      [companyId, otherOwner, "別本人の企業"],
    );
    const { response } = await save(await generated());
    expect(response.status).toBe(404);
  });
  it("rejects a parent deleted after generation", async () => {
    const value = await generated();
    const confirmation = await handle(
      request("/api/v1/deletion-confirmations", "POST", {
        companyId,
        memoId: null,
      }),
    );
    expect(confirmation.status).toBe(200);
    const { confirmationId } = await confirmation.json();
    const deleted = await handle(
      request("/api/v1/deletions", "POST", {
        operationId: randomUUID(),
        confirmationId,
      }),
    );
    expect(deleted.status).toBe(200);
    expect((await save(value)).response.status).toBe(404);
  });
  it.each(["signature", "provider", "owner"])(
    "rejects altered %s provenance atomically",
    async (kind) => {
      const value = await generated();
      if (kind === "signature") value.generationReceipt += "x";
      if (kind === "provider") value.providerOrigin = "openai";
      if (kind === "owner")
        value.generationReceipt = f.issueGenerationReceipt(otherOwner, "dummy");
      const { response } = await save(value);
      expect(response.status).toBe(400);
      expect(
        (await f.repo.listMemos(f.principal, companyId, {})).items,
      ).toHaveLength(0);
    },
  );
  it("rejects invalid structure instead of saving partial fields", async () => {
    const value = await generated();
    value.structuredContent.overview.eventDate = "2026-02-30";
    const { response } = await save(value);
    expect(response.status).toBe(400);
    expect(
      (await f.repo.listMemos(f.principal, companyId, {})).items,
    ).toHaveLength(0);
  });
  it("replays the exact operation without duplicating a memo", async () => {
    const { body, response } = await save(await generated());
    expect(response.status).toBe(201);
    const replay = await handle(request(memoPath(), "POST", body));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual(await response.json());
    expect(
      (await f.repo.listMemos(f.principal, companyId, {})).items,
    ).toHaveLength(1);
  });
  it("resolves a lost committed response by the same operation and memo IDs", async () => {
    let writes = 0;
    const client = new WorkspaceClient({
      fetch: async (path, init) => {
        const response = await handle(
          new Request(`http://localhost${path}`, {
            ...init,
            headers: {
              ...init?.headers,
              Cookie: f.cookie,
              Origin: "http://localhost",
            },
          }),
        );
        if (init?.method === "POST") {
          writes++;
          expect(response.status).toBe(201);
          throw new TypeError("dummy lost response after commit");
        }
        return response;
      },
    });
    const intent = new GenerationSaveIntent(
      client,
      companyId,
      await generated(),
      {
        operationId: randomUUID(),
        memoId: randomUUID(),
      },
    );
    await intent.save();
    expect(intent.state).toBe("unknown");
    await intent.lookup();
    expect(intent.state).toBe("saved");
    expect(intent.outcome).toMatchObject({ companyId, ...intent.ids });
    expect(writes).toBe(1);
    const stored = await client.get<{ memoId: string }>(
      `${memoPath()}/${intent.ids.memoId}`,
    );
    expect(stored.memoId).toBe(intent.ids.memoId);
    expect(
      (await f.repo.listMemos(f.principal, companyId, {})).items,
    ).toHaveLength(1);
  });
});
