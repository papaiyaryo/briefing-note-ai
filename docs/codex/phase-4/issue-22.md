# Issue #22 設計: CompanyMemo 型定義とデータ境界を実装する

対象 GitHub Issue: #22(`docs/generated-issues/04-01-companymemo-型定義とデータ境界を実装する.md`)
Phase: 4 / 優先度: High / 実装順: **1 番目**

## Issue 概要

OCR 結果・企業情報・生成 Markdown を扱う共有型を定義し、UI と生成ロジックの境界を明確にする。
Phase 4 以降のすべての lib 関数・コンポーネントがこの型を参照する基盤 Issue。

## スコープ

- 集約型 `BriefingNote` を `src/lib/types.ts` に定義する。
- 処理状態を表す `ProcessingState` を定義する。
- OCR 結果を表す `OcrResult` を定義する(#24 で使う境界)。
- 既存 `CompanyEventInfo` を型体系に位置づける(`BriefingNote` が内包する)。

## スコープ外

- DB 永続化、保存用モデル、Google Drive 用モデル。
- 生成ロジック本体(#23)、ダミー OCR 実装(#24)、ダウンロード(#25)。
- 型を使う側の大規模な書き換え(必要最小限の参照接続に留める)。

## 共有設計判断(Phase 計画より)

- 正準名は **`BriefingNote`**(architecture.md 準拠)。「CompanyMemo」は同義語として扱う。
- MVP では永続化しないため `id` / `createdAt` / `updatedAt` は **optional**。
- 事実・所感・要確認を分けられる構造の「余地」を持たせる(MVP では Markdown 文字列が主だが、
  将来セクション分割できるよう型コメントで意図を残す)。

## 実装ステップ

1. `src/lib/types.ts` を新規作成し、以下を定義する。

   ```ts
   // ユーザーが入力する企業・イベント情報(既存 CompanyEventInfo と同義)
   export interface CompanyEventInfo {
     companyName: string;
     eventName: string;
     eventDate: string;
   }

   // OCR 境界の戻り値(#24 のダミー OCR / Phase 6 の実 OCR 共通)
   export interface OcrResult {
     text: string;
   }

   // MVP のフロー全体が扱う集約型。永続化前提のフィールドは optional。
   export interface BriefingNote {
     id?: string;
     imageFileName?: string;
     companyEventInfo: CompanyEventInfo;
     ocrText: string;
     markdown: string;
     createdAt?: string;
     updatedAt?: string;
   }

   // 各ステップの処理状態(UI のローディング/エラー表現に対応)
   export type ProcessingState =
     | "idle"
     | "uploading"
     | "ocr_running"
     | "markdown_generating"
     | "ready"
     | "error";
   ```

2. 既存 `CompanyEventInfo` / `EMPTY_COMPANY_EVENT_INFO` の正準定義を `src/lib/types.ts` に置き、
   `src/lib/markdown.ts` からは `types.ts` を re-export して既存 import パスを壊さない。

   ```ts
   // src/lib/markdown.ts
   export {
     type CompanyEventInfo,
     EMPTY_COMPANY_EVENT_INFO,
   } from "./types";
   ```

   ※ `EMPTY_COMPANY_EVENT_INFO` は値なので `types.ts` 側に移してから re-export する。
3. `npm run typecheck` で既存参照(`BriefingNoteFlow.tsx` など)が壊れていないことを確認する。

## 変更が想定されるファイル

- `src/lib/types.ts`(新規)
- `src/lib/markdown.ts`(`CompanyEventInfo` / `EMPTY_COMPANY_EVENT_INFO` を types.ts へ移動 + re-export)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 型定義が UI とロジックから参照できる | `src/lib/types.ts` に export、markdown.ts から re-export |
| 事実・所感・要確認情報を分ける余地がある | `BriefingNote` の構造 + 型コメント、`output-format.md` のセクション規約と整合 |
| MVP 外の保存前提を持ち込んでいない | `id`/`createdAt`/`updatedAt` を optional、DB/Drive モデルを定義しない |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run build
```

(この Issue は型のみのためテストは必須ではない。型を使う関数のテストは #23 以降で追加。)

## リスク / 不明点

- `EMPTY_COMPANY_EVENT_INFO` の移動で import 切れが起きやすい → re-export で互換維持。
- `BriefingNote` を今この時点で UI state に全面採用すると差分が大きくなる →
  この Issue では型定義と re-export までとし、state への全面置換は行わない(後続 Issue で必要分だけ参照)。
