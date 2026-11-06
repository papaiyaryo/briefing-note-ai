# U3 — 既存修正の再検証計画（revision 03）

## Summary

- Builds: 既存のR-01誤成功表示・R-02削除参照保存停止の修正が現HEADで有効かを再検証する。新しい不具合が再現した場合だけTDDで修復する。
- Touches: 原則としてU3記録のみ。修復が必要な場合だけ既定8ファイル（比較状態・保存制御2、比較UI2、U3試験4）に限定する。
- Tests: 既存U3全9ファイル141件（回帰20件を含む）、session/edits・実PG結合・UIの各exact command、全体645件・coverage lines80%以上、実画面確認の範囲内記録。

## Scope and Approval Boundary

2026-10-29の再開では、U3のCode Generationを開き直した今回の実行に対して本計画を再提示する。実装・追加検証の開始前に、この実行の正式なPlan Approvalを受ける。再検証と必要時だけの修復という既存の範囲は維持する。

2026-10-27の本人判断「再検証用に直して承認」に基づき、revision 02（2件の不具合をこれから修復するRed→Green→Refactor計画）をこの再検証計画へ置き換える。revision 02の本文は[旧計画](code-generation-plan.before-reverify-20261027.md)と[旧試験手順](unit-test-instructions.before-reverify-20261027.md)へ保管した。

置き換えの理由：今回のrevision 02実行（2026-10-26）のStep 3で、R-01/R-02の修正（session.tsの利用不可状態、edits.tsのsave/rebaseガードと404/通信失敗の区別、UI 2部品の確定outcome表示）と予定回帰20件（S-R1〜5、C-R1〜7、U-R1〜6、I-R1〜2）がすでに作業ツリーに存在し、全件成功していた。これらは2026-10-22の旧revision 02実行で実装・検証済みであり（[旧Red/Green記録](bugfix-evidence-revision-02.md)）、review-02/03でResolvedと判定されている。不具合を意図的に戻して人工的なRedを作ることはプロジェクト方針（偽装の禁止、Red証拠の正当性）に反するため行わない。

本計画の新しい正式な人間のCode Generation Plan Approval前に、アプリ・試験の変更や追加の試験実行を始めない。要件・受入条件・C1/C3/C4・HTTP/schema・時間/再試行規則・登録済み検証コマンドは変更しない。実B認証、Auth/Supabase準備、実外部API、Vercel/公開確認は後回しという本人の方針を保持する。

## Evidence Already Recorded in This Run (2026-10-26)

revision 02実行のStep 1/2は今回の実行証拠として扱う（旧日付の結果ではない）。

| 確認 | コマンド | 結果 |
|---|---|---|
| runner | npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false | exit 0、1/1成功、skip 0 |
| U3全体 | U3全9ファイルのexact command（試験手順を参照） | exit 0、9ファイル／141件成功、skip 0、7.29秒 |
| 全体 | npm test | exit 0、56ファイル／645件成功、skip 0 |
| coverage | npm test -- --passWithNoTests=false --coverage | exit 0、lines 85.96%（2964/3448）、statements 84.34%、branches 76.2%、functions 82.42% |
| 状態/保存制御 | session/edits exact command | exit 0、48/48成功（Redなし） |
| 実PG結合 | comparison.integration exact command | exit 0、12/12成功（Redなし） |

環境はNode v22.20.0（process-local PATH）、npm 10.9.3、Vitest 4.1.8（node環境）、v8、対象src/app、lines 80。既存U3 manifest 29件に対象8ファイルが含まれ、U1（96件）・U2（41件）との重複はない。

## Change Boundary

新しいアプリ変更は予定しない。新しい不具合が再現し修復が必要な場合だけ、次の既定8ファイルに限定する。8ファイル外や契約・要件変更が必要ならrootへ返し、計画の再承認を先に行う。

| ファイル | 必要時だけの最小変更 |
|---|---|
| src/lib/companyComparison/session.ts | 参照利用不可の状態・世代・解除 |
| src/lib/companyComparison/edits.ts | 新規save/rebaseガード、404/通信失敗の区別、lookup/retry保持 |
| src/components/compare/ServerCompanyComparison.tsx | refresh404の伝達、確定outcomeに基づく成功表示 |
| src/components/compare/ComparisonFieldEditor.tsx | 利用不可時の入力/保存/rebase停止、確定結果表示 |
| tests/u3-company-comparison/session.test.ts | 再現した不具合に対応する最小回帰のみ |
| tests/u3-company-comparison/edits.test.ts | 同上 |
| tests/u3-company-comparison/ui.test.ts | 同上 |
| tests/u3-company-comparison/comparison.integration.test.ts | 同上 |

既存fixture/uiHarness、model/client/export/legacy、比較表/Provider/入口、docs、scripts、U1/U2の成果物・試験・helperは変更しない。新しい依存・runner・provider・coverage設定/include/exclude/threshold・timeoutを追加/弱化しない。dirtyな既存編集と.worktrees/cloud-handoffを保全する。commit/push/PR/merge/deployは行わない。

## Ordered Steps

