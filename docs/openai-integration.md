# OpenAI API 連携設計（Phase 6 / Issue #33）

## 目的

Phase 6 では、Phase 4 までのダミー OCR / 決定的 Markdown 生成フローを壊さずに、OpenAI API をサーバー側から呼び出すための境界を整理する。この Issue #33 では実 API 呼び出しは実装せず、後続 Issue #34（OCR）・#35（構造化）・#36（エラー / コスト / ログ）の土台となる契約だけを定義する。

## 全体構成

```txt
Browser
  ├─ 画像アップロード / 入力情報
  │
  ├─ POST /api/ocr
  │    └─ Server API Route（nodejs）
  │         ├─ provider=dummy: 既存ダミー OCR
  │         └─ provider=openai: OpenAI Vision（#34 で実装）
  │
  └─ POST /api/structure
       └─ Server API Route（nodejs）
            ├─ provider=dummy: 決定的なサンプル構造化
            └─ provider=openai: OpenAI Structured Outputs（#35 で実装）
```

`OPENAI_API_KEY` と OpenAI SDK はサーバー専用レイヤーだけで扱う。クライアントは自アプリの API Route のみを呼び、`NEXT_PUBLIC_` 付きの OpenAI 関連環境変数は作らない。

## レイヤー分離

| レイヤー | 配置 | 責務 | OpenAI API キー |
| --- | --- | --- | --- |
| 純粋ロジック | `src/lib/` | 契約型、プロバイダー判定、検証、Markdown 組み立て | 参照しない |
| サーバー専用 | `src/lib/server/`、`app/api/*/route.ts` | OpenAI 呼び出し、画像検証、エラー写像、env 読み取り | 参照可 |
| クライアント | `src/components/` | UI、状態管理、自アプリ API Route への fetch | 参照しない |

## API Route 契約

### `POST /api/ocr`

- Runtime: `nodejs`
- Request: `multipart/form-data`
  - `file`: 画像ファイル
- Response（成功）:

```json
{
  "text": "OCR text",
  "provider": "dummy"
}
```

`provider` は `"dummy" | "openai"`。画像サイズ上限は既存のアップロード制限と揃え、超過時は `payload_too_large` を返す。

### `POST /api/structure`

- Runtime: `nodejs`
- Request: JSON

```json
{
  "ocrText": "OCR text",
  "companyEventInfo": {
    "companyName": "企業名",
    "eventName": "説明会",
    "eventDate": "2026-06-21"
  }
}
```

- Response（成功）:

```json
{
  "memo": {},
  "provider": "dummy"
}
```

`memo` の具体型は Issue #35 で `CompanyMemoStructured` として定義する。Markdown は API が直接返すのではなく、検証済み構造化 JSON から純粋関数で組み立てる。

### エラーレスポンス

全 API Route は次の形式を返す。

```json
{
  "error": {
    "code": "invalid_input",
    "message": "入力内容を確認してください。"
  }
}
```

安定エラーコードは次の 8 種類に固定する。

- `invalid_input`
- `payload_too_large`
- `not_configured`
- `rate_limited`
- `timeout`
- `provider_error`
- `validation_failed`
- `company_not_found`

`message` はユーザーに表示しても安全な日本語に限定し、スタックトレース、プロバイダー内部レスポンス、API キー、画像内容、OCR 全文、生成 Markdown を含めない。

## 環境変数

