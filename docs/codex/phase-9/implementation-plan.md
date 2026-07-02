# Phase 9 実装計画: 企業比較・面接前復習

## Phase 目的

構造化された企業メモ(`CompanyMemoStructured` / `BriefingNote`)を、単発の Markdown 生成で終わらせず、
**複数企業を横断して再利用**できるようにする。

ユーザーが次の一連の操作を完了できる状態を目指す。

1. 説明会メモの Markdown 編集後、その企業メモを比較用に保存する
2. 保存した企業メモから複数社を選び、同じ観点で並べた比較テーブルを見る
3. 企業ごとに志望度(段階評価 + 自由記述メモ)を編集し、保存する
4. 比較結果を Markdown として出力する
5. (Post-MVP のさらに先)面接直前に、志望理由・逆質問・ES 接続ポイントを見返す

この Phase の中心原則は次の 3 点。

- **MVP のウィザード導線を汚さない**。比較・志望度メモは新規ルート `/compare` に隔離し、
  `docs/ui-spec.md:19` および `docs/ui-design.md` の「MVP 外機能を主要導線に混ぜない」を守る。
- **サーバー・DB を増やさない**。永続化はブラウザ `localStorage` の範囲に留め、
  Google Drive 保存(Phase 7, 未着手)や本格 CRM 化(Issue #45 の Out of Scope)を持ち込まない。
- **事実・印象・Web 情報の分離を維持する**。比較テーブルの観点は既存 `CompanyMemoStructured` の
  フィールド分離をそのまま使い、新たに混ぜない。

## 対象 Issue 一覧

| Issue | 生成元 | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- | --- |
| 09-01(GitHub Issue 番号未確認) | 09-01 | 企業比較用データ構造を設計する | Low | 基盤(データ構造・永続化・保存導線) |
| **#45** | 09-02 | 企業比較テーブルと志望度メモ機能を実装する | Low | 比較 UI(本ドキュメントの主対象) |
| 09-03(GitHub Issue 番号未確認) | 09-03 | 面接前復習モードと ES 接続ポイント生成を実装する | Low | 面接前復習 UI・LLM 接続ポイント生成 |

> **確認事項**: 本セッションでは `gh issue list` が実行できず、09-01 / 09-03 に対応する GitHub Issue が
> 既に作成済みかを確認できていません。`docs/generated-issues/09-01-...md` は存在しますが、対応する
> GitHub Issue が未作成の場合は、Codex 着手前に人間側で Issue を作成してください。

## 実装順序と依存関係

```text
09-01 (データ構造 + 永続化 + 保存導線: 基盤)
  ├─> #45 / 09-02 (比較テーブル UI + 志望度メモ編集 UI)
  └─> 09-03 (面接前復習 UI + ES 接続ポイント生成)
```

推奨実装順: **09-01 → #45 → 09-03**

理由:

- `docs/generated-issues/09-02-...md` の Dependencies に明記の通り、**#45 は 09-01 に依存する**。
  現状のコードベースには、複数企業メモを保持する永続化層も、比較・志望度メモに使う型も存在しない
  (`src/lib/types.ts` の `BriefingNote` はコメントで「永続化 ID・timestamp は後続の保存フェーズで扱う」と明記されている単発フロー用の集約型)。
- 09-01 の Scope は「比較観点を定義する」「CompanyMemo 拡張を設計する」「志望度メモや懸念点の扱いを整理する」であり、
  Out of Scope は「比較 UI 実装」。つまり **型定義・永続化・保存導線までが 09-01、テーブル UI が #45** という切り分けが
  Issue 本文と整合する。
- 09-03(面接前復習)も 09-01 のデータ構造に依存するため、#45 と並行不可(型が先に固まっている必要がある)。
  #45 と 09-03 は互いに独立なので、09-01 完了後は並行実装も可能。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断(Phase 全体で固定)

Codex が実装中に大きな設計判断をしなくて済むよう、以下を Phase 9 の共通決定として固定する。

### 1. 永続化はブラウザ `localStorage` のみ(09-01 で実装)

- サーバー保存・Google Drive 保存・DB は使わない(Phase 7 は未着手、Issue #45 の Out of Scope にも
  「自動応募管理」「本格 CRM 化」が明記されている)。
- キー: `briefingNoteAi.savedCompanyMemos.v1`。値は `SavedCompanyMemo[]` の JSON。
- `window` が存在しない(SSR)場合は空配列を返す。JSON パース失敗など壊れたデータは例外を投げず
  空配列にフォールバックする(ユーザーデータを失っても、アプリをクラッシュさせない)。
- 保存件数の上限は設けない(MVP 相当のブラウザ内個人利用を想定)。将来的に肥大化が問題になれば
  Follow-up として上限・整理 UI を検討する。

### 2. データ型(09-01 で `src/lib/types.ts` に追加)

```ts
export type InterestLevel = 1 | 2 | 3 | 4 | 5;

export interface InterestNote {
  level: InterestLevel | null; // null = 未評価
  memo: string; // 自由記述(志望理由・懸念・自分との接点の要約)
  updatedAt: string; // ISO 文字列
}

// 比較・志望度メモの単位。1 保存 = 1 回の説明会メモ(Markdown 編集完了時点のスナップショット)。
export interface SavedCompanyMemo {
  id: string; // crypto.randomUUID()
  companyEventInfo: CompanyEventInfo;
  memo: CompanyMemoStructured; // 比較テーブルの観点抽出に使う構造化データ
  markdown: string; // 保存時点の Markdown(ユーザー編集後を含む)
  webSupplements?: WebSupplementItem[];
  interestNote: InterestNote;
  savedAt: string;
  updatedAt: string;
}
```

- `memo: CompanyMemoStructured` を持たせることで、比較テーブルは LLM 出力ではなく
  **保存時点で確定した構造化データ**から観点を抽出する(Markdown 本文を都度パースし直さない)。
- **設計判断(要確認)**: 現状 `BriefingNoteFlow.tsx` は `handleGenerateMarkdown` で得た
  `result.memo`(`CompanyMemoStructured`)を state に保持していない(`markdownText` という文字列にしか
  変換していない)。09-01 では、この構造化オブジェクトも state に保持するよう `BriefingNoteFlow.tsx` を
  最小限拡張する必要がある。ユーザーが Markdown を手編集した場合、比較テーブルの観点はその編集を
  反映しない(保存ボタン押下時点の構造化データを使う)。この割り切りで問題ないか、人間側の確認を
  推奨する(代替案: 保存時に Markdown を見出しでパースし直す方式。実装コストと壊れやすさが上がるため
  非推奨)。

### 3. 比較観点は固定リストとして 1 箇所に集約(09-01 で `src/lib/compare/viewpoints.ts`)

```ts
export interface ComparisonViewpoint {
  key: string;
  label: string;
  getValues: (saved: SavedCompanyMemo) => string[];
}

export const COMPARISON_VIEWPOINTS: readonly ComparisonViewpoint[] = [
  { key: "strengths", label: "強み・特徴", getValues: (s) => s.memo.strengths },
  { key: "concerns", label: "気になった点", getValues: (s) => s.memo.concerns },
  { key: "esPoints", label: "自分との接点・ES 材料", getValues: (s) => s.memo.esPoints },
  { key: "idealCandidate", label: "求める人物像", getValues: (s) => s.memo.idealCandidate },
  { key: "questions", label: "次に聞きたい質問", getValues: (s) => s.memo.questions },
];
```

- 志望度(`interestNote.level`)と志望度メモ(`interestNote.memo`)は比較テーブルの固定行として別枠で扱い、
  `COMPARISON_VIEWPOINTS` には含めない(型が異なるため)。
- 観点を増減する場合は、この 1 ファイルを変更すれば比較テーブル・比較 Markdown の両方に反映される
  構成にする(#45 側で二重管理しない)。

### 4. 保存導線(09-01 で `MarkdownEditStep.tsx` に追加)

- 既存の Primary「.md をダウンロード」の隣に Secondary ボタン「比較用に保存する」を追加する。
- 押下時、その時点の `markdownText` / `companyEventInfo` / 構造化 `memo` / `webSupplements` から
  `SavedCompanyMemo` を新規生成し(`id` は毎回新規発行)、localStorage に追記する。
  同名企業の重複保存を許容する(同じ企業に複数回説明会参加するケースを想定し、上書き確認は行わない)。
- 保存後はトースト等を新設せず、ボタンラベルを一時的に「保存しました」に変える程度の軽い
  フィードバックに留める(`docs/ui-spec.md` の「装飾過多を避ける」方針に合わせる)。

### 5. ルーティングと導線分離

- 比較 UI は新規ルート `app/compare/page.tsx` に置き、`BriefingNoteFlow` の 4 ステップ導線には含めない。
- `app/page.tsx` から `/compare` への導線は、Secondary 相当の小さいテキストリンクに留め、
  Primary ボタンにはしない(`docs/ui-spec.md:19` 準拠)。

### 6. デザインシステムはそのまま踏襲、Figma ノードは無し

- Phase 9 の比較 UI に対応する Figma デザインは存在しない(`docs/ui-spec.md` の Figma 由来仕様は
  MVP ウィザードの 3 画面のみ)。したがって `docs/ui-spec.md` 冒頭の「デザインシステム方針」章
  (色・タイポグラフィ・余白・ボタン・状態)をそのまま適用し、独自トークンを増やさない。

## Phase 全体の検証方針

各 Issue の PR で最低限以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

- 比較観点抽出・比較 Markdown 生成などの純粋ロジックは Vitest で単体テストを追加する
  (`src/lib/structure/toMarkdown.test.ts` の構成を踏襲: 固定フィクスチャ → 出力の部分文字列一致)。
- localStorage を使う永続化ロジックは、`Storage` をモックするかテスト用の in-memory 実装を注入して
  決定的にテストする。
- 実ブラウザでの手動確認(保存 → 一覧表示 → 複数選択 → テーブル表示 → 志望度編集 → Markdown 出力)を
  各 Issue の Self Review で実施する。

## スコープ外(Phase 9 全体)

- Google Drive 保存・サーバー側永続化・DB(Phase 7)
- 自動応募管理・本格的な CRM 化(Issue #45 の Out of Scope)
- 面接日程管理・カレンダー連携(09-03 の Out of Scope)
- 保存済み企業メモの検索・タグ付け・並び替えなどの高度な管理機能
- 複数端末・複数ブラウザ間の同期

## リスク / 留意点

- **09-01 の GitHub Issue 未確認**: 本セッションでは `gh` コマンドが使用できず、09-01 / 09-03 に対応する
  GitHub Issue の有無・番号を確認できていない。#45 着手前に、09-01 の Issue 作成・実装・マージが
  完了しているかを人間側で確認すること。
- **構造化データと編集後 Markdown のズレ**: 上記「共有設計判断 2」の割り切り。ユーザーが Markdown を
  大きく手編集した後に保存すると、比較テーブルの内容が編集後の Markdown と食い違う可能性がある。
  MVP 相当の割り切りとして許容するか、人間側の判断を仰ぐ。
- **localStorage の制約**: ブラウザ・端末をまたいで同期しない、ユーザーがブラウザデータを消すと
  失われる。UI 上に小さく注記する。
- **保存済みメモの削除 UI 不在**: Acceptance Criteria には含まれないが、削除手段が無いと一覧が
  肥大化し続ける。#45 側の設計で最小限の削除ボタンを含めるかどうかは、Issue #45 の設計(次節)で
  Open Question として扱う。
