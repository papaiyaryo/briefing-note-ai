# briefing-note-ai

紙の企業説明会メモを OCR/LLM で構造化 Markdown に変換し、就活の企業研究・ES・面接対策に再利用できるようにする Web アプリです。

このアプリは単なる OCR ツールではなく、説明会メモから得た情報を「事実」「HR・社員が強調した点」「自分の印象」「次に聞きたい質問」「ES・面接で使えそうな材料」に分けて整理するための MVP です。

## Status

現在は MVP 品質確認フェーズです。Phase 4 までに、ブラウザ内で動く以下の一連の流れを実装済みです。

1. 企業説明会メモ画像を 1 枚アップロードする
2. ダミー OCR 結果を表示し、必要に応じて編集する
3. OCR 結果と任意入力した企業・説明会情報から Markdown 雛形を生成する
4. Markdown を編集し、プレビューで確認する
5. `.md` ファイルとしてローカルにダウンロードする

実 OCR、実 LLM 連携、Google Drive 保存、Web 補足取得はまだ接続していません。MVP ではアップロード画像、OCR テキスト、生成 Markdown を外部サービスへ送信せず、サーバーにも保存しません。

## MVP Features

- 画像アップロード
  - 対応形式は JPEG / PNG / WebP / GIF です。
  - 1 枚の画像を選択し、画面上でプレビューできます。
  - ファイル形式とサイズの基本バリデーションを行います。
- 企業・説明会情報の任意入力
  - 企業名、イベント名、説明会日を入力できます。
  - 未入力項目は生成 Markdown 内で `要確認` として扱います。
- ダミー OCR 結果表示
  - 実 OCR の代わりにサンプルテキストを返します。
  - OCR 結果はユーザーが手で修正できます。
  - 失敗状態の確認ボタンで、OCR エラー時の UI も確認できます。
- Markdown 生成
  - OCR 結果と企業・説明会情報から、就活メモ向けの Markdown 雛形を生成します。
  - 生成 Markdown は、説明会で得た事実、HR・社員が強調した点、自分の印象、次に聞きたい質問、ES・面接で使えそうな材料、Web 補足情報を混在させない構成です。
- Markdown 編集・プレビュー
  - 生成後の Markdown を直接編集できます。
  - PC 幅では編集欄とプレビューを同時表示し、狭い画面ではタブで切り替えます。
- `.md` ダウンロード
  - 編集済み Markdown をローカルファイルとして保存できます。
  - 企業名が入力されている場合は、企業名をもとに安全なファイル名を生成します。

## MVP Usage

### 1. アプリを起動する

Docker を使う場合は、依存関係と Next.js 開発サーバーをまとめて起動できます。

```bash
docker compose up --build
```

ローカルの Node.js 環境で起動する場合は、依存関係をインストールしてから開発サーバーを起動します。

```bash
npm ci
npm run dev
```

アプリは以下で確認できます。

```text
http://localhost:3000
```

サーバー側 API Route のヘルスチェックは以下で確認できます。

```text
http://localhost:3000/api/health
```

期待するレスポンス例:

```json
{
  "status": "ok",
  "service": "briefing-note-ai",
  "timestamp": "2026-06-10T00:00:00.000Z"
}
```

### 2. メモ画像をアップロードする

1. 「ファイルを選択」またはドラッグ&ドロップで、企業説明会メモ画像を 1 枚選びます。
2. 必要に応じて、企業名、イベント名、説明会日を入力します。
3. 「OCR を実行する」を押します。

MVP の OCR はダミー実装です。選択した画像の文字を実際に読み取るのではなく、リポジトリ内のサンプル OCR テキストを返します。

### 3. OCR 結果を確認する

1. 画像プレビューと OCR 結果を確認します。
2. 必要に応じて OCR テキストを手で修正します。
3. 「Markdown を生成する」を押します。

OCR 結果が空の場合は Markdown 生成に進めません。テキストを直接入力するか、アップロード画面に戻って画像を選び直してください。

### 4. Markdown を編集・プレビューする

1. 生成された Markdown の各セクションを確認します。
2. 事実、印象、HR・社員が強調した点、次に聞きたい質問、ES・面接で使えそうな材料を混在させないように追記・修正します。
3. プレビューで表示を確認します。

### 5. `.md` をダウンロードする

編集が終わったら「.md をダウンロード」を押します。内容が空の場合はダウンロードできません。

## MVP Output Structure

生成される Markdown は、以下のように情報の出どころと用途を分ける前提です。

