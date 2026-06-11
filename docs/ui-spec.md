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
| アクセント(ブランド) | `teal-700` | ボタン、リンク、ステップ強調 |
| アクセント hover | `teal-800` | |
| 枠線 | `border-slate-200` | カード、入力欄 |
| エラー | `red-600` / `bg-red-50` / `border-red-200` | テキスト / 背景 / 枠線 |
| 成功 | `emerald-600` / `bg-emerald-50` | 完了表示が必要な場合のみ |

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
- focus: `focus:ring-2 focus:ring-teal-700 focus:border-teal-700`
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

## Figma 由来の UI 仕様(Issue #14 で追記)

Issue #13 で作成する Figma デザインから、Issue #14 で以下を取得してこの節に追記する。

- 各画面(アップロード / OCR 確認 / Markdown 編集)のレイアウト構造
- file key と対象 node id(記録方法は `docs/figma-mcp-setup.md` を参照)
- 上記デザインシステム方針との差分(差分がある場合はこのドキュメントを更新して整合させる)
