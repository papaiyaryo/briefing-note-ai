# ロードマップ

## 目的

このドキュメントは、briefing-note-ai の開発フェーズとスコープ境界を整理する。
各作業は GitHub Issue 単位で進め、次の流れを守る。

```text
Issue -> Branch -> Implementation -> Self Review -> Pull Request -> Human Merge
```

## MVP の範囲

MVP に含めるもの:

- 画像アップロード
- OCR 結果表示
- Markdown 生成
- Markdown 編集
- Markdown プレビュー
- `.md` ダウンロード

MVP に含めないもの:

- Google Drive 保存
- Web 補足
- 企業比較
- 面接前復習モード
- ユーザーアカウント
- 複数端末同期
- カレンダー連携
- 本格的な応募管理

## Phase 00: 修正・手戻りフェーズ

目的:
実装済み内容の修正・手戻り・運用ルールの補正を行う特別フェーズ。

対象作業:

- 実装済み Issue / PR の不具合修正
- 運用ルール（AGENTS.md 等）の補正
- 設計と実装のずれの是正
- CI / lint / typecheck の修正
- ドキュメント不整合の修正

スコープ外:

- 新規機能追加（新規機能は Phase 1 以降で扱う）

Phase 00 の Issue も `1 Issue = 1 Branch = 1 PR` ルールを守る。

## Phase 0: 設計・開発準備

目的:
MVP 実装前に必要なドキュメントと開発ルールを整える。

主な作業:

- product、requirements、user-flow、architecture を維持する
- Markdown 出力形式を定義する
- ロードマップとフェーズ境界を定義する
- AGENTS.md を現在の開発フローに合わせる
- Issue 一覧、PR テンプレート、CI 方針を整える

主な成果物:

- `docs/product.md`
- `docs/requirements.md`
- `docs/user-flow.md`
- `docs/architecture.md`
- `docs/output-format.md`
- `docs/roadmap.md`
- `docs/generated-issues/`
- `.github/` 配下のテンプレートや CI 関連ファイル

## Phase 1: プロジェクト基盤

目的:
Web アプリの最小技術基盤を整える。

主な作業:

- Next.js、React、TypeScript の最小構成を整える
- Tailwind CSS を設定する
- ESLint、Prettier、Vitest を設定する
- Dockerfile と docker-compose.yml を整える
- ローカル起動手順と Docker 起動手順を README に書く

スコープ外:

- 本格的なプロダクト UI
- OCR や LLM の実連携

## Phase 2: MVP UI デザイン

目的:
MVP の画面構成と見た目の方針を決める。

主な作業:

- Figma MCP セットアップ手順を整理する
- MVP UI デザインを作る、または取り込む
- レイアウト、余白、フォーム、プレビュー領域などの方針を決める
- UI デザインを MVP のユーザーフローと揃える

スコープ外:

- 実 OCR 処理
- 実 LLM 処理
- Google Drive 保存などの Post-MVP 機能

## Phase 3: MVP フロントエンド UI

目的:
ユーザーが操作する MVP フローを画面として実装する。

主な作業:

- ステップ型の画面レイアウトを実装する
- 画像アップロード UI とプレビューを実装する
- 企業名・イベント情報入力 UI を実装する
- OCR 結果表示 UI を実装する
- Markdown 編集・プレビュー UI を実装する
- ローディング、空状態、エラー状態を実装する

スコープ外:

- 実 OCR プロバイダー連携
- 実 LLM プロバイダー連携

## Phase 4: MVP データフロー

目的:
MVP UI とローカルデータ境界、ブラウザ出力をつなぐ。

主な作業:

- `CompanyMemo` などの型を定義する
- Markdown 生成ロジックを UI から分離する
- ダミー OCR フローを実装する
- `.md` ダウンロードとファイル名生成を実装する
- サンプルデータとデモ入力を整える

スコープ外:

- サーバー保存
- Google Drive 保存
- Web 由来の補足情報

## Phase 5: MVP 品質確認

目的:
MVP の基本フローを確認し、デモやポートフォリオで見せられる状態に近づける。

主な作業:

- Markdown 生成ロジックのテストを追加する
- UI コンポーネントの基本テストを追加する
- E2E テスト方針を整理する
- セキュリティとプライバシーを確認する
- README を MVP 利用手順に合わせて更新する
- 必要に応じてデモスクリーンショットを追加する

想定チェック:

- install
- lint
- typecheck
- test
- build

## Phase 6: OpenAI API 連携

目的:
OCR、画像理解、構造化 Markdown 生成のためのサーバー側 OpenAI 境界を追加する。

主な作業:

- Next.js API Routes にサーバー側 API 境界を設計する
- API キーをサーバー側だけで扱う
- Structured Outputs または JSON Schema を定義する
- LLM 出力を検証してから Markdown に変換する
- エラー、コスト、ログ方針を整理する

スコープ外:

- API キーのクライアント露出
- 画像、OCR 全文、生成 Markdown、秘密情報の不要なログ出力

## Phase 7: Google Drive 連携

目的:
MVP 後に、生成した Markdown を Google Drive に保存できるようにする。

主な作業:

- Google Cloud Project と OAuth 設定手順を整理する
- Google ログインと Drive API 境界を実装する
- 企業名ごとのフォルダ保存を実装する
- 元画像保存と Drive 保存エラーの扱いを定義する

スコープ外:

- MVP には含めない

## Phase 8: Web 補足情報

目的:
Web 由来の企業情報を、出典付きで説明会メモと分離して扱えるようにする。

主な作業:

- Web 補足の取得方針と出典優先度を決める
- 公式サイトや採用ページを優先する
- 出典付きの補足情報を生成する
- Web 補足を確認してから Markdown に統合する UI を作る

ルール:

- Web 情報には出典 URL と取得日を残す
- Web 情報を説明会で得た事実と混ぜない

## Phase 9: 企業比較・面接準備

目的:
構造化された企業メモを、企業比較や面接準備に再利用できるようにする。

主な作業:

- 企業比較用のデータ構造を設計する
- 比較テーブルと志望度メモを実装する
- 面接前復習モードを追加する
- 既存メモから ES 接続ポイントを生成する

スコープ外:

- すべて Post-MVP として扱う

## Phase 10: ポートフォリオ・開発ログ

目的:
プロジェクトをポートフォリオとして説明しやすくし、AI 駆動開発の流れを記録する。

主な作業:

- README をポートフォリオ向けに整える
- 技術構成図を追加する
- AI 駆動開発フローを記録する
- Figma デザインリンク、デモ動画、GIF を追加する
- Copilot PR Review と Codex 開発ログ運用を整理する

## スコープ管理

各 Issue は、その Phase と Acceptance Criteria の範囲に収める。
便利そうな機能でも後続 Phase に属する場合は、先行実装せず Follow-up として記録する。

## MVP 完了の定義

MVP は、ユーザーが次の操作を完了できる状態を指す。

1. 企業説明会メモ画像を 1 枚アップロードする
2. 画像プレビューを見る
3. OCR テキストを見る
4. 構造化 Markdown を生成する
5. Markdown を編集する
6. Markdown をプレビューする
7. 編集後の内容を `.md` としてダウンロードする
