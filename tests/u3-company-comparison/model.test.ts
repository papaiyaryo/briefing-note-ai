import { expect, it } from "vitest";
import { snapshot, selection, id, instant } from "./fixtures";
// 動的importにより未実装sourceの不在を各受入assertionへ分離する。
const target = "../../src/lib/companyComparison/model";
it("NFR1.4: company/memo版は非空の不透明値として受理する", async () => {
  const m = await model(),
    s = snapshot(1);
  s.sources[0].company.version = "company:opaque-v2";
  s.sources[0].memo.version = "memo:opaque-v3";
  expect(m.parseSnapshot(s, selection(s))).toEqual(s);
});
it("NFR5.1: URL内改行はMarkdown構文を壊さず安全なリンク値へ正規化", async () => {
  const m = await model(),
    s = snapshot(1);
  s.sources[0].memo.adoptedWebSources = [
    {
      id: "raw-url",
      category: "Web",
      content: "出典",
      sourceUrl: "https://example.test/a\n# injected",
      fetchedAt: instant,
      confidence: "high",
      status: "adopted",
    },
  ];
  const output = m.comparisonMarkdown(s);
  expect(output).not.toContain("\n# injected");
  expect(output).toContain("<https://example.test/a#%20injected>");
});
async function model() {
  const value = await import(target).catch(() => null);
  expect(value, "U3 modelが実装されている").not.toBeNull();
  return value!;
}
it("AC8.1.1: 1社と20社を選択できる", async () => {
  const m = await model();
  for (const n of [1, 20])
    expect(m.validateSelection(selection(snapshot(n)))).toHaveLength(n);
});
it("BR2.1: 0社と21社は要求不能", async () => {
  const m = await model();
  for (const n of [0, 21])
    expect(() => m.validateSelection(selection(snapshot(n)))).toThrow();
});
it("BR2.1: 同企業重複と不正IDを拒否", async () => {
  const m = await model(),
    s = selection(snapshot(1));
  expect(() => m.validateSelection([...s, ...s])).toThrow();
  expect(() =>
    m.validateSelection([{ companyId: "name", memoId: id() }]),
  ).toThrow();
});
it("AC8.1.2: 同名別IDを選択順に保持", async () => {
  const m = await model(),
    s = snapshot();
  expect(m.parseSnapshot(s, selection(s))).toEqual(s);
});
it("BR2.3: 余分・不足・順序違いを拒否", async () => {
  const m = await model(),
    s = snapshot(),
    sel = selection(s);
  for (const sources of [
    s.sources.slice(1),
    [...s.sources].reverse(),
    [...s.sources, s.sources[0]],
  ])
    expect(() => m.parseSnapshot({ ...s, sources }, sel)).toThrow();
});
it("BR2.3: 所属違い・版欠落を拒否", async () => {
  const m = await model(),
    s = snapshot(1),
    sel = selection(s);
  s.sources[0].memo.companyId = id();
  expect(() => m.parseSnapshot(s, sel)).toThrow();
  s.sources[0].memo.companyId = sel[0].companyId;
  s.sources[0].company.version = "";
  expect(() => m.parseSnapshot(s, sel)).toThrow();
});
it("AC8.1.3: 構造なしや欠損構造を拒否", async () => {
  const m = await model(),
    s = snapshot(1),
    sel = selection(s);
  for (const structuredContent of [
    null,
    {},
    { ...s.sources[0].memo.structuredContent, strengths: undefined },
  ])
    expect(() =>
      m.parseSnapshot(
        {
          ...s,
          sources: [
            {
              ...s.sources[0],
              memo: { ...s.sources[0].memo, structuredContent },
            },
          ],
        },
        sel,
      ),
    ).toThrow();
});
it("BR3.1: 7観点・未記載・要確認を分け本文を補完しない", async () => {
  const m = await model(),
    s = snapshot(1),
    rows = m.comparisonRows(s);
  expect(rows).toHaveLength(7);
  expect(rows.map((r: { key: string }) => r.key)).toEqual([
    "strengths",
    "concerns",
    "impressions",
    "emphasizedPoints",
    "idealCandidate",
    "esPoints",
    "questions",
  ]);
  expect(rows[1].values[0]).toEqual(["未記載"]);
  expect(rows[6].values[0]).toEqual(["要確認"]);
  expect(JSON.stringify(rows)).not.toContain("本文だけ");
});
it("BR3.3: 採用Web全metadataを保持", async () => {
  const m = await model(),
    s = snapshot(1);
  s.sources[0].memo.adoptedWebSources = [
    {
      id: "source-1",
      category: "事業",
      content: "Webだけ",
      sourceUrl: "https://example.test/a",
      fetchedAt: instant,
      confidence: "requires_check",
      status: "adopted",
    },
  ];
  expect(
    m.parseSnapshot(s, selection(s)).sources[0].memo.adoptedWebSources,
  ).toEqual(s.sources[0].memo.adoptedWebSources);
});
it("NFR1.4: 危険URL・未採用・不正日時を拒否", async () => {
  const m = await model(),
    s = snapshot(1);
  for (const extra of [
    { sourceUrl: "javascript:alert(1)" },
    { sourceUrl: "https://u:p@example.test" },
    { status: "pending" },
    { fetchedAt: "2026-99-99" },
  ]) {
    s.sources[0].memo.adoptedWebSources = [
      {
        id: "a",
        category: "事業",
        content: "Web",
        sourceUrl: "https://example.test",
        fetchedAt: instant,
        confidence: "high",
        status: "adopted",
        ...extra,
      } as unknown as import("../../src/lib/workspace/contracts").AdoptedWebSource,
    ];
    expect(() => m.parseSnapshot(s, selection(s))).toThrow();
  }
});
it("BR3.3: manual/dummy/openaiを保存値で識別", async () => {
  const m = await model(),
    s = snapshot(1);
  expect(m.originLabel(s.sources[0].memo)).toContain("手入力");
  s.sources[0].memo.origin = "generated";
  s.sources[0].memo.providerOrigin = "dummy";
  expect(m.originLabel(s.sources[0].memo)).toContain("検証用");
  s.sources[0].memo.providerOrigin = "openai";
  expect(m.originLabel(s.sources[0].memo)).toContain("openai");
});
it("BR5.3: Markdownは区切り/HTML/改行を安全化し版と保存名を保持", async () => {
  const m = await model(),
    s = snapshot(1);
  s.sources[0].company.name = "保存|企業<script>";
  s.sources[0].memo.comparisonReason = "理由\n次";
  const output = m.comparisonMarkdown(s);
  expect(output).toContain("保存\\|企業&lt;script&gt;");
  expect(output).not.toContain("<script>");
  expect(output).toContain(s.sources[0].memo.version);
  expect(output).toContain("理由<br>次");
});
