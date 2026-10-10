# AI-DLC 開発パイプライン

## 開発サイクル

公式 AI-DLC Codex harness を使い、**1 サイクル = 1 Intent = 1 リリース用 Bolt** でアプリを成長させる。

```text
Inception（現状確認・要件・設計・Bolt 計画）
→ 人間が計画を承認
→ 実装 → 検証・結果確認 → 修正
→ Bolt 単位の PR → 人間がマージ
→ Vercel 自動デプロイ → 公開環境確認
→ 次の Inception
```

Bolt は UI / API / データ処理 / テストを含む、利用者が試せる増分。内部の Unit は依存 DAG に従って直列に進める。Bolt 計画はリリースのまとまりで、公式エンジンの実行順序を置き換えない。

Issue は任意の要望・不具合記録。Claude 固定の設計・必須レビューと Issue / Branch / PR の一対一対応は廃止する。明示的な `@claude` 呼び出しは補助として利用できる。

## インストールと更新

AI-DLC **2.11.0** の公式 Windows ネイティブ版を利用する。Bun は不要。Codex CLI は **0.145.0 以上** が必要。

- [公式リリース](https://github.com/awslabs/aidlc-workflows/releases/tag/v2.11.0)
- [Codex harness](https://github.com/awslabs/aidlc-workflows/blob/v2.11.0/docs/guide/harnesses/codex-cli.md)
- [インストール・版管理](https://github.com/awslabs/aidlc-workflows/blob/v2.11.0/docs/guide/18-install-and-lifecycle.md)
- [Codex hook の信頼](https://learn.chatgpt.com/docs/hooks)

PowerShell で公式インストーラーをダウンロードして内容を確認後、ユーザー領域にインストールする。

```powershell
$aidlcInstaller = Join-Path $env:TEMP 'briefing-aidlc-2.11.0-install.ps1'
Invoke-WebRequest -Uri 'https://github.com/awslabs/aidlc-workflows/releases/download/v2.11.0/install.ps1' -OutFile $aidlcInstaller
& $aidlcInstaller -Version 2.11.0
```

新しい PowerShell を開き、リポジトリのルートで実行する。

```powershell
codex --version
aidlc version
aidlc config --pin 2.11.0
aidlc config --harness codex
aidlc doctor
```

`.aidlc-version` が版を固定する。マシン runtime とプロジェクト設定の更新は別操作。更新は版を明示し、`aidlc config --dry-run` で差分を確認してから設定と pin を揃える。

config は `.codex/`、`.agents/`、workspace を生成し、AGENTS.md / .gitignore に公式ブロックを追加する。生成 runtime は改造せず、プロジェクト方針は memory の `project.md` に置く。モデル・認証は既存のユーザー設定を引き継ぐ。

## 最初のセッション

1. 新しい Codex セッションをリポジトリで開く。
2. プロジェクトと hooks を確認し、`/hooks` で人間が信頼する。変更後は再確認する。
3. `$aidlc --doctor` で hook の動作と workspace を確認する。
4. `$aidlc classic <今回のアプリ改善>` を起動する。

信頼操作や人間の承認を代行したことにしない。現在のセッションで新規 skills / hooks のロードは保証できない。ファイル導入済みとセッション内の動作確認済みを区別する。

## Inception と承認

標準は Classic / strict Guard Policy。公式 stage 承認、検証コマンド承認、Code Generation Plan Approval を利用する。Inception の承認前にアプリ実装を始めない。

Inception で、現状と利用者に起きる変化、要件・受入基準・対象外、設計・データ境界、1 リリース用 Bolt と Units / 依存順序、検証・公開後の確認・完了条件を確定する。承認済み計画を変更する場合は再承認する。

公式の計画・状態・承認・監査は `aidlc/spaces/default/intents/` に保存する。machine-local state と trust receipts はコミットしない。過去の `docs/codex/` と `docs/generated-issues/` は履歴として残す。

## 実装・PR・デプロイ

ブランチは `release/bolt-{連番}-{説明}`。公式 doctor はルートの `bolt-*` を内部 worktree 用として検査するため、リリース用は名前空間を分ける。連番はプロジェクトのリリース番号で、公式 Unit / worktree の識別子とは別。次の未使用番号を Bolt 計画に記録する。

承認済み計画内で実装・検証・修正を繰り返す。全 Unit の検証、Bolt 全体の受入基準、CI を確認し、日本語の PR を作る。人間がマージする。

既存 Vercel GitHub 連携が `main` を自動公開する。Vercel プロジェクト、デプロイ workflow、Secrets は新設しない。

- 公開サイト: <https://briefing-note-ai.vercel.app>
- health: <https://briefing-note-ai.vercel.app/api/health>

マージ後は **その SHA** の Vercel 成功を確認し、ページ・health・受入フローを確認する。health は `status: ok` / `service: briefing-note-ai`。失敗した場合は現リリースの修正を優先する。

Classic の公式 workflow 完了と本番確認は別。SHA・デプロイ URL / 結果・手動確認・フィードバックは次の Intent の Inception に引き継ぐ。次の Bolt 実装は公開確認と新たな計画承認の後に開始する。

## 検証

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

runtime は `aidlc doctor` と信頼済み新規セッションの `$aidlc --doctor` を使う。最初の native Intent で、未承認時の停止、変更後の再承認、再開時の状態保持を確認する。未実行の人間操作を成功扱いにしない。

アプリ CI は既存 install / lint / typecheck / test / build。runtime と記録はアプリコード検査から除外し、独立した doctor と承認ゲートで検証する。外部 API の実リクエストは追加しない。
