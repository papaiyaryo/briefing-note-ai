import type { CompanyEventInfo, WebSupplementItem } from "./types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function requestWebSupplements(
  ocrText: string,
  companyEventInfo: CompanyEventInfo,
): Promise<WebSupplementItem[]> {
  const companyName = companyEventInfo.companyName.trim() || "企業名未入力";
  const fetchedAt = todayIsoDate();

  if (ocrText.trim().length === 0) {
    return [];
  }

  return [
    {
      id: "official-profile",
      category: "企業概要",
      content: `${companyName} の公式サイトで事業内容・募集要項を確認してください。`,
      sourceUrl: "https://example.com/company-profile",
      fetchedAt,
      confidence: "requires_check",
      status: "pending",
    },
    {
      id: "recruit-info",
      category: "採用情報",
      content:
        "採用ページの更新日、募集職種、選考フローを確認候補として残します。",
      sourceUrl: "https://example.com/recruit",
      fetchedAt,
      confidence: "medium",
      status: "pending",
    },
  ];
}
