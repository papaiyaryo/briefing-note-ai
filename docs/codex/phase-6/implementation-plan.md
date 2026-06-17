# Phase 6 実装計画: OpenAI API 連携(実 OCR / 構造化 Markdown 生成)

## Phase 目的

Phase 4 で deterministic(決定的)に作ったローカル完結のデータフロー
(ダミー OCR → テンプレート Markdown 生成)に、**サーバー側で OpenAI API を呼ぶ実連携の境界**を追加する。

ユーザーが次の一連の操作を、実画像・実 LLM で完了できる状態を目指す。

1. 画像をアップロードする
2. サーバー経由で OpenAI Vision により OCR テキストを得る
3. OCR テキストと入力情報から、企業研究用の**構造化 JSON(CompanyMemo)** を生成・検証する
4. 構造化 JSON から決定的に Markdown を組み立てる
5. Markdown を編集・プレビューし、`.md` としてダウンロードする

この Phase の中心原則は次の 3 点。

- **API キーはサーバー側だけで扱う**(クライアントへ露出させない / `NEXT_PUBLIC_` を付けない)
- **OCR テキストを直接 Markdown 化しない**。Structured Outputs で構造化 JSON を経由し、検証してから Markdown にする
- **MVP のダミーフローを壊さない**。`OPENAI_API_KEY` 未設定時はダミー OCR / ダミー構造化へフォールバックでき、ダミーと実プロバイダーを切り替え可能にする

## 対象 Issue 一覧

| Issue | 生成元 | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- | --- |
| #33 | 06-01 | OpenAI API 連携設計とサーバー側境界を整理する | High | 基盤(設計 / 契約) |
| #34 | 06-02 | OCR / Vision API 接続を実装する | High | OCR 境界(実装) |
| #35 | 06-03 | Structured Outputs / JSON Schema を定義する | High | 構造化データ契約・生成 |
| #36 | 06-04 | OpenAI API のエラーハンドリング・コスト・ログ方針を実装する | Medium | 横断(品質・安全) |

## 実装順序と依存関係

```text
#33 (設計・サーバー境界契約: 基盤)
  ├─> #34 (OCR Vision ルート / プロバイダー切替 / UI 接続)
  │      └─> #36 (エラー・コスト・ログを OCR / 構造化ルート横断で整備)
  └─> #35 (CompanyMemo JSON Schema / 検証 / 構造化→Markdown)
         └─> #36
```

推奨実装順: **#33 → #34 → #35 → #36**

理由:

- **#33** は他の 3 Issue の土台。API ルート境界、リクエスト/レスポンス契約、環境変数、プロバイダー切替方針、ログ・コスト方針を docs と共有型として固定する。GitHub Issue #33 の Out of Scope は「OpenAI API 実装」なので、**ネットワーク呼び出しは行わず**、設計ドキュメントと純粋な共有型(契約・エラーコード・プロバイダー判定)のみを成果物とする。
- **#34** は実 OpenAI 呼び出しと `app/api/ocr` ルートを通し、ダミー/実プロバイダーの切替境界という Phase の中核パターンを確立する。後続の構造化ルートはこのパターンを再利用する。
- **#35** は #33 と #04-01(`BriefingNote` 型)に依存する。ネットワークを伴わない純粋ロジック(zod スキーマ・検証・構造化→Markdown 変換)を先に単体テストで固められるため、サンプル OCR テキスト(`DEMO_OCR_TEXT`)を使えば **#34 と並行**して進めてもよい。本計画では順序として #34 の後に置くが、依存上は #33 完了後に着手可能。
- **#36** は #34・#35 のルートが存在してから、エラー分類・コスト方針・ログ秘匿を横断的に整える仕上げ。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。

## 共有設計判断(Phase 全体で固定)

Codex が実装中に大きな設計判断をしなくて済むよう、以下を Phase 6 の共通決定として固定する。

### 1. LLM プロバイダーは OpenAI(プロジェクト既定)

- `docs/roadmap.md` Phase 6・`.env.example`・`AGENTS.md` に従い、Phase 6 のプロバイダーは **OpenAI** とする。他社 LLM へは切り替えない。
- OCR(画像理解)と構造化(JSON 生成)の両方を OpenAI で行う。
- 使用モデルは**実装時に最新の OpenAI 公式 docs で確認**する。設計では既定候補のみ示し、固定しない。
  - 既定候補: OCR / 画像理解・構造化ともに Vision + Structured Outputs 対応モデル(例: `gpt-4o-mini` をコスト既定、`gpt-4o` を高精度オプション)。
  - モデル名は `OPENAI_OCR_MODEL` / `OPENAI_STRUCTURE_MODEL` 環境変数で上書き可能にし、コードへハードコードしない(既定値はコード内に持つ)。

