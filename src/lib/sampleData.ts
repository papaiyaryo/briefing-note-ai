import { buildMarkdownTemplateFromBriefingNote } from "./markdown";
import type { BriefingNote } from "./types";

export const DEMO_OCR_TEXT = `企業名: 青葉フューチャーリンク株式会社
イベント名: 26卒向け オンライン会社説明会
日時: 2026-06-12 14:00
登壇者: 採用担当、若手社員

事業:
- 中小企業向けの業務支援クラウドを開発
- 請求書処理、問い合わせ管理、社内ナレッジ共有をまとめるサービス
- 導入後の運用支援も重視

HR 強調:
- 顧客の現場を観察してから課題を決める
- 早く作るより、使われ続ける仕組みを作る
- チームで振り返り、改善を続ける人を歓迎

社員の話:
- 入社 2 年目から小さな改善提案を任された
- 営業、CS、開発が同じ顧客課題を見ながら動く
- 仕様が曖昧なときは、まずユーザーに聞く文化

気になったこと:
- 配属後の研修期間はどれくらいか
- 技術選定に若手がどこまで関われるか

自分の印象:
- 顧客理解を大事にする点は、自分の研究でのヒアリング経験とつなげやすい
- スピードだけでなく継続改善を重視するところに共感`;

export const DEMO_BRIEFING_NOTE: BriefingNote = {
  imageFileNames: ["demo-aoba-future-link-note.webp"],
  companyEventInfo: {
    companyName: "青葉フューチャーリンク株式会社",
    eventName: "26卒向け オンライン会社説明会",
    eventDate: "2026-06-12 14:00",
  },
  ocrText: DEMO_OCR_TEXT,
  // 入力状態のサンプルとして保持し、生成済み Markdown は DEMO_MARKDOWN_SAMPLE で参照する。
  markdown: "",
};

export const DEMO_MARKDOWN_SAMPLE =
  buildMarkdownTemplateFromBriefingNote(DEMO_BRIEFING_NOTE);
