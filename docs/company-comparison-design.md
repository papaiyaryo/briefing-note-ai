# 企業比較用データ構造 設計

## 目的

このドキュメントは、複数の企業説明会メモ（`CompanyMemoStructured` / `BriefingNote`）を横断して比較するためのデータ構造を定義する。
対象は Phase 9（企業比較・面接前復習）で、比較テーブル実装（#45）と面接前復習モード（#46）の共通基盤として使う。

このドキュメント自体は設計のみを扱い、比較 UI や企業データベースは実装しない（[Out of Scope](#スコープ外) を参照）。

## MVP との境界

- MVP の単一メモ機能（`BriefingNote` / `CompanyMemoStructured`）には変更を加えない。
- 比較機能は、既存メモを**読み取り専用の入力**として使う新しい層として設計する。
- 比較専用フィールド（志望度・比較用懸念点など）は、既存の `src/lib/structure/schema.ts` や `src/lib/types.ts` には追加しない。別モジュール（例: `src/lib/comparison/`）に閉じる。
- MVP と同様、Phase 9 でもサーバー側 DB 永続化は行わない。永続化が必要な場合はブラウザ内 state / `localStorage` の範囲に留め、バックエンド設計は本 Issue のスコープ外とする。

## 前提となる既存データ

比較用データ構造は、既存の以下の型をそのまま入力として使う（再定義しない）。

- `CompanyMemoStructured`（`src/lib/structure/schema.ts`）: LLM 構造化済みの企業メモ本体。
  - `overview: { companyName, eventName, eventDate, speakers }`
  - `facts` / `emphasizedPoints` / `business` / `strengths` / `idealCandidate` / `impressions` / `concerns` / `questions` / `esPoints` / `nextResearch`（すべて `string[]`、`overview` 以外）
- `BriefingNote`（`src/lib/types.ts`）: MVP フロー全体の集約型（画像ファイル名、OCR テキスト、Markdown、Web 補足を保持）。
- `WebSupplementItem`（`src/lib/types.ts`）: Phase 8 の Web 補足情報。`status`（`pending` / `adopted` / `rejected`）と `confidence` を持つ。

## 比較観点の定義

比較に使う項目は、既存フィールドをそのまま転用するものと、Phase 9 で新規に追加するものに分かれる。

| 観点カテゴリ | 比較項目 | 由来 | 新規/既存 | 用途 |
| --- | --- | --- | --- | --- |
| 基本情報 | 企業名・イベント名・日時 | `overview` | 既存 | 比較テーブルの行・列の識別 |
| 事業内容 | 事業内容 | `business` | 既存 | 企業間の事業領域比較 |
| 強み・特徴 | 強み・特徴 | `strengths` | 既存 | 企業間の差別化要素比較 |
| 求める人物像 | 求める人物像 | `idealCandidate` | 既存 | 自己 PR との適合度比較（ES/面接対策） |
| 志望度 | 志望度レベル・理由 | `aspiration`（新規） | **新規** | 優先順位付け、比較テーブルのソート軸 |
| 懸念点 | 比較検討用の懸念点 | `comparisonConcerns`（新規、元は `concerns`） | **新規（既存 `concerns` を選別）** | 意思決定材料の整理 |
| ES/面接対策 | ES で使える材料・逆質問候補 | `esPoints` / `questions` | 既存 | ES 接続ポイント生成（#46）、逆質問の横断比較 |
| Web 由来補足 | 採用済みの Web 補足のみ | `webHighlights`（新規、元は `WebSupplementItem`） | **新規（既存を選別）** | 紙メモ由来情報と区別した参考情報 |

ES/面接対策に使う観点は「求める人物像」「ES で使える材料」「逆質問候補」「強み・特徴」の 4 項目を必須とし、Acceptance Criteria の「ES / 面接対策に使う観点が含まれる」を満たす。

## CompanyMemo 拡張設計（型定義案）

比較専用の型は、既存の `CompanyMemoStructured` を変更せず、それを包む新しい型として設計する。実装時の配置は `src/lib/comparison/types.ts` を想定する。

```ts
import type { CompanyMemoStructured, WebSupplementItem } from "../types"; // 実際の import 元は実装時に確認

// 比較専用の識別子。BriefingNote 側に永続 id がなくても比較レイヤーで発行する。
export type ComparisonEntryId = string;

// 志望度は 1(低い)〜5(高い) の 5 段階。未評価は null。
export type AspirationLevel = 1 | 2 | 3 | 4 | 5;

export interface CompanyAspirationNote {
  level: AspirationLevel | null;
  reason: string; // 志望度の理由（自由記述、ES/面接の一貫性チェックに使う）
  updatedAt: string; // ISO 8601。上書き型で保持し、履歴は持たない
}

// 比較に使う情報だけを CompanyMemoStructured から抜き出した読み取り専用ビュー
export interface CompanyComparisonSource {
  overview: CompanyMemoStructured["overview"];
  business: CompanyMemoStructured["business"];
  strengths: CompanyMemoStructured["strengths"];
  idealCandidate: CompanyMemoStructured["idealCandidate"];
  esPoints: CompanyMemoStructured["esPoints"];
  questions: CompanyMemoStructured["questions"];
}

// 懸念点の出どころ。紙メモ由来かユーザー追記かを区別する
export type ComparisonConcernOrigin = "memo" | "user";

export interface ComparisonConcern {
  text: string;
  origin: ComparisonConcernOrigin;
}

// Web 補足のうち、ユーザーが採用（adopted）した情報だけを比較に載せる
export type ComparisonWebHighlight = Pick<
  WebSupplementItem,
  "id" | "category" | "content" | "sourceUrl" | "fetchedAt" | "confidence"
>;

export interface CompanyComparisonEntry {
  id: ComparisonEntryId;
  source: CompanyComparisonSource;
  webHighlights: ComparisonWebHighlight[];
  aspiration: CompanyAspirationNote;
  comparisonConcerns: ComparisonConcern[];
}
```

設計判断:

- `CompanyComparisonEntry` は `CompanyMemoStructured` を直接内包せず、比較に必要なフィールドだけを `CompanyComparisonSource` として抜き出す。単一メモ機能側の型が変わっても、比較レイヤーの影響範囲を限定するため。
- `id` は比較レイヤーで発行する（`BriefingNote` は MVP では永続 `id` を持たないため）。生成方法（UUID 等）は実装時に決定する。

## 志望度メモの扱い

- **入力**: 5 段階（`AspirationLevel`）+ 自由記述の理由（`reason`）。未評価は `level: null` を許容する。
- **保存方針**: MVP と同様、サーバー側 DB は使わない。ブラウザ内 state を基本とし、ページ再訪時に保持したい場合は `localStorage` を選択肢として実装時に検討する。Google Drive 等への永続化は本 Issue のスコープ外。
- **更新方針**: 上書き型（履歴を保持しない）。理由: MVP のシンプルさを優先し、志望度の推移分析は現時点で要件にないため。将来的に履歴が必要になった場合は `updatedAt` を配列化する形で拡張できる余地を残す。
- **表示**: 比較テーブルのソート・フィルタ軸として使うことを想定する（実装は #45）。

## 懸念点の扱い

`docs/output-format.md` の「気になった点」（`CompanyMemoStructured.concerns`）は、説明会メモ由来の事実・印象の一部として既に存在する。比較レイヤーではこれをそのまま複製せず、以下のように扱いを分離する。

- `comparisonConcerns` は、比較・意思決定のために選別または追記した懸念点のリスト。
  - `origin: "memo"`: 元メモの `concerns` からユーザーが比較対象として選んだもの。
  - `origin: "user"`: 比較検討時にユーザーが新たに追記したもの（元メモの `concerns` には反映しない）。
- 紙メモ由来の懸念とユーザーが比較時に追記した懸念を混ぜない。これは `AGENTS.md` の「事実・印象・Web 情報を混ぜない」原則、および Phase 8 の `docs/web-supplement-design.md` が採用した情報源分離方針と整合させるための設計判断。
- 比較レイヤーへの追記は、元メモ（`CompanyMemoStructured.concerns`）を書き換えない。単一メモ機能とデータを分離するため。

## Web 由来情報の扱い

- `webHighlights` には `WebSupplementItem` のうち `status === "adopted"` のものだけを含める。`pending` / `rejected` は比較に含めない。
- Markdown 化する場合も、`docs/web-supplement-design.md` の出典表記（出典 URL・取得日・情報源種別・確認状態）を保持し、紙メモ由来のフィールド（`source.*`）と同一セクションに混在させない。

## 比較 Markdown 出力イメージ（#45 実装時の参考）

決定的な仕様ではなく、実装時の方向性を示す参考例。

```md
## 企業比較

| 企業名 | 志望度 | 事業内容 | 強み・特徴 | 求める人物像 | 懸念点 |
| --- | --- | --- | --- | --- | --- |
| {{companyName}} | {{aspiration.level}}/5 | {{business}} | {{strengths}} | {{idealCandidate}} | {{comparisonConcerns}} |

### {{companyName}} の ES/面接対策メモ
- ES で使える材料: {{esPoints}}
- 逆質問候補: {{questions}}
- 志望度の理由: {{aspiration.reason}}
```

## スコープ外

- 比較 UI の実装（#45）
- 面接前復習モード・ES 接続ポイント生成ロジックの実装（#46）
- 企業データベースの構築
- 志望度・懸念点のサーバー側永続化設計

## 後続 Issue への引き継ぎ

- **#45（企業比較テーブルと志望度メモ機能）**: `CompanyComparisonEntry[]` を使った複数企業選択・比較テーブル UI、`aspiration` の編集 UI、比較結果の Markdown 出力を実装する。
- **#46（面接前復習モードと ES 接続ポイント生成）**: `source.esPoints` / `source.questions` / `source.idealCandidate` / `source.strengths` を使った面接前復習ビューと ES 接続ポイント生成を実装する。不確実な情報は `docs/output-format.md` の表記（`要確認` / `不明`）に従う。
