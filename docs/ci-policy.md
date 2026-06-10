# CI Policy

## 目的

このドキュメントは、MVP 開発で最低限必要な GitHub Actions / CI の方針を定義します。
実際の workflow 実装は `.github/workflows/ci.yml` に置き、この文書では何を確認し、何を CI に含めないかを明確にします。

## 実行タイミング

CI は次のタイミングで実行します。

- Pull Request 作成・更新時
- `main` ブランチへの push 時

PR の段階で問題を検出し、Human Merge 前に確認できる状態にします。

## パッケージインストール

lockfile に合わせてパッケージマネージャーを選びます。
このリポジトリでは `package-lock.json` があるため、標準では `npm ci` を使います。

将来 `pnpm-lock.yaml` または `yarn.lock` に移行する場合は、CI 側の install command と cache 設定も合わせて更新します。

## 実行するチェック

CI では次の順序でチェックします。

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`

### lint

目的:

- ESLint による静的チェックを行う
- 明らかな構文ミス、未使用変数、Next.js / React の基本的なルール違反を検出する

### typecheck

目的:

- TypeScript の型エラーを検出する
- API 境界、コンポーネント props、データ型の不整合を早めに見つける

### test

目的:

- Vitest の単体テストを実行する
- 現時点では `--passWithNoTests` を許可し、テスト基盤整備前の Phase でも CI を通せるようにする
- テスト追加後は、Markdown 生成ロジックや UI コンポーネントの回帰を検出する

### build

目的:

- Next.js の production build が成功することを確認する
- route、server component、API route、型検証を含む統合的な破綻を検出する

## CI で扱わないこと

MVP 開発中の CI では、次の処理を行いません。

- デプロイ
- OpenAI API への実リクエスト
- Google Drive API への実リクエスト
- 外部サービスに依存する E2E テスト
- 本物の画像、OCR テキスト、生成 Markdown の保存やアップロード
- GitHub Secrets を必要とする処理

これらは、対応する Issue で設計と安全性を確認してから追加します。

## 秘密情報とログ

CI では秘密情報を使わない方針を基本にします。

- `.env` はコミットしない
- `.env.example` にはダミー値または空値のみを書く
- API キー、OAuth クライアントシークレット、アクセストークンをログに出さない
- アップロード画像、OCR 全文、生成 Markdown、個人情報を CI artifact やログに保存しない

将来 GitHub Secrets が必要になる場合は、用途、保存する値、ログに出ないことを Issue 内で確認してから追加します。

## 失敗時の扱い

CI が失敗した PR は merge しません。
失敗したチェックを確認し、対象 Issue の Scope に収まる修正だけを行います。
Scope 外の問題を見つけた場合は、別 Issue として記録します。

## 現在の前提

- Node.js は workflow 側で固定する
- MVP では Next.js API Routes を使い、別 Express backend は作らない
- OpenAI / Google Drive 連携は Post-MVP または専用 Issue で扱う
- CI は品質確認のみを目的とし、デプロイや外部API連携は含めない