- [ ] Step 1 — **所有境界・runner確認**。US8.1/US9.1、NFR6.2。上記「Evidence Already Recorded」のreadinessとU3全9ファイルの結果を今回のrunner確認として記録する。HEADや対象8ファイルが記録時から変わっていればexact commandを1回だけ再実行する。0件/収集不能/DB準備不備はRedにしない。
- [ ] Step 2 — **変更前baseline**。NFR6.3。記録済みの全体645件・coverage lines 85.96%を今回のbaselineとする。HEADが変わっていれば全体testとcoverageを1回ずつ再実行する。
- [ ] Step 3 — **既存修正の再検証**。US8.1/US9.1、共同US6.3〜6.5、AC6.3.1〜4/AC6.4.3/AC6.5.4/AC8.1.4/AC9.1.4、BR4.1〜4.4/BR5.1/BR5.2、NFR2.3〜2.7/3.1〜3.3。session/edits、実PG結合、UIの各exact commandを実行し、回帰20件（S-R1〜5、C-R1〜7、U-R1〜6、I-R1〜2）の各観測がR-01/R-02の受入に対応していることを試験名・assertionで照合する。既存試験を新しいRedとして数えず、旧Red/Greenは履歴として参照する。
- [ ] Step 4 — **条件付きRed**。Step 3またはStep 6で対象内の製品不具合が新たに再現した場合に限り、受入に対応する最小の失敗試験を先に書き、exact commandで不具合原因による失敗出力を記録する。環境・fixture・接続の失敗はRedにしない。再現しなければ非適用とその理由を記録する。
- [ ] Step 5 — **条件付きGreen/Refactor**。Step 4のRedに対して既定8ファイル内の最小変更でGreenにし、greenを保って整理する。assertion・閾値・timeoutを弱めない。Step 4が非適用なら非適用を記録する。
- [ ] Step 6 — **限定的な実画面確認**。M-R1〜M-R5を架空データ・既存preview（最大300000ms、延長しない）で、実行できる範囲だけ行う。CDP/Playwright/browser fetch/状態注入は使わない。実施できなかった項目（明示rebase後の再保存、残る別企業の確認・保存、他欄dirty時の片欄保存と確定ID表示、画面往復で追加保存なし、比較.md出力前の再取得、mobile幅とnative 200%/400%、Tab/Shift+Tab/Enter）とR-03（実Bセッション、実A→B→A、出力中の本人切替）は未確認のまま残し、本人へ具体的な操作として引き継ぐ。未確認を合格にしない。
- [ ] Step 7 — **全体品質・差分確認**。全担当AC、NFR6.3。npm run lint、npm run typecheck、npm test、npm test -- --passWithNoTests=false --coverage、npm run build、`git diff --check -- . ':(exclude)aidlc/spaces/default/intents/261011-company-data-management/audit/**'`を直列に1回ずつ実行。全app/src lines80%以上、既存設定を維持。差分検査から除くのは公式ツール所有の監査記録だけとし、その既知の末尾空白2件は[検証結果](verification-results.md)に失敗として残す。失敗時は停止して報告し、自動再試行しない。
- [ ] Step 8 — **記録更新**。全担当US/AC/17BR/30NFR。code-summary.md、traceability.json（U3担当35AC／他Unit55ACを維持、OK対象は実在ファイル）、source-manifest.json（累積claimsを保持し、今回触れたapplication pathを追加）、既存のtdd-evidence.md／verification-results.md／manual-evidence.md／manual-acceptance-status.mdを今回の実結果で更新する。旧証拠は消さず、今回と履歴を分ける。R-01/R-02は今回の再検証結果に基づき記録し、R-03／実環境／U2未確認は残す。
- [ ] Step 9 — **正式レビューと検証checkpoint**。rootが完成物の正式レビューを依頼し、登録済み公式検証コマンド npm test -- --passWithNoTests=false の結果を記録して本人のU3判断へ渡す。

## Verification Commands

| 検証 | コマンド／条件 |
|---|---|
| DB前提 | 必要時だけ既存 docker compose -f compose.test.yml up -d --wait。localhostの使い捨てworkspace_test/PG17以外に接続しない |
| 全体品質 | npm run lint / npm run typecheck / npm test / npm test -- --passWithNoTests=false --coverage / npm run build / `git diff --check -- . ':(exclude)aidlc/spaces/default/intents/261011-company-data-management/audit/**'`（公式監査記録のみ除外。全体 `git diff --check` の既知の失敗は別途記録） |
| 登録済み公式checkpoint | npm test -- --passWithNoTests=false をrootが既承認のまま使用。変更しない |
| 画面用準備 | 既存 node scripts/local-workspace-preview.mjs を変更せず使用。最大300000ms、延長しない |
| 終了 | 専用preview停止・専用schema削除の結果を確認。既存server/volume/他者worktreeを停止/削除しない |

