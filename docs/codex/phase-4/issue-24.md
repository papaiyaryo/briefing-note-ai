# Issue #24 設計: ダミー OCR フローを実装する

対象 GitHub Issue: #24(`docs/generated-issues/04-03-ダミー-ocr-フローを実装する.md`)
Phase: 4 / 優先度: High / 実装順: **4 番目**
依存: #03-02(画像アップロード UI)、#03-04(OCR 結果表示 UI)、#26(サンプル OCR テキスト)

## Issue 概要

外部 OCR API なしで MVP フローを最後まで確認できるよう、アップロード後に **ダミー OCR テキスト** を
返す処理を実装し、OCR 結果表示 UI に接続する。失敗ケースも再現できるようにする。
Phase 6 で実 OCR に差し替えられる境界(関数シグネチャ)を用意する。

## スコープ

- アップロード後にダミー OCR テキストを返す処理(`runDummyOcr`)を実装する。
- 結果を `BriefingNoteFlow` の `ocrText` state に接続し、OCR 確認ステップに表示する。
- 失敗ケースのダミー状態を用意する(`hasOcrError` を立てられる)。

## スコープ外

- OpenAI Vision API 接続、実 OCR 精度改善(Phase 6)。
- サーバー側 API Route 化(MVP のダミーはクライアント完結でよい)。

## 共有設計判断(Phase 計画より)

- 配置は `src/lib/ocr.ts`(新規)。戻り値は #22 の `OcrResult`。
- ネットワーク不使用。`setTimeout` 程度の擬似遅延のみ。実 API キー不要。
- Phase 6 で `runOcr(image): Promise<OcrResult>` に差し替えられるよう、同形のシグネチャにする。
- 返すテキストは #26 の `SAMPLE_BRIEFING.ocrText`(架空企業)を使う。

## 実装ステップ

1. `src/lib/ocr.ts` を新規作成する。

   ```ts
   import { SAMPLE_BRIEFING } from "./sampleData";
   import type { OcrResult } from "./types";

   // Phase 6 で実 OCR(Vision API)に差し替え予定の境界。
   // MVP では架空企業のサンプルテキストを擬似遅延付きで返す。ネットワーク不使用。
   export async function runDummyOcr(/* image?: SelectedImage */): Promise<OcrResult> {
     await delay(600);
     return { text: SAMPLE_BRIEFING.ocrText };
   }
   ```

   - 失敗再現は、専用の `runDummyOcrFailure()` を用意するか、引数や定数フラグで分岐させる。
     UI のデモ目的に限り、最小の仕組みでよい(例: 開発用に明示的に呼べる失敗関数)。
2. `BriefingNoteFlow.tsx` の `handleRunOcr` を、現状の「擬似遅延だけ + 空 ocrText」から
   `runDummyOcr` の結果を `setOcrText(result.text)` する形に置き換える。
   - 既存の二重実行防止(`isOcrRunning` ガード)、`pendingTimerRef` のクリーンアップ、
     完了時の絶対遷移(`setCurrentStepId("ocr")`)は維持する。
   - 失敗時は `setHasOcrError(true)` を立て、ステップ遷移しない / または OCR ステップでエラー表示する
     (Phase 3 の `hasOcrError` 表示と整合させる)。
3. 画像差し替え時に OCR 結果をクリアする既存挙動(`handleSelectImage`)を壊さない。
4. アップロード → OCR 確認 → 生成まで通ることを手動で確認する。

## 変更が想定されるファイル

- `src/lib/ocr.ts`(新規)
- `src/components/BriefingNoteFlow.tsx`(`handleRunOcr` をダミー OCR 関数呼び出しに置換)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 画像アップロード後に OCR 結果確認へ進める | `handleRunOcr` → `runDummyOcr` → `ocr` ステップ遷移 |
| ダミーテキストで Markdown 生成まで進める | `ocrText` に結果を格納 → #23 の生成へ接続 |
| 実 API キーを必要としない | `runDummyOcr` はローカル定数 + 擬似遅延のみ |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## リスク / 不明点

- 非同期化に伴い、アンマウント後の `setState` を防ぐ必要がある →
  既存の `pendingTimerRef` パターンか、マウント判定フラグで対処する。
- 失敗ケースの起動方法は「デモで再現できる最小実装」に留め、UI に恒久的な失敗ボタンを増やしすぎない。
- ダミー OCR の `image` 引数は使わなくても、Phase 6 互換のためシグネチャに残してよい(未使用警告に注意)。
