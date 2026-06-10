# Architecture

## 方針

MVP では、紙メモ画像をアップロードし、OCR 結果を表示し、LLM で Markdown 化し、ユーザーが編集して `.md` ダウンロードできる最小構成を目指します。

現時点では React 実装は行いません。このドキュメントは、今後の実装時に参照する設計メモです。

## 想定構成

初期実装では、フロントエンド中心の Web アプリとして開始し、必要に応じてバックエンド API を追加します。

```text
Browser
  |
  | image upload
  v
Frontend App
  |
  | OCR request
  v
OCR Provider
  |
  | extracted text
  v
Frontend App
  |
  | markdown generation request
  v
LLM Provider
  |
  | generated markdown
  v
Markdown Editor
  |
  | download
  v
Local .md file
```

## 主要モジュール案

### Upload

責務:

- 画像ファイル選択
- ファイル形式とサイズの検証
- 画像プレビュー
- OCR 処理への入力作成

### OCR

責務:

- 画像からテキストを抽出する
- OCR 結果とエラーを UI に返す
- 将来的に OCR エンジンを差し替えられる境界を持つ

初期候補:

- ブラウザ側 OCR ライブラリ
- サーバー側 OCR
- OpenAI Vision API

MVP では、実装コストと精度を比較して決定します。

### Markdown Generation

責務:

- OCR テキストを企業研究用 Markdown に変換する
- 出力フォーマットを安定させる
- 不明情報を断定しない
- ES・面接対策に使える観点を抽出する

### Markdown Editor

責務:

- 生成 Markdown を編集する
- 編集内容を画面状態として保持する
- ダウンロード対象の Markdown を管理する

### Download

責務:

- Markdown 文字列から `.md` ファイルを生成する
- ファイル名を決定する
- ブラウザからダウンロードさせる

## データモデル案

```ts
type BriefingNote = {
  id: string;
  imageFileName: string;
  companyName?: string;
  ocrText: string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
};
```

```ts
type ProcessingState =
  | "idle"
  | "uploading"
  | "ocr_running"
  | "markdown_generating"
  | "ready"
  | "error";
```

## Markdown 出力テンプレート

```markdown
# {{companyName}}

## 説明会概要
- 日時:
- 登壇者:
- 参加目的:

## 事業内容

## 強み・特徴

## 求める人物像

## 気になった点

## ES・面接で使えそうな材料

## 次に調べること

## 元メモからの抜粋
```

## API 境界案

バックエンドを置く場合、以下の API 境界を想定します。

```text
POST /api/ocr
  input: image file
  output: { text: string }

POST /api/markdown
  input: { ocrText: string }
  output: { markdown: string, companyName?: string }
```

MVP で外部 API キーを使う場合は、ブラウザに直接露出させず、サーバー側で扱います。

## セキュリティとプライバシー

- メモ画像、OCR テキスト、生成 Markdown は個人情報や選考情報を含む可能性がある
- 外部 API に送るデータは最小限にする
- API キーはクライアントに埋め込まない
- 将来保存機能を追加するまでは、永続保存しない設計を優先する
- ログに画像内容や OCR 全文を不用意に出さない

## 将来拡張

### OpenAI Vision API

- OCR と構造化を一体化できる
- 手書き、矢印、囲み、表などの解釈補助に使う
- コストとプライバシーの説明が必要

### Google Drive

- OAuth 認証が必要
- Drive 保存先フォルダの指定が必要
- Markdown ファイル、将来的には元画像も保存対象にできる

### Web 補足

- 公式サイトや採用ページを優先する
- 出典 URL と取得日を Markdown に残す
- LLM の推測ではなく、参照情報として扱う

### 企業比較

- Markdown を構造化データとして読み直す必要がある
- 比較観点を固定化すると、ES や面接準備に使いやすい

