# Issue #45 設計: 企業比較テーブルと志望度メモ機能を実装する

対象 GitHub Issue: #45(`docs/generated-issues/09-02-企業比較テーブルと志望度メモ機能を実装する.md`)
Phase: 9 / 優先度: Low / 実装順: **2 番目**(09-01 の後)

## 前提(Phase 計画より)

本 Issue は 09-01(企業比較用データ構造を設計する)に依存する。09-01 で以下が実装済みであることを
前提とする(詳細は `docs/codex/phase-9/implementation-plan.md` の「共有設計判断」を正準とする)。

- `SavedCompanyMemo` / `InterestNote` 型(`src/lib/types.ts`)
- localStorage ベースの永続化ユーティリティ(想定: `src/lib/savedMemos/storage.ts`)
  - `listSavedCompanyMemos(): SavedCompanyMemo[]`
  - `saveSavedCompanyMemo(input): SavedCompanyMemo`
  - `updateInterestNote(id, note): SavedCompanyMemo | null`
  - (Open Question: `deleteSavedCompanyMemo(id): void` を含めるかは下記参照)
- 比較観点の定義(想定: `src/lib/compare/viewpoints.ts` の `COMPARISON_VIEWPOINTS`)
- `MarkdownEditStep.tsx` の「比較用に保存する」ボタン
- `BriefingNoteFlow.tsx` が構造化 `CompanyMemoStructured` を state に保持するための拡張

09-01 未完了の状態で着手すると型・永続化 API が存在せず実装できないため、Codex は着手前に
09-01 の PR がマージ済みであることを確認すること。マージされていない場合は人間に確認する
(`AGENTS.md` の Conflict resolution に準じ、勝手に 09-01 相当の実装を先取りしない)。

## Issue 概要

保存済みの複数企業メモから企業を選び、同じ観点(強み・懸念・自分との接点など)で横並び比較できる
テーブル UI と、企業ごとの志望度(段階評価 + 自由記述メモ)を編集できる UI を実装する。
比較結果は Markdown として出力できる。

## スコープ

- 保存済み企業メモの一覧から複数選択できる UI
- 選択した企業を `COMPARISON_VIEWPOINTS` の観点で横並びにした比較テーブル
- 企業ごとの志望度(1〜5 の段階評価)と志望度メモ(自由記述)を編集し、localStorage に保存する UI
- 比較テーブル(選択企業 + 観点 + 志望度 + 志望度メモ)を Markdown として `.md` ダウンロードする機能

## スコープ外

- 自動応募管理・本格的な CRM 化(Issue 本文の Out of Scope)
- 保存済み企業メモの新規作成(それは MVP ウィザード側の役割。本 Issue は「選ぶ・比較する・志望度を書く」のみ)
- 面接前復習・ES 接続ポイント生成(09-03)
- Google Drive 連携・サーバー保存(Phase 7)
- 保存済み企業メモの検索・タグ付け・並び替え

## 画面設計

### ルーティング

- 新規ルート `app/compare/page.tsx` → `<CompareView />` を描画する。
- `app/page.tsx`(MVP ウィザード)には `/compare` への小さいテキストリンクのみ追加する
  (Primary ボタン化しない。`docs/ui-spec.md:19` 準拠)。

### `CompareView`(`src/components/compare/CompareView.tsx`)

1. マウント時に `listSavedCompanyMemos()` を呼び、`savedMemos` を state に保持する。
2. `savedMemos.length === 0` の場合、空状態を表示する。
   - 文言例: 「比較できる保存済み企業がありません。企業メモの Markdown 編集画面で
     「比較用に保存する」を押すと、ここに追加されます。」
   - `docs/ui-spec.md` の空状態方針(説明 1 文 + 開始操作のみ)に従う。
3. `savedMemos.length >= 1` の場合、`SavedMemoListPanel` で複数選択させる。
4. 選択数が 2 未満の間は比較テーブルを表示せず、案内文
   「比較するには 2 社以上選択してください」を表示する(AC「複数企業を...比較できる」に対応)。
5. 選択数が 2 以上になったら `ComparisonTable` を表示する。
6. 画面下部に Primary ボタン「比較結果を Markdown として出力する」を 1 つだけ置く
   (選択数 2 未満は disabled)。

### `SavedMemoListPanel`(`src/components/compare/SavedMemoListPanel.tsx`)

- 保存済みメモを 1 件 1 行のチェックボックスリストで表示する。
- 各行: 企業名(`companyEventInfo.companyName`)、イベント日(`companyEventInfo.eventDate`)、
  現在の志望度(★表記でなく `text-sm text-slate-500` の「志望度: 4」のような文字表記。
  `docs/ui-spec.md` のアクセシビリティ方針「ボタンはアイコンのみにせず、テキストラベルを付ける」に
  合わせ、本リストでもアイコンのみの表現は避ける)。
