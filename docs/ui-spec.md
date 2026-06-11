# UI Spec

## 目的

MVP UI 実装のブレを減らすために、色・タイポグラフィ・余白・主要コンポーネントの最小ルールを定める。

このドキュメントは 2 部構成とする。

1. デザインシステム方針(このドキュメントで定義する)
2. Figma 由来の UI 仕様(Issue #14 で Figma MCP から取得して追記する)

本格的なデザインシステム構築や Storybook 導入はスコープ外とする。

## デザイン原則

- 就活中に素早く使える、静かな作業用 UI を優先する
- カード過多・説明文過多・装飾過多を避ける
- 1 画面 1 目的とし、アップロード → OCR 確認 → Markdown 編集の導線を迷わせない
- MVP 外機能(Drive 保存、Web 補足、企業比較など)を主要導線に混ぜない

## カラー

Tailwind の標準パレットを使い、独自カラーは定義しない。

| 用途 | Tailwind クラス例 | 備考 |
| --- | --- | --- |
| ページ背景 | `bg-slate-50` | `app/globals.css` の `#f7f8fa` と同系統 |
| カード・入力背景 | `bg-white` | |
| 本文テキスト | `text-slate-600` | |
| 見出し・強調テキスト | `text-slate-900` | |
| 補助テキスト | `text-slate-500` | プレースホルダー、注記 |
| アクセント(ブランド) | `text-teal-700` / `bg-teal-700` | ボタン、リンク、ステップ強調 |
| アクセント hover | `text-teal-800` / `bg-teal-800` | |
| 枠線 | `border-slate-200` | カード、入力欄 |
| エラー | `text-red-600` / `bg-red-50` / `border-red-200` | テキスト / 背景 / 枠線 |
| 成功 | `text-emerald-600` / `bg-emerald-50` | 完了表示が必要な場合のみ |

ルール:

- アクセントカラーは teal 系のみとし、複数のアクセントを併用しない
- 意味のない色分けをしない(色は状態・操作の意味にだけ使う)

## タイポグラフィ

フォントは `app/globals.css` の指定(システム系ゴシック)をそのまま使う。

| 用途 | Tailwind クラス例 |
| --- | --- |
| ページタイトル | `text-3xl font-bold text-slate-900` |
| セクション見出し | `text-xl font-bold text-slate-900` |
| 本文 | `text-base text-slate-600` |
| 補助・注記 | `text-sm text-slate-500` |
| ラベル | `text-sm font-medium text-slate-900` |
| OCR 結果・Markdown 本文 | `font-mono text-sm` |

ルール:

- 見出しレベルを飛ばさない(h1 → h2 → h3)
- 1 画面に h1 は 1 つ

## 余白・レイアウト

Tailwind の標準スケール(4px 単位)のみ使い、任意値(`p-[13px]` など)は使わない。

| 用途 | クラス例 |
| --- | --- |
| ページ左右パディング | `px-6` |
| ページ上下パディング | `py-10` |
| コンテンツ最大幅 | `max-w-3xl`(Markdown 編集画面は `max-w-5xl` まで可) |
| カード内パディング | `p-6` または `p-8` |
| セクション間 | `space-y-8` |
| フォーム要素間 | `space-y-4` |
| ラベルと入力欄の間 | `space-y-1` または `mb-1` |
| 角丸 | `rounded-lg` |
| 影 | `shadow-sm`(これより強い影は使わない) |

## 主要コンポーネントと状態

### ボタン

| 種別 | 用途 | クラス方針 |
| --- | --- | --- |
| Primary | OCR 実行、Markdown 生成、ダウンロード | `bg-teal-700 text-white hover:bg-teal-800` |
| Secondary | 再実行、戻る、キャンセル | `border border-slate-200 bg-white text-slate-900 hover:bg-slate-50` |

状態:

- default / hover
- focus: `focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2`
- disabled: `disabled:opacity-50 disabled:cursor-not-allowed`
- loading: ボタン内テキストを処理中表記に変え、`disabled` にする(スピナーは任意)

ルール:

- 1 画面の主要導線に Primary ボタンは 1 つ
- 破壊的操作は MVP に存在しないため、danger ボタンは定義しない

### 画像アップロード領域

- 枠: `border-2 border-dashed border-slate-300 rounded-lg bg-white`
- 状態: 未選択(対応形式とサイズ上限を表示) / ドラッグ中(`border-teal-700`) / 選択済み(プレビュー表示) / エラー
- ファイル選択は `<input type="file">` を必ず併用し、ドラッグ&ドロップ専用にしない

### テキスト入力・テキストエリア

- 基本: `border border-slate-200 rounded-lg bg-white px-3 py-2 text-slate-900`
- focus: `focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:border-teal-700`
- error: `border-red-200` + 下部に `text-sm text-red-600` のメッセージ
- OCR 結果・Markdown エディタは `font-mono` の `textarea` を基本とする

### ステップ表示

- アップロード → OCR 確認 → Markdown 編集 の 3 ステップを示す
- 現在ステップ: `text-teal-700 font-bold`、未到達: `text-slate-400`
- ステップ表示はナビゲーションではなく現在地表示とする(クリック遷移は必須にしない)

### エラー・空状態・ローディング

| 状態 | 方針 |
| --- | --- |
| エラー | `bg-red-50 border border-red-200 text-red-600` のボックスで、原因と次の操作(再実行・再選択)を 1〜2 文で示す |
| 空状態 | 説明 1 文 + 開始操作のみ。イラストや長文は使わない |
| ローディング | 処理中テキスト(例: 「OCR を実行しています…」)+ ボタン disabled。スケルトン UI は MVP では使わない |

エラー文言は `docs/user-flow.md` の「エラー時のフロー」に従う。

## アクセシビリティ(MVP の最低限)

- テキストと背景のコントラストは WCAG AA(4.5:1)を満たす(上記の slate / teal の組み合わせは満たす)
- すべての操作をキーボードのみで完了できる
- フォーカス表示を消さない(`outline-none` 単独使用を禁止し、必ず `focus-visible:ring` を併用する)
- 入力欄には `<label>` を関連付ける
- 画像プレビューには `alt`(例: アップロードしたメモ画像)を付ける
- エラーは色だけで伝えず、テキストで内容を示す
- ボタンはアイコンのみにせず、テキストラベルを付ける

## Figma 由来の UI 仕様

Issue #13 で作成した Figma デザインから、Figma MCP(`get_design_context`)で取得した UI 仕様を整理する(2026-06-11 取得)。

### 取得元

```text
Figma file:
- Name: briefing-note-ai MVP UI
- URL: https://www.figma.com/design/5fcon3s69LHgb9Zi1wIAod
- File key: 5fcon3s69LHgb9Zi1wIAod

Target nodes (page: MVP UI):
- Upload step: 2:2
- OCR result step: 2:3
- Markdown editor step: 2:4
- State variations (error / empty / loading): 2:5
```

### 共通レイアウト構造(全画面)

```text
ページ(bg-slate-50 / flex-col / items-center / gap-8 / px-6 py-10)
├── ヘッダー(flex-col gap-2)
│   ├── h1: Briefing Note AI(text-3xl font-bold text-slate-900)
│   └── 説明: text-base text-slate-600
├── ステップ表示(flex gap-4 items-center)
│   └── 各ステップ = 番号サークル(24px rounded-full)+ ラベル(text-sm)
│       区切りは「→」text-slate-300
└── コンテンツカード(bg-white border-slate-200 rounded-lg shadow-sm p-8 / flex-col gap-6)
```

- コンテンツ幅は 768px(`max-w-3xl` 相当)。画面 3 のみ 1024px(`max-w-5xl` 相当)
- ステップ表示の状態: 現在 = サークル `bg-teal-700` + 白番号 bold、ラベル `text-teal-700 font-bold` / それ以外 = サークル白 + `border-slate-300`、番号・ラベル `text-slate-400`

### 画面別のカード内構造

画面 1: アップロード(node 2:2)

- h2(text-xl font-bold)→ 説明(text-sm text-slate-500)→ アップロード領域 → アクション行(右寄せ)
- アップロード領域(node 4:5): `border-2 border-dashed border-slate-300 rounded-lg` / 中央寄せ / `py-10 px-6` / gap-3。中身は案内文(text-base text-slate-600)、対応形式の注記(text-sm text-slate-500)、Secondary ボタン「ファイルを選択」
- Primary ボタン「OCR を実行する」は未選択時 disabled(`opacity-50`)

画面 2: OCR 結果確認(node 2:3)

- h2 → 説明 → 2 カラム(flex gap-6)→ アクション行(justify-between)
- 画像縮小プレビュー(node 7:6): 220×320 固定 / `bg-slate-100 border-slate-200 rounded-lg` / 中央にプレースホルダーテキスト
- OCR 結果 textarea(node 7:8): `flex-1 self-stretch` / `border-slate-200 rounded-lg p-3` / `font-mono` 14px / 行間 1.8
- アクション行: Secondary「OCR を再実行」左 / Primary「Markdown を生成する」右

画面 3: Markdown 編集(node 2:4)

- h2 → タブ行 → 2 ペイン(flex gap-6、各 `flex-1`)→ アクション行(justify-between)
- タブ行(node 9:4): アクティブ「編集」= `pb-2 px-1 border-b-2 border-teal-700` + `text-sm font-bold text-teal-700` / 非アクティブ「プレビュー」= `text-sm text-slate-500`。タブは狭い画面用で、`md:` 以上は 2 ペイン同時表示
- Markdown エディタ(node 9:11): `border-slate-200 rounded-lg p-3` / `font-mono` 13px / 行間 1.7。初期値は `docs/output-format.md` のテンプレート構造
- プレビュー(node 9:13): `border-slate-200 rounded-lg p-4` / gap-2.5 / 見出し bold slate-900 + 本文 text-sm slate-600 の簡易表示
- アクション行: Secondary「OCR 確認に戻る」/ Primary「.md をダウンロード」

### 実装で参照すべきコンポーネントと状態

| コンポーネント | 参照 node id | 状態 |
| --- | --- | --- |
| ステップ表示 | 3:5(現在=1)/ 6:5(現在=2)/ 8:5(現在=3) | 現在 / 未到達 |
| Primary ボタン | 7:13(default)/ 4:11(disabled)/ 11:5・11:7(loading) | default / disabled / loading |
| Secondary ボタン | 4:8 / 7:11 / 9:24 | default |
| アップロード領域 | 4:5(未選択)/ 11:11(ドラッグ中) | 未選択 / ドラッグ中 |
| textarea(OCR / Markdown) | 7:8 / 9:11 | default |
| エラーボックス | 10:5(形式エラー)/ 10:8(OCR 失敗)/ 10:11(生成失敗) | 画面別メッセージ |
| タブ | 9:5(選択中)/ 9:7(非選択) | active / inactive |

エラーボックスの構造(node 10:5 ほか): `bg-red-50 border border-red-200 rounded-lg px-4 py-3` / ラベル(text-xs font-medium)+ 本文(text-sm)、文字色はいずれも `text-red-600`。

### デザインシステム方針との差分・実装時の注意

- 色・角丸・影は上記デザインシステム方針の Tailwind トークンと一致しており、独自カラーは増えていない(影は `shadow-sm` 相当)
- 方針で未定義だった値を Figma 側で確定した。実装ではこれを標準とする
  - ボタン余白: `px-4 py-2.5`
  - ステップ番号サークル: 24px(`size-6 rounded-full`)、番号 `text-xs`
  - タブのアクティブ表示: `text-teal-700 font-bold` + `border-b-2 border-teal-700`
- 画面 2 の画像プレビュー背景に slate-100 を使っているが、これはプレースホルダー用途のみ。実装では実画像を表示するため、状態色としては追加しない
- フォントは Figma 上では Noto Sans JP / Roboto Mono で代替している。実装は `app/globals.css` のシステム系ゴシックと `font-mono` をそのまま使う
- 等幅テキストの行間(1.8 / 1.7)は任意値のため、実装では `leading-relaxed` など Tailwind 標準スケールに丸めてよい
- Figma 上の固定幅(768 / 1024 / 220×320)は `max-w-3xl` / `max-w-5xl` / プレビュー幅の目安であり、レスポンシブ挙動は `docs/ui-design.md` のレスポンシブ方針に従う
- hover・focus 状態は静的デザインのため Figma 上に存在しない。実装では上記「主要コンポーネントと状態」の hover / focus-visible ルールを必ず付与する