### 2. レイヤー分離(純粋ロジック / サーバー専用 / クライアント)

| レイヤー | 配置 | 責務 | ネットワーク |
| --- | --- | --- | --- |
| 純粋ロジック | `src/lib/` 直下・`src/lib/structure/` | 契約型・エラーコード・JSON スキーマ・検証・構造化→Markdown 変換・プロバイダー判定 | 不可(単体テスト対象) |
| サーバー専用 | `src/lib/server/`・`app/api/*/route.ts` | OpenAI 呼び出し、画像検証、エラー写像、env 読み取り | OpenAI のみ |
| クライアント | `src/components/`・`src/lib/*Client.ts` | API ルートへの fetch、状態管理、UI 表示 | 自アプリの API ルートのみ |

- OpenAI SDK・`process.env.OPENAI_API_KEY` を import / 参照してよいのは**サーバー専用レイヤーだけ**。クライアントからは自アプリの `app/api/...` を呼ぶ。
- 既存 Phase 4 資産(`src/lib/types.ts` の `BriefingNote` / `OcrResult`、`src/lib/markdown.ts`、`src/lib/dummyOcr.ts`、`src/lib/sampleData.ts`)を再利用し、ロジックの二重定義を作らない。

### 3. API ルート境界(App Router、既存 `app/api/health/route.ts` と同形)

```text
POST /api/ocr
  input:  画像(multipart/form-data の file フィールド)
  output: { text: string, provider: "dummy" | "openai" }

POST /api/structure
  input:  { ocrText: string, companyEventInfo: { companyName, eventName, eventDate } }
  output: { memo: CompanyMemoStructured, provider: "dummy" | "openai" }
          ※ Markdown はクライアント側 / 純粋関数で構造化 JSON から組み立てる
```

- ルートハンドラは Node.js ランタイム(`export const runtime = "nodejs"`)で動かす(OpenAI SDK / `Buffer` 利用のため)。Edge は使わない。
- リクエストボディ上限は既存アップロード制限(`MAX_IMAGE_SIZE_BYTES` = 10MB)と整合させ、超過時は安全なエラーを返す。

### 4. プロバイダー切替(ダミー / 実)— MVP を壊さない

- `getOcrProvider()` / `getStructureProvider()` を `src/lib/` の純粋関数として定義し、次の規則で判定する。
  - `OPENAI_API_KEY` が未設定 → `"dummy"`(MVP と同じ挙動)
  - 明示フラグ `OCR_PROVIDER` / `STRUCTURE_PROVIDER`(`dummy` | `openai`)があればそれを優先
- `"dummy"` の場合、`/api/ocr` は `src/lib/dummyOcr.ts` のサンプルを、`/api/structure` はサンプル OCR からの決定的構造化結果を返す。
- これにより API キーなしでも Phase 4 と同じ動作が保証され、Acceptance Criteria「MVP のダミー OCR と切り替え可能」を満たす。

### 5. 構造化を優先(Structured Outputs)

- OCR テキストを直接 Markdown 化せず、`docs/output-format.md` のセクションに対応する **CompanyMemo 構造化 JSON** を生成する。
- 事実 / HR 強調点 / 印象 / 気になった点 / 質問 / ES 材料 などをフィールドで分離する(混ぜない)。
- LLM 出力は zod スキーマで**検証してから**利用する。検証失敗は安全にエラー化し、Markdown を組み立てない。
- 構造化 JSON → Markdown は**決定的な純粋関数**で行い、同じ JSON から同じ Markdown を得る。

### 6. 出力規約・不確実情報(`docs/output-format.md` 準拠)

- 読み取れない情報は断定せず `要確認` / `不明` を使い分ける。OCR にない事実を捏造しない(`AGENTS.md` LLM Output Rules)。
- 構造化スキーマは「該当なし / 未読取」を表現できるようにし、空配列や `要確認` プレースホルダへフォールバックする。
- Web 補足情報は Phase 6 では**未使用**のまま(Phase 8)。

### 7. セキュリティ / プライバシー / ログ方針

- API キーをクライアントへ露出させない。`.env` をコミットしない(`.env.example` のみ)。
- 画像内容・OCR 全文・生成 Markdown・個人情報・秘密情報を**不要にログ出力しない**。ログはエラーコードと最小限のメタデータ(処理段階・所要時間など)に限る。
- 外部(OpenAI)へ送るデータは目的に必要な最小限に留める。実画像を OpenAI に送る点は docs にプライバシー注意として明記する。

### 8. エラーモデル(安定コード)

