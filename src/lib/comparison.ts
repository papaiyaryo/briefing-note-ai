import type { CompanyMemoStructured } from "./structure/schema";

export type InterestLevel = "high" | "medium" | "low" | "undecided";

export interface InterestNote {
  level: InterestLevel;
  memo: string;
}

export interface SavedCompanyMemo {
  id: string;
  memo: CompanyMemoStructured;
  markdown: string;
  interestNote: InterestNote;
  savedAt: string;
  updatedAt: string;
}

export const COMPARISON_POINTS = [
  { key: "strengths", label: "強み・特徴" },
  { key: "concerns", label: "懸念・気になった点" },
  { key: "impressions", label: "自分との接点・印象" },
  { key: "emphasizedPoints", label: "HR・社員の強調点" },
  { key: "idealCandidate", label: "求める人物像" },
  { key: "esPoints", label: "ES・面接で使える材料" },
  { key: "questions", label: "次に聞きたい質問" },
] as const satisfies readonly {
  key: keyof Pick<
    CompanyMemoStructured,
    | "strengths"
    | "concerns"
    | "impressions"
    | "emphasizedPoints"
    | "idealCandidate"
    | "esPoints"
    | "questions"
  >;
  label: string;
}[];

export const SAVED_COMPANY_MEMOS_STORAGE_KEY =
  "briefingNoteAi.savedCompanyMemos.v1";

export const INTEREST_LEVEL_LABELS: Record<InterestLevel, string> = {
  high: "高い",
  medium: "中くらい",
  low: "低い",
  undecided: "未定",
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function safeParseMemos(value: string | null): SavedCompanyMemo[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as SavedCompanyMemo[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadSavedCompanyMemos(): SavedCompanyMemo[] {
  if (typeof window === "undefined") return [];
  return safeParseMemos(
    window.localStorage.getItem(SAVED_COMPANY_MEMOS_STORAGE_KEY),
  );
}

function writeSavedCompanyMemos(memos: SavedCompanyMemo[]): void {
  window.localStorage.setItem(
    SAVED_COMPANY_MEMOS_STORAGE_KEY,
    JSON.stringify(memos),
  );
}

export function saveCompanyMemoForComparison(input: {
  memo: CompanyMemoStructured;
  markdown: string;
}): SavedCompanyMemo {
  const now = new Date().toISOString();
  const saved: SavedCompanyMemo = {
    id: createId(),
    memo: input.memo,
    markdown: input.markdown,
    interestNote: { level: "undecided", memo: "" },
    savedAt: now,
    updatedAt: now,
  };
  writeSavedCompanyMemos([saved, ...loadSavedCompanyMemos()]);
  return saved;
}

export function updateInterestNote(
  id: string,
  interestNote: InterestNote,
): SavedCompanyMemo[] {
  const updated = loadSavedCompanyMemos().map((item) =>
    item.id === id
      ? { ...item, interestNote, updatedAt: new Date().toISOString() }
      : item,
  );
  writeSavedCompanyMemos(updated);
  return updated;
}

function markdownCell(items: string[]): string {
  const visible = items.map((item) => item.trim()).filter(Boolean);
  if (visible.length === 0) return "要確認";
  return visible.map((item) => item.replace(/\|/g, "\\|")).join("<br>");
}

export function toComparisonMarkdown(memos: SavedCompanyMemo[]): string {
  const selected = memos.filter(Boolean);
  const header = [
    "比較観点",
    ...selected.map((item) => item.memo.overview.companyName || "要確認"),
  ];
  const separator = header.map(() => "---");
  const rows = COMPARISON_POINTS.map((point) => [
    point.label,
    ...selected.map((item) => markdownCell(item.memo[point.key])),
  ]);
  const interestRows = [
    [
      "志望度",
      ...selected.map((item) => INTEREST_LEVEL_LABELS[item.interestNote.level]),
    ],
    [
      "志望度メモ",
      ...selected.map((item) => markdownCell([item.interestNote.memo])),
    ],
  ];
  return [
    "# 企業比較メモ",
    "",
    [header, separator, ...rows, ...interestRows]
      .map((row) => `| ${row.join(" | ")} |`)
      .join("\n"),
    "",
    "## 情報の扱い",
    "- 表内の事実・強調点・質問は保存時点の説明会メモに基づく",
    "- 志望度と志望度メモはユーザー自身の編集内容",
    "- Web 補足情報はこの比較表には混在させない",
  ].join("\n");
}