Unit対象のexact commandsは[Unit試験手順](unit-test-instructions.md)に集約する。全体成功と画面確認の範囲を分けて記録し、ローカル品質・review・Classic段階の完了だけで本番リリース完了としない。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "tdd",
  "source": "project",
  "ordering": "For each applicable testable layer: Red, then Green, then Refactor.",
  "scope": "classic",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: tdd\n- **Methodology evidence**: 2026-10-10の人間の「TDDで実装したいな」、project.mdおよびAGENTS.mdの明示方針。現行テストやcommit順からTDD実践済みと推定したものではない。\n- **Ordering**: 新規・変更する振る舞いと不具合修正は各対象レイヤーのrunner確認後、受入基準に対応する失敗テストを実行するRed、最小実装で通すGreen、テストをgreenに保つRefactorの順に進める。\n- 環境不備や無関係の失敗をRedとせず、コマンドと結果を公式Unit記録に残す。アサーションを弱めない。純粋な文書・設定変更は非適用理由と検証方法を承認計画に示す。\n- Test StrategyはStandard。Classic/orgのline coverage 80%下限を維持する。現在はcoverage provider・設定・レポートがなく達成未確認。計測対象、provider、CI接続は後続計画・承認で解決し、この段階では新依存を追加しない。\n- 現行Vitestはnode環境、純粋関数/API fake client/静的SSR中心。Q1の人間回答Aに従い、既存Vitestと手動の画面確認を受入検証の基本にする。後続の承認計画に具体的な操作、期待結果、証拠の残し方を記載する。新しいブラウザ自動テスト依存を自動採用しない。\n- PR前にnpm run lint、npm run typecheck、npm test、npm run buildと承認済み受入基準を検証する。Docker変更時はDockerも確認する。\n- テスト/CIはdummy providersを使い、実API秘密情報や個人メモを用いない。公式runtimeはアプリ検査から除外し、公式doctorと信頼済みセッションで確認する。"
    },
    {
      "layer": "project",
      "text": "Methodology: tdd\nOrdering: For each applicable testable layer: Red, then Green, then Refactor.\n\n- ユーザーが本プロジェクトの実装方針として TDD を選択した（2026-10-10 の会話「TDDで実装したいな」）。これは運用方針の選択であり、個々のアプリ Bolt の Inception / Code Generation Plan Approval を代替しない。\n- 新規・変更する振る舞いと不具合修正は、受入基準に対応するテストを先に書き、対象の未実装／不具合による失敗を実行して確認する（Red）。実行環境の不備や unrelated failure を Red の証拠にしない。\n- テストを通す最小実装を行う（Green）。その後、既存テストと新規テストを green に保って整理する（Refactor）。成功させるためだけに受入基準やアサーションを弱めない。\n- 既存のテスト runner / Unit 対象コマンドを Red の前に確認する。対象レイヤー、受入基準とテストの対応、実行コマンド、Red / Green / Refactor の結果を公式 Unit 記録に残す。\n- 実行可能な振る舞いを持たないドキュメント・純粋な設定変更に人工的な失敗テストは作らない。適用対象外の理由と検証方法を計画に示す。テスト量・coverage・CI の既存要件は維持する。\n\n- Before the release PR, pass npm run lint, npm run typecheck, npm test, and npm run build; also verify the Bolt's user-facing acceptance criteria.\n- Keep the official runtime outside application lint/typecheck/format checks; validate it with aidlc doctor and trusted-session $aidlc --doctor.\n- Tests/CI use dummy providers and do not call real OpenAI/Google Drive APIs or log private notes or secrets."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "tdd",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - Red: write the failing tests and record the failing command output.",
      "Data model / database behavior - Green: implement only enough behavior to pass.",
      "Data model / database behavior - Refactor: improve the implementation while tests stay green.",
      "Repository / data access - Red: write the failing tests and record the failing command output.",
      "Repository / data access - Green: implement only enough behavior to pass.",
      "Repository / data access - Refactor: improve the implementation while tests stay green.",
      "Business logic - Red: write the failing tests and record the failing command output.",
      "Business logic - Green: implement only enough behavior to pass.",
      "Business logic - Refactor: improve the implementation while tests stay green.",
      "API / endpoint - Red: write the failing tests and record the failing command output.",
      "API / endpoint - Green: implement only enough behavior to pass.",
      "API / endpoint - Refactor: improve the implementation while tests stay green.",
      "Frontend behavior - Red: write the failing tests and record the failing command output.",
      "Frontend behavior - Green: implement only enough behavior to pass.",
      "Frontend behavior - Refactor: improve the implementation while tests stay green.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:a81ff743a3d49d0b372ca217833d3121675db14e36b6566d65f53925c5db9985",
  "contract_sha256": "sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440"
}
```

## Sources

- 本人の2026-10-27判断「再検証用に直して承認」、[旧計画revision 02](code-generation-plan.before-reverify-20261027.md)、[旧Red/Green記録](bugfix-evidence-revision-02.md)、[正式レビュー](reviews/review-01.md)。
- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[整合性設計](../nfr-design/reliability-design.md)、[安全性](../nfr-design/security-design.md)、[論理部品](../nfr-design/logical-components.md)。
- [要件](../../../inception/requirements-analysis/requirements.md)、[契約](../../../inception/contract-design/contract-summary.md)、[Unit対応](../../../inception/units-generation/unit-of-work.md)。
