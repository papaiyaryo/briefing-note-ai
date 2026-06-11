# Figma MCP セットアップ手順

## 目的

Phase 2 では、MVP UI デザインを Figma で作成し、後続 Issue で Figma MCP から UI 仕様を取得できる状態にする。
このドキュメントは、Figma MCP を使うための前提、接続情報の管理方針、取得対象の記録方法を整理する。

## 前提

- Figma アカウントに対象ファイルを閲覧できる権限がある
- Codex 実行環境で Figma MCP ツールが利用できる、または利用できるよう準備を進めている(現時点で利用できない場合の扱いは「接続確認」の節を参照)
- Figma file key と node id が共有されている
- 認証情報はローカル環境または MCP クライアント設定で管理し、リポジトリにはコミットしない

## 秘密情報の扱い

Figma の personal access token、API key、OAuth token などの認証情報は、絶対に Git 管理対象に含めない。

- `.env` やローカルの MCP 設定ファイルにのみ保存する
- `.env.example` には実値ではなくプレースホルダーだけを書く
- PR、Issue、docs、スクリーンショットに token を貼らない
- token が漏えいした可能性がある場合は、Figma 側で直ちに revoke / rotate する

## 取得対象の管理方針

Figma から UI 仕様を取得するときは、対象を曖昧にしないために file key と node id を Issue または作業メモに記録する。
ただし、認証情報は記録しない。

記録例:

```text
Figma file:
- Name: briefing-note-ai MVP UI
- URL: https://www.figma.com/design/<file-key>/<file-name>?node-id=<node-id>
- File key: <file-key>

Target nodes:
- MVP app frame: <node-id>
- Upload step: <node-id>
- OCR result step: <node-id>
- Markdown editor step: <node-id>
```

Figma URL から取得できる `file key` と `node-id` は、認証情報ではない。
ただし、非公開プロジェクトの構成情報を含む可能性があるため、公開範囲には注意する。

## セットアップ手順

1. Figma で MVP UI 用ファイルを作成する
2. 対象ファイルへの閲覧権限を確認する
3. 必要に応じて Figma personal access token を発行する
4. token をローカルの MCP クライアント設定または `.env` に保存する
5. Codex 実行環境で Figma MCP ツールが利用可能か確認する
6. 対象 Figma file key と node id を Issue に記録する
7. 後続 Issue で Figma MCP から UI 仕様を取得する

## 接続確認

Codex で Figma MCP ツールが利用可能な場合は、次を確認する。

- Figma file のメタデータを取得できる
- 指定した node id の情報を取得できる
- 取得結果に token や秘密情報が含まれていない
- 取得結果が MVP ユーザーフローと対応している

現時点の Codex 環境で Figma MCP ツールが見えていない場合は、このドキュメントの手順整理までを Issue #12 の完了範囲とし、実接続確認は Figma MCP 利用環境を準備した後に行う。

## 後続 Issue での参照

Issue #14「Figma MCP から MVP UI 仕様を取得する」では、このドキュメントを参照して次を実施する。

- 利用可能な Figma MCP ツールを確認する
- file key と node id を指定して UI 仕様を取得する
- 取得した UI 仕様を MVP ユーザーフローと照合する
- 実装に必要なレイアウト、余白、フォーム、状態表示の情報を docs に整理する

## スコープ外

このドキュメントでは、次の作業は扱わない。

- Figma での MVP UI デザイン作成
- Figma MCP からの実データ取得
- Next.js / React での UI 実装
- OCR、LLM、Google Drive 連携の実装
