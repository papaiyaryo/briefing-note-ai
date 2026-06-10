# AGENTS.md

## Project

このリポジトリは、紙の企業説明会メモを OCR/LLM で構造化 Markdown に変換し、就活の企業研究・ES・面接対策に再利用する Web アプリを開発するためのものです。

このアプリは単なる OCR アプリではありません。
説明会中に取った紙メモから、事実・所感・人事や社員が強調していた点・逆質問候補・ESや面接に使える要素を整理する、就活向けナレッジ整理アプリです。

---

## Current Phase

現在は **設計ドキュメント作成フェーズ** です。

このフェーズでは、React 実装、UI 実装、API 実装、Docker 実装、Figma MCP 連携、外部 API 連携はまだ開始しません。

まずは `docs/` 配下の設計ドキュメントを整備します。

---

## Development Rules

* 作業前に必ず `AGENTS.md` と `docs/` 配下の設計ドキュメントを確認する
* 現在のフェーズに必要な作業だけを行う
* MVP の範囲を優先し、将来機能を先に実装しない
* 要件が曖昧な場合は、勝手に実装せず設計ドキュメントに TODO として残す
* 個人情報や選考情報を含む可能性があるため、画像・OCR テキスト・生成 Markdown の扱いに注意する
* 外部 API キーをクライアントに埋め込まない
* `.env` や秘密情報をコミットしない
* 実装時は、ユーザーがアップロードから `.md` ダウンロードまで迷わず完了できることを優先する

---

## MVP Scope

MVP で実装する範囲は以下です。

* 画像アップロード
* OCR 結果表示
* Markdown 生成
* Markdown 編集
* `.md` ダウンロード

---

## Out of Scope for MVP

以下は MVP では実装しません。

* Google Drive 保存
* Web 補足
* 企業比較
* 面接前復習モード
* ユーザーアカウント
* 複数端末同期
* 本格的な企業データベース
* 自動応募管理
* カレンダー連携

---

## Documentation

設計ドキュメントは `docs/` 配下に配置します。

* `docs/product.md`: プロダクトの目的、ユーザー、価値
* `docs/requirements.md`: MVP と将来機能の要件
* `docs/user-flow.md`: 主要なユーザーフロー
* `docs/output-format.md`: 生成する Markdown の構造
* `docs/architecture.md`: 実装前のアーキテクチャ案
* `docs/roadmap.md`: 開発ステップと将来拡張
* `docs/ui-spec.md`: Figma MCP から整理した UI 仕様

---

## Future Development Flow

設計ドキュメント作成後は、以下の順で進めます。

1. Docker 開発環境を作成する
2. Figma で UI デザインを作成する
3. Figma MCP で UI 情報を取得する
4. `docs/ui-spec.md` に UI 仕様を整理する
5. Codex で MVP UI を実装する
6. Docker 上で動作確認する
7. PR を作成する
8. Copilot に PR Review をさせる
9. Codex でレビュー指摘を修正する
10. 人間が最終確認してマージする

---

## Implementation Rules

実装フェーズに入った場合は、以下を守ります。

* React / TypeScript を使用する
* UI コンポーネントは小さく分割する
* 型定義を明確にする
* Markdown 生成ロジックは UI から分離する
* OCR / LLM / Google Drive などの外部 API 連携はサーバー側で扱う
* API キーや認証情報をフロントエンドに露出しない
* まずはダミーデータで MVP UI を完成させる
* 外部 API 連携は MVP UI 完成後に追加する

---

## AI / LLM Output Rules

LLM を使う場合は、以下を守ります。

* OCR 結果を直接 Markdown に変換せず、まず構造化データに整理する
* 事実と所感を分離する
* 紙メモ由来の情報と Web 補足由来の情報を分離する
* 推測で企業情報を追加しない
* 不確実な内容は「未確認」または「要確認」として扱う
* Markdown はユーザーが後から編集しやすい構造にする

---

## Security / Privacy Rules

* アップロード画像には個人情報や選考情報が含まれる可能性がある
* OCR テキストや生成 Markdown を不要にログ出力しない
* 本番環境では画像・OCR 結果・Markdown の保存方針を明確にする
* `.env` をコミットしない
* `.env.example` のみコミットする
* API キーは必ずサーバー側で使用する

---

## PR Rules

PR を作成する場合は、本文に以下を含めます。

* Summary
* Changes
* Test Plan
* Out of Scope
* Follow-up Tasks

PR 作成前に以下を確認します。

* 仕様と実装がズレていないか
* 不要なファイルを変更していないか
* MVP 外の機能を実装していないか
* README や docs の更新が必要か
* API キーや秘密情報が含まれていないか

---

## Current Task Rule

現在のタスクでは、実装は行いません。

まず以下の設計ドキュメントを作成・更新してください。

* `docs/product.md`
* `docs/requirements.md`
* `docs/user-flow.md`
* `docs/output-format.md`
* `docs/architecture.md`
* `docs/roadmap.md`

作業後は、作成・更新したファイルと内容の要約を報告してください。