- API ルートは安定したエラーコードで応答する。
  - `invalid_input` / `payload_too_large` / `not_configured` / `rate_limited` / `timeout` / `provider_error` / `validation_failed`
- レスポンス本文は `{ error: { code, message } }` 形式。`message` はユーザーに見せても安全な日本語に限定し、プロバイダー内部情報やスタックを含めない。
- クライアントはコードを日本語メッセージに写像して `ErrorNotice` 等で表示する。

### 9. 依存追加(最小)

- `openai`(公式 SDK)を `dependencies` に追加(#34)。
- `zod`(LLM 出力検証 / Structured Outputs スキーマ)を `dependencies` に追加(#35)。
- いずれも導入はそれぞれの Issue 内で行い、バージョンは導入時の安定版を使う。テストは実 API キーなしで通るようにする(プロバイダーをダミーに固定 / OpenAI 呼び出しはモック)。

## 既存実装との関係(Phase 4 からの引き継ぎ)

- [BriefingNoteFlow.tsx](../../../src/components/BriefingNoteFlow.tsx) の `startDummyOcr`(`setTimeout` + `runDummyOcr`)を、`/api/ocr` への fetch に置き換える(#34)。失敗シミュレーションはダミープロバイダー側の挙動として維持する。
- `handleGenerateMarkdown`(`buildMarkdownTemplateFromBriefingNote`)を、`/api/structure` 呼び出し → 構造化 JSON 検証 → 構造化→Markdown 変換に置き換える(#35)。編集済み(`isMarkdownDirty`)なら再生成で上書きしない既存挙動は保つ。
- `src/lib/upload.ts` のフォーマット/サイズ検証ロジックは、サーバー側の画像検証でも再利用する(#34)。
- `src/lib/markdown.ts` の `fenceFor` / `buildMarkdownTemplate` は、構造化→Markdown 変換(#35)から再利用または共通化する。テンプレート骨格と `output-format.md` の整合は維持する。

## Phase 全体の検証方針

各 Issue の PR で最低限以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

- **テストは実 OpenAI キーを必要としない**こと。プロバイダーをダミー固定にするか、OpenAI 呼び出しをモックして決定的に検証する。
- 純粋ロジック(JSON スキーマ・検証・構造化→Markdown・エラー写像・プロバイダー判定)は Vitest で単体テストを追加する。
- 実 API を使う end-to-end 確認(実画像 → 実 OCR → 構造化 → Markdown)は、ローカルで `OPENAI_API_KEY` を設定した上での**手動確認**とし、CI では行わない。

手動確認(実キー設定時):

1. 画像をアップロード → `/api/ocr` 経由で OCR テキストが表示される
2. Markdown 生成 → `/api/structure` 経由で構造化 → セクション分離された Markdown が表示される
3. 企業名なし / 読み取れない項目が `要確認` になる
4. `OPENAI_API_KEY` を外すとダミーフロー(Phase 4 相当)に戻る
5. レート制限・タイムアウト・不正入力時に安全なエラーが UI に表示される
6. ログに画像・OCR 全文・Markdown・キーが出ていない

## スコープ外(Phase 6 では実装しない)

- Google Drive 保存・サーバー側永続化・DB(Phase 7 / Post-MVP)
- Web 由来の補足情報の取得・統合(Phase 8)
- 企業比較データ構造・面接前復習モード・ES 接続ポイント生成(Phase 9)
- ユーザーアカウント、複数端末同期、利用量管理・課金ダッシュボード連携
- API キーのクライアント露出、画像/OCR 全文/生成 Markdown/秘密情報の不要なログ出力

## リスク / 留意点

- **モデル / API 仕様のドリフト**: モデル名・Structured Outputs の指定方法は実装時に最新 docs で確認する。設計はモデル名をハードコードせず env で上書き可能にする。
- **コスト**: 画像入力 + 構造化で 1 メモあたり 2 回の課金呼び出しが発生する。画像サイズ上限・出力トークン上限・モデル選択でコストを抑える方針を docs に残す(#36)。
- **プライバシー**: 実画像・選考情報を OpenAI に送る。最小送信・非保存・ログ秘匿を徹底し、docs にプライバシー注意を明記する。
- **構造化出力の不整合**: LLM が想定外の JSON を返す可能性 → zod 検証で `validation_failed` に倒し、Markdown を組み立てない(#35)。
- **テストの決定性**: 実ネットワークに依存させない。ダミー固定 / モックで決定的に検証する。
- **ペイロード上限**: 大きい画像で Next.js のボディ上限に当たる可能性 → アップロード制限と整合させ、超過は `payload_too_large` で安全に返す。
