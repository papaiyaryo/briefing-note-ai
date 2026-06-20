# OpenAI API 連携設計

Phase 6 の OpenAI API 連携に関する設計ドキュメント。
実装時は最新の [OpenAI 公式ドキュメント](https://platform.openai.com/docs) を確認すること。

## 全体構成

```text
Browser
  |  multipart/form-data (画像)
  v
app/api/ocr/route.ts          ← サーバー専用レイヤー
  |  OCR: 画像 → テキスト
  v
OpenAI Vision API             ← API キーはここでのみ使用
  |  テキスト
  v
app/api/structure/route.ts    ← サーバー専用レイヤー
  |  構造化: OCR テキスト + 入力情報 → JSON
  v
OpenAI Structured Outputs     ← API キーはここでのみ使用
  |  CompanyMemoStructured (JSON)
  v
src/lib/structure/            ← 純粋ロジック層
  |  構造化 JSON → Markdown (決定的変換)
  v
Markdown Editor / Download    ← クライアント
```

**重要**: `OPENAI_API_KEY` および OpenAI SDK は**サーバー専用レイヤーのみ**に限定する。
`NEXT_PUBLIC_` プレフィックスを付けてクライアントへ露出させない。

## レイヤー分離

| レイヤー | 配置 | 責務 | ネットワーク |
| --- | --- | --- | --- |
| 純粋ロジック | `src/lib/` 直下・`src/lib/openai/`・`src/lib/structure/` | 契約型・エラーコード・JSON スキーマ・検証・構造化→Markdown 変換・プロバイダー判定 | 不可（単体テスト対象） |
| サーバー専用 | `src/lib/server/`・`app/api/*/route.ts` | OpenAI 呼び出し・画像検証・エラー写像・env 読み取り | OpenAI のみ |
| クライアント | `src/components/`・`src/lib/*Client.ts` | API ルートへの fetch・状態管理・UI 表示 | 自アプリの API ルートのみ |

## API ルート境界

### POST /api/ocr

```
Request:  multipart/form-data
  file: File  (画像。MIME: image/jpeg, image/png, image/webp, image/gif)

Response 200:
  { text: string, provider: "dummy" | "openai" }

Response 4xx / 5xx:
  { error: { code: ApiErrorCode, message: string } }
```

- ルートハンドラは `export const runtime = "nodejs"` で動かす（OpenAI SDK / `Buffer` 利用のため。Edge は使わない）。
- ファイルサイズ上限は `MAX_IMAGE_SIZE_BYTES`（10MB）と整合させ、超過時は `payload_too_large` を返す。
- `OPENAI_API_KEY` 未設定または `OCR_PROVIDER=dummy` の場合、`src/lib/dummyOcr.ts` のサンプルを返す。

### POST /api/structure

```
Request:  application/json
  {
    ocrText: string,
    companyEventInfo: {
      companyName: string,
      eventName: string,
      eventDate: string
    }
  }

Response 200:
  { memo: CompanyMemoStructured, provider: "dummy" | "openai" }

Response 4xx / 5xx:
  { error: { code: ApiErrorCode, message: string } }
```

- `CompanyMemoStructured` の型定義は Issue #35 で確定する。
- LLM 出力は zod スキーマで検証してから利用する。検証失敗は `validation_failed` エラーとし、Markdown を組み立てない。
- `OPENAI_API_KEY` 未設定または `STRUCTURE_PROVIDER=dummy` の場合、決定的なサンプル構造化データを返す。

## エラーコード（全 API ルート共通）

| コード | 意味 | HTTP ステータス |
| --- | --- | --- |
| `invalid_input` | リクエスト形式・内容が不正 | 400 |
| `payload_too_large` | 画像 / ボディが上限超過 | 413 |
| `not_configured` | API キー未設定で実プロバイダーを要求 | 503 |
| `rate_limited` | OpenAI レート制限 | 429 |
| `timeout` | OpenAI 応答タイムアウト | 504 |
| `provider_error` | OpenAI が予期しないエラーを返した | 502 |
| `validation_failed` | LLM 出力が zod スキーマ検証に失敗 | 502 |

レスポンス本文: `{ error: { code: ApiErrorCode, message: string } }`
`message` はユーザーに見せても安全な日本語に限定し、プロバイダー内部情報やスタックを含めない。

## 環境変数

| 変数名 | 必須 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | 実連携時のみ | なし | OpenAI API キー。未設定時はダミーにフォールバック。**クライアントへ露出しない（`NEXT_PUBLIC_` 禁止）** |
| `OCR_PROVIDER` | 任意 | 自動判定 | `"dummy"` または `"openai"`。明示した場合は `OPENAI_API_KEY` 有無より優先 |
| `STRUCTURE_PROVIDER` | 任意 | 自動判定 | `"dummy"` または `"openai"`。明示した場合は `OPENAI_API_KEY` 有無より優先 |
| `OPENAI_OCR_MODEL` | 任意 | コード内既定値 | OCR に使うモデル名（例: `gpt-4o-mini`）。**実装時に最新 OpenAI docs で確認** |
| `OPENAI_STRUCTURE_MODEL` | 任意 | コード内既定値 | 構造化に使うモデル名（例: `gpt-4o-mini`）。**実装時に最新 OpenAI docs で確認** |

### プロバイダー切替規則

```
明示フラグ (OCR_PROVIDER / STRUCTURE_PROVIDER) が設定されていれば優先
  "openai"  → 実 OpenAI を使う
  "dummy"   → ダミーを使う
未設定の場合:
  OPENAI_API_KEY が設定されていれば "openai"
  未設定なら "dummy"（MVP と同じ挙動）
```

`.env` をコミットしない。`.env.example` のみをリポジトリに含める。

## データ境界

### 送信するデータ（OpenAI へ）

| データ | 送信先 | 根拠 |
| --- | --- | --- |
| 画像ファイル（base64 / URL） | OpenAI Vision API | OCR に必要 |
| OCR テキスト | OpenAI Chat Completions | 構造化 JSON 生成に必要 |
| 企業名・イベント名・日付 | OpenAI Chat Completions | 構造化のコンテキストとして必要 |

### 保存しないデータ

- 画像ファイル（サーバーに永続化しない。リクエスト処理後に破棄）
- OCR テキスト（サーバーに保存しない）
- 生成 Markdown（サーバーに保存しない）
- OpenAI のレスポンス全体

### ログに出さないデータ

- `OPENAI_API_KEY`（シークレット）
- 画像内容・OCR 全文（選考情報・個人情報を含む可能性）
- 生成 Markdown 全文
- 企業名・個人名などの選考情報

ログに含めてよいのは、エラーコード・処理段階・所要時間などの**最小限のメタデータ**のみ。

## プライバシー注意

> **実画像・選考情報を OpenAI に送ります。**
> アップロードした画像（手書きメモなど）と抽出したテキストは、OCR および構造化のために OpenAI の API に送信されます。
> 機密性の高い個人情報・選考情報が含まれている場合、OpenAI のデータ取り扱いポリシーをご確認の上ご利用ください。
> このアプリはサーバー側でデータを永続保存しません。

## コスト方針（TODO → Issue #36 で詳細化）

- OCR（Vision）と構造化（Structured Outputs）の 2 呼び出し / メモ 1 件。
- コスト抑制の候補:
  - 画像サイズ上限（`MAX_IMAGE_SIZE_BYTES` = 10MB）でトークンを間接的に制限
  - `max_tokens` / `max_completion_tokens` を設定してトークン上限を設ける
  - モデルはコスト優先で `gpt-4o-mini` を既定にし、`OPENAI_OCR_MODEL` / `OPENAI_STRUCTURE_MODEL` で上書き可能に
  - **詳細なトークン上限・コスト試算・モデル選定は実装時（Issue #36）に最新 pricing で確認**

## ログ方針（TODO → Issue #36 で詳細化）

- エラー時: `{ code: ApiErrorCode, phase: "ocr" | "structure", durationMs: number }` 程度の最小メタデータをサーバーログに出力。
- 成功時: コード内でのログは最小限（処理段階・所要時間のみ）。
- 画像内容・OCR 全文・Markdown・シークレット類は**いかなるログにも含めない**。
- **秘匿ヘルパーの実装・ログフォーマット詳細は Issue #36 に委譲**。

## モデル選定（TODO → 実装時に確認）

- モデル名はコードにハードコードせず環境変数（`OPENAI_OCR_MODEL` / `OPENAI_STRUCTURE_MODEL`）で上書き可能にする。
- 既定候補（参考）: Vision + Structured Outputs 対応モデル（例: `gpt-4o-mini` コスト優先 / `gpt-4o` 精度優先）。
- **実装時は最新の OpenAI 公式ドキュメントでモデル名・API 仕様を確認すること。**