| 変数 | 用途 | クライアント露出 | 既定 / 切替規則 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API 認証 | 不可 | 未設定なら `dummy` にフォールバック |
| `OCR_PROVIDER` | OCR プロバイダー明示指定 | 不可 | `dummy` / `openai`。設定時は API キー有無より優先 |
| `STRUCTURE_PROVIDER` | 構造化プロバイダー明示指定 | 不可 | `dummy` / `openai`。設定時は API キー有無より優先 |
| `OPENAI_OCR_MODEL` | OCR / Vision モデル上書き | 不可 | 未設定時の候補は実装時に公式 docs で確認 |
| `OPENAI_STRUCTURE_MODEL` | Structured Outputs モデル上書き | 不可 | 未設定時の候補は実装時に公式 docs で確認 |
| `WEB_SUPPLEMENT_PROVIDER` | Web 補足プロバイダー明示指定 | 不可 | `dummy` / `openai`。設定時は API キー有無より優先 |
| `OPENAI_WEB_SUPPLEMENT_MODEL` | Web 補足生成モデル | 不可 | Web 補足有効時は必須。未設定なら `not_configured` |
| `WEB_SUPPLEMENT_ENABLED` | Web 補足 API の明示的な有効化 | 不可 | MVP 期間の誤公開防止のため、`true` の場合のみ API 実行 |

OpenAI 公式 docs では、Responses API がテキストと画像入力に対応し、Structured Outputs が JSON Schema に沿った出力を得るための仕組みとして案内されている。実装 Issue ではその時点の公式 docs でモデル名・パラメータを再確認する。

## プロバイダー切替方針

プロバイダー判定は純粋関数として `src/lib/openai/provider.ts` に置く。

1. `OCR_PROVIDER` / `STRUCTURE_PROVIDER` / `WEB_SUPPLEMENT_PROVIDER` が `openai` または `dummy` の場合は明示指定を優先する。
2. 明示指定がない場合、`OPENAI_API_KEY` があれば `openai` を使う。
3. `OPENAI_API_KEY` がなければ `dummy` を使い、MVP のダミーフローを維持する。
4. 不明な明示値は無視し、API キーの有無でフォールバックする。

## データ境界

### OpenAI に送信するデータ

- `POST /api/ocr`: ユーザーがアップロードした画像（Issue #34 で実装）
- `POST /api/structure`: OCR テキスト、企業名、イベント名、イベント日（Issue #35 で実装）

### 保存しないデータ

- アップロード画像そのもの
- OCR 全文
- 生成された構造化 JSON / Markdown
- OpenAI API キー
- 選考・個人情報を含む中間データ

Phase 6 では DB や Google Drive への永続化を行わない。永続化は Phase 7 以降のスコープで改めて設計する。

### ログに出さないデータ

- アップロード画像、base64 文字列、ファイル内容
- OCR 全文
- 生成 Markdown / 構造化 JSON 全文
- API キー、Authorization ヘッダー、`.env` の内容
- ユーザーの個人情報や選考情報

ログに残す場合は、エラーコード、処理段階、所要時間、ファイルサイズなど最小限のメタデータに限定する。

## プライバシー注意

実プロバイダー利用時は、ユーザーの手書きメモ画像や選考関連テキストを OpenAI に送信する。UI / README / docs では、外部 API に送信されるデータと保存しないデータを明確に説明する。

## スコープ外

- OpenAI API の実呼び出し
- `openai` / `zod` 依存追加
- Google Drive 連携
- Web 補足情報の取得
- ユーザーアカウントや永続化

## コスト方針

### 1 メモあたりの API 呼び出し回数

- OCR（Vision API）: 1 回
- 構造化 JSON 生成（Structured Outputs）: 1 回
- 合計: 2 回 / メモ

### コスト要因

- 画像解像度・ファイルサイズ（Vision 入力トークンに影響）
- 出力トークン数（構造化 JSON / Markdown 変換元データの長さ）
- モデル選択（低コスト既定モデルと高精度モデルの差）

### 抑制策

- 画像サイズ上限は `src/lib/upload.ts` の 10MB 制限と揃える。
- OpenAI 呼び出しでは用途ごとに出力トークン上限を設定する。
- `OPENAI_OCR_MODEL` / `OPENAI_STRUCTURE_MODEL` でモデルを環境変数から切り替えられるようにする。
- 開発・テストでは `OPENAI_API_KEY` 未設定時にダミーモードを使い、API 呼び出しを発生させない。

### Post-MVP

- 課金ダッシュボード連携、ユーザー別利用量管理、利用量上限は Post-MVP の検討事項とし、本 Issue では実装しない。