- チェックボックスは `<label>` で関連付ける(`docs/ui-spec.md` アクセシビリティ準拠)。

### `ComparisonTable`(`src/components/compare/ComparisonTable.tsx`)

- 行 = 観点、列 = 選択企業(見出し行に企業名)。
- 先頭の固定行として「志望度」を表示し、`InterestNoteEditor` の段階評価部分をセル内に埋め込む。
- `COMPARISON_VIEWPOINTS` を順に行として描画し、各セルは `getValues(saved)` の配列を
  箇条書き(`<ul>`)で表示する(値が空配列の場合は `要確認` を表示し、既存の
  `docs/output-format.md` の「不確実な情報の扱い」と表記を揃える)。
- 末尾の固定行として「志望度メモ」を表示し、`InterestNoteEditor` の自由記述部分(`textarea`)を
  セル内に埋め込む。
- テーブルは横スクロール可能にする(`overflow-x-auto`)。選択企業数が増えてもレイアウトが壊れない
  ようにする。3 社以上でも列を増やすだけで対応できる構成とする。

### `InterestNoteEditor`(`src/components/compare/InterestNoteEditor.tsx`)

- 段階評価: テキストラベル付きボタン 5 個(「1」〜「5」)。選択中は `bg-teal-700 text-white`、
  非選択は `border border-slate-200 bg-white text-slate-900`(`docs/ui-spec.md` のボタン方針を流用)。
  未評価状態(`level: null`)も許容する。
- 自由記述: `textarea`(`border-slate-200 rounded-lg`、focus は `focus-visible:ring-2
  focus-visible:ring-teal-700`)。
- 変更確定タイミング: 段階評価はクリックで即時保存(`updateInterestNote`)、自由記述は
  `onBlur` で保存する(入力の度に localStorage 書き込みしない)。
- 保存後は `CompareView` 側の `savedMemos` state も更新し、テーブル表示に反映する。

## 比較結果 Markdown 出力

### `toComparisonMarkdown`(`src/lib/compare/toComparisonMarkdown.ts`)

純粋関数。`(selected: SavedCompanyMemo[]) => string`。`src/lib/structure/toMarkdown.ts` と
同じ「決定的な変換関数 + 別ファイルで単体テスト」の構成を踏襲する。

出力テンプレート案:

````markdown
# 企業比較

## 比較テーブル

| 観点 | {{企業A}} | {{企業B}} |
| --- | --- | --- |
| 志望度 | {{4 または 未評価}} | {{3 または 未評価}} |
| 強み・特徴 | {{箇条書きを <br> 区切りで結合}} | ... |
| 気になった点 | ... | ... |
| 自分との接点・ES 材料 | ... | ... |
| 求める人物像 | ... | ... |
| 次に聞きたい質問 | ... | ... |

## 志望度メモ

### {{企業A}}
{{自由記述 または "(メモなし)"}}

### {{企業B}}
{{自由記述 または "(メモなし)"}}
````

- 表セル内の複数行箇条書きは `<br>` 区切りで 1 セルにまとめる(GitHub Flavored Markdown の
  テーブルは素の改行を扱えないため)。**設計判断(要確認)**: `<br>` を使う代わりに、企業ごとに
  観点をセクション化する形式(表なし)も選択肢としてあり得る。Issue 本文が「比較テーブルを生成する」
  「比較結果を Markdown として出力できる」と明記しているため、本設計では表形式を採用するが、
  `<br>` 挿入がユーザーの編集体験として許容できるか、人間側の確認を推奨する。
- ファイル名は `src/lib/download.ts` に `buildComparisonDownloadFileName({ now })` を追加し、
  `company-comparison-{タイムスタンプ}.md` の形式にする(既存 `buildMarkdownDownloadFileName` の
  単一企業向け実装と衝突させない、別関数として追加)。
- ダウンロード自体は既存の `downloadMarkdownFile` / `createMarkdownBlob`(`src/lib/download.ts`)を
  そのまま再利用する(企業メモに依存しない汎用実装であることを確認済み)。

## 実装ステップ

1. 09-01 の PR がマージ済みであることを確認する(型・永続化 API・保存導線)。未マージなら着手前に
   人間へ確認する。
2. `src/lib/compare/toComparisonMarkdown.ts` と単体テスト
   `src/lib/compare/toComparisonMarkdown.test.ts` を実装する(`COMPARISON_VIEWPOINTS` を使い、
   固定フィクスチャ 2〜3 社分で出力の部分文字列を検証。志望度未評価・志望度メモ空の場合の
   フォールバック表記も検証する)。
3. `src/lib/download.ts` に `buildComparisonDownloadFileName` を追加し、既存テストファイルに
   ケースを追加する。
