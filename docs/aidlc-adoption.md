# AI-DLC 導入検証記録

## 今回の成果

ユーザー承認済みの運用導入を実施。アプリ機能は変更していない。[承認済み導入計画](../aidlc/spaces/default/knowledge/aidlc-shared/bolt-001-adoption.md) と [開発パイプライン](ai-dev-pipeline.md) を参照。

- Windows 公式ネイティブ AI-DLC **2.11.0**（公式インストーラーの checksum 検証済み）。`.aidlc-version` で固定。
- Codex CLI **0.162.1** に公式 updater で更新（要件 0.145.0 以上）。既存モデル / 認証を継承。
- Codex harness と公式 workspace / skills / hooks を生成。Classic / swarm off、project memory の `Mode: strict` を設定。
- ユーザーの追加指示により TDD を標準化。project memory に `Methodology: tdd` と `Ordering` を明記し、公式 resolver が `methodology: tdd` / `source: project` / Red → Green → Refactor の計画を返すことを確認。
- リリース branch は `release/bolt-001-aidlc-adoption`。ルート `bolt-*` は公式内部 worktree 名前空間のため分離。
- Issue / Claude 必須制を廃止。明示的な Claude 呼び出し用 workflow は保持し、自動 PR review workflow は削除。
- 既存 Vercel 連携を維持。main へのマージ・本番デプロイはまだ行っていない。

## 実施済み検証（2026-10-10）

| 検証 | 結果 |
| --- | --- |
| `aidlc version` / `codex --version` | 2.11.0 / 0.162.1 |
| `aidlc doctor` | 問題 0。framework integrity 12 checks passed。hook 未実行等の警告は残る |
| config dry-run | conflict 0。生成済み runtime を維持 |
| project flags | defaultScope classic / swarm false。bypass なし |
| `aidlc engine testing-posture resolve` | 変更前は org の test-after。変更後は project の tdd を選択し、各対象レイヤーに Red / Green / Refactor steps を生成 |
| strict の負例 | `intent create --guard-policy off` を memory strict により拒否。Intent / approval / audit は作成されない |
| `npm run lint` | 成功 |
| `npm run typecheck` | 成功 |
| `npm test` | 21 files / 103 tests 成功 |
| `npm run build` | 成功 |

今回の手編集差分は `git diff --cached --check` を通過。全 staged files の検査は、公式配布の `.codex/aidlc-common/protocols/stage-protocol-{ensemble,reviewer,swarm}.md` に含まれる EOF 空行 3 件を指摘する。checksum / framework integrity を維持するため、公式ファイルを整形していない。

`npm run format:check` は既存の未整形ファイルと今回の変更外の未追跡 `index.html` の構文エラーで失敗。無関係なファイルは変更していない。今回変更した整形対象ファイルは個別に確認する。公式 runtime は整形対象外。

`aidlc doctor` の hook 未実行警告は、生成済みと trusted session の実動確認を区別するため残している。現在のプロセスは更新前の PATH を保持し得るため、新しい PowerShell / Codex セッションで確認する。自動 update cache の未取得は固定版の実行失敗を意味しない。

GitHub CI の結果は導入 PR に記録する。ローカル成功だけで CI 成功とみなさない。

TDD の実装サイクルそのものは、今後の最初の承認済みアプリ Bolt で実施する。今回の変更は方針・記録・設定のみで、既存アプリや過去のテストを TDD で作り直したとは主張しない。native Intent が未作成の resolver は scope / project type を仮の feature / greenfield として返すため、この出力を現在の Classic／既存アプリ設定の証拠には使わない。

## 未実施: 人間による hook 信頼とセッション検証

1. リポジトリで更新後の新しい Codex CLI セッションを開く。
2. `/hooks` で追加 hooks を確認し、人間が信頼する（`t`、`Esc`）。trust receipt をエージェントが作成・編集しない。
3. `$aidlc --doctor` で session hooks と workspace を確認する。
4. 最初のアプリ改善を `$aidlc classic <改善内容>` で Inception に進める。計画を承認する前はアプリを編集せず停止することを確認する。
5. 実際に人間が計画を承認する。承認済み要件・設計を変更した場合に再承認を要求することを確認する。公式 code plan / stage 承認も行う。
6. セッションを終了・再開し、`$aidlc --status` / `$aidlc --resume` で計画・承認・進捗が引き継がれることを確認する。

strict の負例は実施済みだが、実際の人間入力・hook を伴う未承認停止 / 再承認 / セッション再開の検証とは別。これらが完了するまで、導入完了条件の全達成は主張しない。

## 未実施: 人間のマージ後の公開確認

1. GitHub CI 成功後、人間が導入 PR を main にマージする。
2. 実際のマージ SHA を記録し、その SHA の既存 Vercel deployment 成功を確認する。
3. [公開サイト](https://briefing-note-ai.vercel.app) が開き、[health](https://briefing-note-ai.vercel.app/api/health) が HTTP 200 / `status: ok` / `service: briefing-note-ai` を返すことを確認する。
4. 既存アプリの基本操作に退行がないか確認し、SHA・deployment URL・確認結果・フィードバックを公式 workspace に記録する。
5. 次のアプリ改善は、この結果を入力にした Inception で決めて承認する。

古い成功 deployment や PR の preview を、導入 PR マージ後の本番確認として代用しない。
