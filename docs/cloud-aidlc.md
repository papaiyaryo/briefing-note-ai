# AI-DLC クラウド環境の準備（未完了）

2026-10-27。対象は環境整備のみ。既存Codex設定、Intent、承認、audit、@claude Actionsは変更しない。アプリ実装・mainマージ・デプロイは行わない。

## インストール

Node.js 22とnpmを用意し、repoルートで `bash scripts/cloud/setup.sh codex` を実行する。Claude用は末尾を `claude` にする。runtimeはnpmではなく、[公式release v2.11.0](https://github.com/awslabs/aidlc-workflows/releases/tag/v2.11.0)のinstall.shを取得し、`--version 2.11.0 --yes` で導入する。既存.aidlc-versionも2.11.0。setupはpinとruntime版を確認する。公式installerはmetadata・binary・runtime archiveのchecksumとサイズを検証し、対応ghがあればattestationも検証する。installer自身の事前attestation検証は[公式lifecycle](https://github.com/awslabs/aidlc-workflows/blob/v2.11.0/docs/guide/18-install-and-lifecycle.md)参照。未検証コマンドを成功扱いにしない。

Unix installerはrootを拒否する。agentと同じ非rootユーザーで準備する必要がある。rootのみの環境は未対応として停止する。HOME偽装や検証無効化で回避しない。agentの非対話shellでも実ユーザーの `$HOME/.local/bin` をPATHに含める。setup内exportだけでは別shellへ永続しない。

既存harnessは起動時に自動再生成しない。`bash scripts/cloud/verify.sh` でdoctorとnpm一式を検証する。

## Codex Cloudの画面と起動

[現行公式ガイド](https://learn.chatgpt.com/docs/environments/cloud-environments): Settings > Codex Cloud > Environments > Create environment。Repositoriesにpapaiyaryo/briefing-note-ai、環境名briefing-note-ai-aidlc。準備には本PRブランチを選ぶ。

- Node.js: 22。
- Scripts > Install script: repoルートで `bash scripts/cloud/setup.sh codex`。
- Start skill: 「PATH、aidlc version/doctor、git statusを確認。必要ならnpm ci。開発時はnpm run devとHTTP応答を確認。人間の承認なしにIntentを進めない」。
- Internet access: Allow Codex to access internetを有効、Allow domainsはPackage managers。必要時Additional allowed domainsへapi.github.com、raw.githubusercontent.com。release redirect先も実ログで確認。
- Privacy > Who can use: Only me。dummy検証用のAPI secretsは不要。

準備結果を確認してPublish、Work in > Cloudで新規タスクを作る。変更はEdit > Republish。既存タスクは別の保存状態を持つ。[旧環境画面](https://developers.openai.com/codex/cloud/environments)の場合はSetup scriptとMaintenance scriptにsetup.sh codexを指定しNode22を選ぶ。旧環境ではsetupとagentのshell・internet設定が別で、cache復帰にはmaintenanceがある。現行のInstall script/Start skillと区別する。

Codex CLI >=0.145.0、aidlc skillの検出、hooksを確認する。`/hooks` が提供される場合は人間が内容を確認して信頼し、`$aidlc --doctor`、`$aidlc --status`。クラウドでhooks/信頼操作が使えなければ完了扱いにしない。trust receiptや承認を偽造しない。

## Claude Code on the webの画面と起動

[公式ガイド](https://code.claude.com/docs/en/claude-code-on-the-web)のCloud environmentsリンクも参照。claude.ai/codeでGitHubを接続し、Claude GitHub Appに対象repoを許可。対応プラン・組織のcloud sessions権限が必要。

環境selectorの設定からbriefing-note-ai-aidlcを作成。Network accessはTrusted。release取得が拒否される場合はCustom、Also include default list of common package managersを有効にし、github.com、api.github.com、raw.githubusercontent.com、release-assets.githubusercontent.comを追加。Node22、Setup scriptはrepoルートで `bash scripts/cloud/setup.sh claude`。秘密値は不要。

**Claudeの公式生成は未完了**。mainには.claude/がない。ネットワークの使える非rootのclean専用checkoutでruntimeを導入後、`bash scripts/cloud/configure-claude.sh` を実行する。公式 `aidlc config --project-dir "$PWD" --harness claude --mcp none --dry-run --json` のplanTokenを同じオプションのapplyに渡す。生成diffを確認し.claude/と公式root統合を同じ専用ブランチへコミットする。Codex設定・pin・memory・Intent/auditを壊していないか確認し、local cursorやtrust receiptは含めない。Codex設定を手でClaude用に複製しない。

push後、対象ブランチで新しいwebセッションを開始。`claude --version`、`aidlc version`、`aidlc doctor`、`/aidlc --doctor`、`/aidlc --status`。Codexの$aidlcに相当するClaudeの入口は/aidlc。公式生成の.claude/CLAUDE.mdを読みhooks許可を確認する。PCのみの設定・runtimeは引き継がれない。

既存.github/workflows/claude.ymlの明示@claudeはGitHub Actions runnerでCLAUDE_CODE_OAUTH_TOKENを使う別経路。そのsecretの存在はwebの接続・環境設定済みを意味しない。workflowは変更しない。

## GitHubからの再開

main SHA 655aeb95002d845aeae46ccc2f5dc7fc516d99f7にはnative Intentがない。一方、release/bolt-002-company-data-management（確認SHA ed1a995ce1a4338aa837bdcd30096d3fee8c8f52）にはintents.jsonと261011-company-data-managementのstate・要件・設計・Bolt計画・auditがpush済み。台帳はin-flight、stateはConstruction / functional-design、2026-10-14T14:35:57Zにpersonがpark、最後の完了はdelivery-planning。

再開はそのブランチを指定する。必要なtooling変更はレビュー後に取り込む（今回既存branchを更新しない）。dirty checkoutは退避または専用worktreeを使い、resetで消さない。Codexで `$aidlc intent` を実行し、公式が示す正確なselectorで対象を選び、`$aidlc --status`、`$aidlc --resume`。Claudeは入口を/aidlcに置換する。active-space/active-intentはclone-localのgitignore対象なので公式操作で選び直す。--resumeはpark解除と次工程の実行を伴い得るため、この環境整備では実行しない。

再開候補の存在は確認済み、実resumeは未検証。ローカルPCだけのカーソル・未push差分・現在ブランチは取得不能。stateを編集して承認・進行を再現しない。

## 検証・残作業

初期/workspaceはcheckoutなしでgit statusはnot a git repository。既存PC作業のクリーン状態は断定不能。AGENTS.md、.codex/onboarding.md、.agents/skills/aidlc/SKILL.md、.aidlc-version、workflows、README、ai-dev-pipeline、aidlc-adoption、space memoryと導入記録をGitHub経由で確認した。

実確認: Codex CLI 0.163.0のversion/help起動、追加シェル3本のbash -n。環境はNode24.19.0/npm11.9.0で目標22と異なる。AI-DLCとClaudeは未導入。cloneとnpm registryへのHTTPはproxy:8080接続失敗。npmは完全checkoutがないためlockfile/package.json欠如となり、リポジトリのテスト結果には数えない。npm ci・lint・typecheck・test・build、doctor、実harnessセッションの成功証拠はない。過去Windows検証を今回の証拠に流用しない。

残作業は接続復旧、Node22/非rootruntime導入、Claude公式生成とdiffコミット、サービスのGitHub接続・環境作成・PATH、Codexのhook信頼、両セッションとnpm一式・実resumeの確認。終わるまでdraftを維持する。アプリ挙動の変更がないため人工的なTDD Redは作らず、公式仕様・構文・差分・環境実行で確認する。