- 説明会概要
- 説明会で得た事実
- HR・社員が強調していた点
- 事業内容
- 強み・特徴
- 求める人物像
- 自分の印象・感じたこと
- 気になった点
- 次に聞きたい質問
- ES・面接で使えそうな材料
- 次に調べること
- Web 補足情報
- 元メモからの抜粋

`Web 補足情報` は MVP では未使用です。Post-MVP で Web 補足を追加する場合は、紙メモ由来の情報と混ぜず、出典 URL と取得日を残す方針です。

## Out of Scope for MVP

MVP では次の機能を実装・接続しません。

- 実 OCR / OpenAI Vision API 連携
- 実 LLM による本文生成
- Google Drive 保存
- Web 補足情報の取得・統合
- 企業比較
- 面接前復習モード
- ユーザーアカウント、ログイン、認証
- マルチデバイス同期
- カレンダー連携
- フル機能の応募管理
- デプロイや本番運用設定

これらは Future Ideas または Post-MVP の対象として扱い、MVP の README・セルフレビューとは分けて管理します。

## Security and Privacy for MVP

MVP では、画像アップロード、ダミー OCR、Markdown 生成、編集、プレビュー、`.md` ダウンロードの流れをブラウザ内で扱います。アップロード画像、OCR テキスト、生成 Markdown は OpenAI、Google Drive、その他の外部サービスへ送信せず、サーバー保存もしません。

就活メモには個人情報や企業研究の内容が含まれるため、アプリケーションコードでは画像内容、OCR 全文、生成 Markdown、秘密情報を不要にログ出力しない方針です。実際の API キーや OAuth シークレットは `.env` に置き、リポジトリには `.env.example` の空プレースホルダーのみをコミットします。

詳細な確認結果と再確認タイミングは [Security and Privacy Notes for MVP](docs/security-privacy.md) を参照してください。

## Screenshots

MVP の主な流れを、架空企業「青葉フューチャーリンク株式会社」のサンプルデータで示します。画像には個人情報や実在の選考情報は含めていません。

### アップロード画面

![Briefing Note AI のアップロード画面](docs/images/upload-step.svg)

### Markdown 編集画面

![Briefing Note AI の Markdown 編集画面](docs/images/markdown-edit-step.svg)

## Documentation

- [Product](docs/product.md)
- [Requirements](docs/requirements.md)
- [User Flow](docs/user-flow.md)
- [Architecture](docs/architecture.md)
- [Output Format](docs/output-format.md)
- [Sample Data](docs/sample-data.md)
- [E2E Test Policy](docs/e2e-policy.md)
- [Security and Privacy Notes for MVP](docs/security-privacy.md)
- [Phase 5 MVP Self Review](docs/self-review-phase5.md)
- [Figma MCP Setup](docs/figma-mcp-setup.md)

## Development

### Prerequisites

- Node.js 22 系を推奨
- npm
- Docker
- Docker Compose

### Environment Variables

開発用の環境変数は `.env.example` を参考にします。実際の API キーや認証情報は `.env` に置き、コミットしないでください。

```bash
cp .env.example .env
```

現時点では OpenAI API と Google Drive API には接続しないため、秘密情報の実値は不要です。

### Start with Docker

```bash
docker compose up --build
```

### Start without Docker

```bash
npm ci
npm run dev
```

## Testing and Quality Checks

CI と同等の主要チェックは以下です。

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

整形チェックは以下で実行します。

```bash
npm run format:check
```

整形を適用する場合は以下を使います。

```bash
npm run format
```

単体テストは Vitest を使います。共通ロジックと基本 UI コンポーネントのテストは `tests/**/*.test.ts` に置きます。

E2E テストはまだ実装していません。導入方針は [E2E Test Policy](docs/e2e-policy.md) に記録しています。

## CI

GitHub Actions の最小 CI は、Pull Request 作成時と `main` ブランチへの push 時に実行されます。

CI では lockfile から npm / pnpm / yarn を判定し、このリポジトリでは `package-lock.json` に合わせて `npm ci` を使います。その後、以下を順に確認します。

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

デプロイ、OpenAI API、Google Drive API、GitHub Secrets はまだ CI では扱いません。

## Future Ideas

MVP 完了後の候補です。MVP の品質確認・README 更新とは分けて、別 Issue で設計・実装します。

- OpenAI Vision API / OCR API 連携
- サーバー側 API Routes 経由の LLM 連携
- Google Drive 保存
- 出典付き Web 補足
- 企業比較
- 面接前復習モード
- ポートフォリオ向け README / デモ動画 / GIF の詳細化
