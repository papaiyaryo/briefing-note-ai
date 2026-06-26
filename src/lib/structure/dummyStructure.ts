import { DEMO_BRIEFING_NOTE, DEMO_OCR_TEXT } from "../sampleData";
import type { CompanyEventInfo } from "../types";
import type { CompanyMemoStructured } from "./schema";

function pending(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? "要確認" : trimmed;
}

export function buildDummyStructure(
  ocrText: string,
  info: CompanyEventInfo,
): CompanyMemoStructured {
  const useDemo = ocrText.trim() === "" || ocrText.trim() === DEMO_OCR_TEXT.trim();
  return {
    overview: {
      companyName: pending(info.companyName || DEMO_BRIEFING_NOTE.companyEventInfo.companyName),
      eventName: pending(info.eventName || DEMO_BRIEFING_NOTE.companyEventInfo.eventName),
      eventDate: pending(info.eventDate || DEMO_BRIEFING_NOTE.companyEventInfo.eventDate),
      speakers: useDemo ? "採用担当、若手社員" : "要確認",
    },
    facts: useDemo
      ? [
          "中小企業向けの業務支援クラウドを開発している",
          "請求書処理、問い合わせ管理、社内ナレッジ共有をまとめるサービスを提供している",
          "導入後の運用支援も重視している",
        ]
      : ["要確認"],
    emphasizedPoints: useDemo
      ? [
          "顧客の現場を観察してから課題を決める",
          "早く作るより、使われ続ける仕組みを作る",
          "チームで振り返り、改善を続ける人を歓迎する",
        ]
      : [],
    business: useDemo
      ? ["中小企業向け業務支援クラウド", "導入後の運用支援"]
      : [],
    strengths: useDemo
      ? ["営業、CS、開発が同じ顧客課題を見ながら動く", "仕様が曖昧なときはユーザーに聞く文化がある"]
      : [],
    idealCandidate: useDemo ? ["チームで振り返り、改善を続ける人"] : [],
    impressions: useDemo
      ? [
          "顧客理解を大事にする点は、自分の研究でのヒアリング経験とつなげやすい",
          "スピードだけでなく継続改善を重視するところに共感",
        ]
      : [],
    concerns: useDemo
      ? ["配属後の研修期間", "技術選定に若手がどこまで関われるか"]
      : [],
    questions: useDemo
      ? ["配属後の研修期間はどれくらいか", "技術選定に若手がどこまで関われるか"]
      : [],
    esPoints: [],
    nextResearch: ["要確認"],
  };
}