4. `src/components/compare/SavedMemoListPanel.tsx` を実装する(一覧・複数選択・空状態)。
5. `src/components/compare/InterestNoteEditor.tsx` を実装する(段階評価ボタン + 自由記述 textarea)。
6. `src/components/compare/ComparisonTable.tsx` を実装する(`COMPARISON_VIEWPOINTS` 描画 +
   `InterestNoteEditor` 埋め込み)。
7. `src/components/compare/CompareView.tsx` を実装し、上記を組み合わせる(一覧 → 選択 →
   テーブル → Markdown 出力ボタン)。
8. `app/compare/page.tsx` を新規作成し、`CompareView` をマウントする。
9. `app/page.tsx` に `/compare` への小さいテキストリンクを追加する。
10. Self Review: 保存 0 件・1 件・2 件以上・志望度未評価・志望度メモ空、のケースを手動確認する。

## 変更が想定されるファイル

- `app/compare/page.tsx`(新規)
- `app/page.tsx`(`/compare` へのリンク追加)
- `src/components/compare/CompareView.tsx`(新規)
- `src/components/compare/SavedMemoListPanel.tsx`(新規)
- `src/components/compare/ComparisonTable.tsx`(新規)
- `src/components/compare/InterestNoteEditor.tsx`(新規)
- `src/lib/compare/toComparisonMarkdown.ts`(新規)
- `src/lib/compare/toComparisonMarkdown.test.ts`(新規)
- `src/lib/download.ts`(`buildComparisonDownloadFileName` を追加)
- 既存 download 関連テストファイル(ケース追加)

09-01 側で先に用意される想定のファイル(本 Issue では変更しないが参照する):

- `src/lib/types.ts`(`SavedCompanyMemo` / `InterestNote`)
- `src/lib/savedMemos/storage.ts`
- `src/lib/compare/viewpoints.ts`
- `src/components/steps/MarkdownEditStep.tsx`(保存ボタン)
- `src/components/BriefingNoteFlow.tsx`(構造化 memo の state 保持)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 複数企業を同じ観点で比較できる | `SavedMemoListPanel` の複数選択(2 社以上) + `ComparisonTable` が `COMPARISON_VIEWPOINTS` を全選択企業で共通の行として描画 |
| 志望度メモを保存またはエクスポートできる | `InterestNoteEditor` が `updateInterestNote` で localStorage に保存(09-01 の API) + `toComparisonMarkdown` が「志望度メモ」セクションとして出力 |
| 比較結果を Markdown として出力できる | `toComparisonMarkdown` + 既存 `downloadMarkdownFile` による `.md` ダウンロード |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

手動確認:

1. 保存済み企業メモが 0 件のとき、`/compare` が空状態を表示する
2. 1 件だけ選択した状態では比較テーブルが表示されず、案内文が出る
3. 2 件以上選択すると比較テーブルが表示され、観点ごとに横並びで確認できる
4. 志望度ボタンを押すと即座に反映され、再読み込み後も保持されている(localStorage 確認)
5. 志望度メモを入力して欄外をクリックすると保存される
6. 「比較結果を Markdown として出力する」で `.md` がダウンロードされ、テーブルと志望度メモの
   両方が含まれている
7. `/`(MVP ウィザード)の主要導線に比較機能が混ざっていない(リンクのみ)

## リスク / 不明点

- **09-01 未マージ時のブロック**: 本 Issue は型・永続化・保存導線を 09-01 に委譲している。09-01 の
  実装内容(関数シグネチャ等)が本設計の想定と異なる場合、Codex は実装を進める前に差分を人間に
  報告し、指示を仰ぐこと(`AGENTS.md` の Conflict resolution 準拠)。
- **削除 UI の要否**: Acceptance Criteria に含まれないため本設計ではスコープ外としたが、
  保存が増え続けると一覧が使いにくくなる。人間側で「本 Issue に含める」か「Follow-up にする」かの
  判断を推奨する。
- **`<br>` を使った表セル**: 上記「比較結果 Markdown 出力」に記載の通り、素の Markdown 表現からの
  小さな逸脱。人間側の確認を推奨する。
- **構造化データと編集後 Markdown のズレ**: `docs/codex/phase-9/implementation-plan.md` の
  共有設計判断 2 を参照。比較テーブルは保存時点の構造化データを表示するため、保存後に元の
  Markdown 編集画面へ戻って手編集しても比較テーブルには反映されない。
- **志望度の表現(数値ボタン vs 星アイコン)**: Phase 9 には対応する Figma デザインが無いため、
  `docs/ui-spec.md` のデザインシステム方針から素直に導いたテキストラベル付きボタンを採用した。
  視覚的な改善(星アイコン化など)は Follow-up として扱ってよい。
