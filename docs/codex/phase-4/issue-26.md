# Issue #26 設計: サンプルデータとデモ用入力を整備する

対象 GitHub Issue: #26(`docs/generated-issues/04-05-サンプルデータとデモ用入力を整備する.md`)
Phase: 4 / 優先度: Medium / 実装順: **3 番目**
依存: #23(`buildMarkdownTemplate`)

## Issue 概要

MVP の動作確認・デモに使える **架空企業** のサンプル OCR テキストと、生成 Markdown のサンプルを用意する。
このサンプル OCR テキストは #24 のダミー OCR が返す中身になり、サンプル Markdown は #23 の出力例・
テスト期待値として使える。

## スコープ

- 架空企業のサンプル OCR テキストを作る(手書きメモを OCR した想定の自然なテキスト)。
- サンプル Markdown を用意する(`buildMarkdownTemplate` の出力例、または手調整済みの完成例)。
- 個人情報・実在選考情報・実在企業名を含まないことを確認する。
- README または docs から用途が分かるようにする。

## スコープ外

- 実企業データセット、本格的な OCR 評価データ。
- ダミー OCR の処理実装そのもの(#24)。

## 共有設計判断(Phase 計画より)

- 配置は `src/lib/sampleData.ts`(新規)。既存 `src/lib/sample.ts` は触らない。
- 架空企業のみ(例: 「サンプル商事株式会社」「テックブリッジ株式会社」等の明らかに架空の名称)。
- 実在の人名・電話番号・メール・選考日程・社員氏名を含めない。

## 実装ステップ

1. `src/lib/sampleData.ts` を新規作成する。

   ```ts
   export interface SampleBriefing {
     companyEventInfo: CompanyEventInfo; // 架空企業の入力例
     ocrText: string;                    // ダミー OCR が返す想定テキスト
   }

   export const SAMPLE_BRIEFING: SampleBriefing = { /* 架空企業 */ };

   // #23 の buildMarkdownTemplate に SAMPLE_BRIEFING を渡した出力例。
   // テスト期待値・デモ表示に使う。
   export const SAMPLE_MARKDOWN: string = /* ... */;
   ```

2. サンプル OCR テキストは、説明会メモらしい内容(事業概要・登壇者の発言メモ・自分の所感の混在)とし、
   `output-format.md` の各セクションに振り分けられる素材を含める。ただし **断定的な実在情報は入れない**。
3. 個人情報・実在情報が含まれないことをセルフチェックする(レビュー観点に明記)。
4. README に「デモ用サンプルデータの場所と用途(架空企業・ダミー OCR 用)」を 1 セクション追記する。

## 変更が想定されるファイル

- `src/lib/sampleData.ts`(新規)
- `README.md`(サンプルデータの用途を 1 段落追記)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| ダミー OCR で利用できるサンプルがある | `SAMPLE_BRIEFING.ocrText` を #24 が返す |
| サンプルに秘密情報や個人情報が含まれない | 架空企業のみ・PII なし(レビューでチェック) |
| README または docs から用途が分かる | README にサンプルデータ節を追記 |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

## リスク / 不明点

- 実在企業名と偶然一致しないか確認する(明確に架空とわかる名称にする)。
- `SAMPLE_MARKDOWN` を #23 の出力と完全一致させると変更時に壊れやすい →
  テストで使う場合は「主要見出しを含む」程度の緩い検証にするか、生成関数からその場で組み立てる方針を #23/#05 と整合させる。
