# U1：再発する実PGテストのタイムアウト調査・修正計画（改訂4）

## Summary

- Builds: 最新取得・入力保持と復元後の別セッション拒否で再発するタイムアウトを切り分け、原因が試験準備・後始末にある場合だけ最小修復する。
- Touches: U1のDB／runtime fixture・bootstrap・該当2試験と必要な専用回帰、U1記録。アプリ・DB migration・設定・U2／U3は変更しない。
- Tests: 既存U1 253件と全体635件を基準に、必要時だけfixtureの最大6境界をTDDで追加。5000ms・4000ms・40msと期待値、全app/src line80%以上を維持する。

## Scope and Current Evidence

本人は同条件Retry後に「U1の調査・修正計画へ戻す（推奨）」を選択し、「続けて」と指示した。U2をset-asideし、公式操作でU1のCode Generationだけを再開した。今回の新しいコード計画承認前にアプリ・試験・fixture・SQLを変更しない。

旧3修正（競合後draft保持・復元後全session除去・親ロック後削除期限再検査）は実装済みとして保全する。旧改訂3の計画・手順とチェック状態はbefore-timeout-replan-20261023の複製に残す。過去の有効なTDD、U1 checkpoint承認、GUIの残る未確認、初回632/635→635/635成功は履歴であり、今回の成功や新しいRedではない。旧summary/review/証拠を上書きして過去の失敗を消さない。

U2再検証で2回連続、全体633/635・exit1となった。初回47.44s：実HTTP/PGのAC6.3.2は5033ms、復元後別session拒否は5031ms。本人Retry44.86s：同じ2件が5056msと5041ms。両方とも既存5000ms timeout。lint/typecheck・U2全140・生成回帰82の成功は全体成功の代用ではない。最新の全体coverage/buildは未実行。

静的観察ではruntimeFixtureが試験本文内でDB準備・初期認証を行い、setupDatabaseは毎回共有bootstrapと専用schema migrationを実行する。bootstrapには共有advisory transaction lockがある。UI試験はその後の実HTTP完了を4000msのwaitForで待ち、最終的に入力と元版を照合する。Restore試験は同じ実PG／AccessControlを通る。これは待ち箇所の候補であり、ロック競合・接続漏れ・負荷・製品不備のいずれかと確定した証拠ではない。

## Boundaries and Files

| 許可する対象 | 用途 |
|---|---|
| tests/u1-company-notes/helpers.ts | 接続・共有bootstrap・専用schemaの段階を切り分け、原因として確認された重複準備／失敗時cleanupだけを最小修復 |
| tests/u1-company-notes/runtimeFixture.ts | 初期認証・Pool・fixture生成失敗時と正常終了時の専用資源管理。認証・Repositoryは本物を維持 |
| tests/u1-company-notes/db/bootstrap.sql | 共有準備の待ちが原因と実測された場合のみ、同一の役割・権限・dummy owner・整合性を保つ最小変更 |
| tests/u1-company-notes/uiCallbacks.tsx | AC6.3.2の段階計測・有限な実I/O到達観測・必要な専用fixture接続。実HTTP／PGとdraft/baseのassertionを維持 |
| tests/u1-company-notes/restore.integration.test.ts | 該当する旧dump対照・全復元session拒否を保つ段階計測とfixture接続 |
| tests/u1-company-notes/fixtureLifecycle.test.ts（必要時新規） | 計測で必要と確認した試験補助の振る舞いの回帰。下記最大6境界の必要な部分だけ |
| 本U1 code-generation記録 | 計画／手順、計測・TDD・全体結果、summary、traceability、累積manifest／指紋 |

変更しないもの：src／appのアプリ、実認証・保存・requestScope／deadline、復元SQL／本番migration／復元script、package/lock、Vitest/CI/coverage設定、preview helper、U2/U3 source／produces、共有handoff、guards。既存dirtyとworktreeを保全し、commit/push/merge/deployなし。通常schemaの共有化、全ケースへの同一session使い回し、RLS／Auth bypass、fake-onlyへの置換はしない。

既存5000ms test上限・UI waitFor4000ms・40ms operation_unknown・製品8/10/15秒と全期待値を変えない。fixtureをbeforeAll／beforeEachへ移して計測枠から隠さず、全体試験を設定やCLI追加で直列化して合格にしない。各ケースの隔離schema・owner・初期認証・実DB権限確認を維持する。共有bootstrapの重複抑制は待ちの因果が確認できた時だけで、初期化失敗や別DBへ成功cacheを流用しない。必要な検証そのものを省略しない。

## Ordered Steps and Acceptance Links

- [x] Step 1 — 現状・runner確認。US1.1/US6.3、AC6.3.2、NFR2.6/6.1/6.4。既存hash・dirty・93claims/96filesとU2/U3の現在値を記録し、既存Node22・Vitest/v8・line80%設定を確認。schema exact commandでrunnerと実DBの正常を確認。失敗や0件をRedにしない。
- [ ] Step 2 — 変更前の有限な切り分け。該当2ファイルをそれぞれ1回、同条件の全体npm testを1回まで実行。無変更で得られない場合だけ許可5既存ファイルへ試験専用の段階計測を置き、接続／bootstrap／migration／初期Auth／対象操作／cleanupの経過と最後の到達点を得る。秘密・SQLパラメータ・本文は出さず、同じ上限・既定並列条件で1回計測。無限Retry・sleepでの到達推定なし。調査で予期したtimeoutは診断結果として記録し、許可された回数内だけ切り分けを続ける。DB停止などの無関係な失敗は公式pauseへ返す。原因を特定できなければStep3以降へ進まず本人へ返す。
- [ ] Step 3 — 必要な試験補助のRed。US1.1/US6.3、NFR2.6/6.1。計測で試験準備／cleanupの原因を確認した場合だけ、必要な最大6境界をfixtureLifecycle.test.tsへ追加しexact commandで対象の失敗を記録する。既存timeoutだけを製品Redにせず、setup不成立／型エラーもRedにしない。製品側の修正が必要なら新しい対象・設計・計画承認まで停止する。
- [ ] Step 4 — 最小Green。Step3と同じ対象。原因に対応するfixture／bootstrapだけを修復し同じexact commandで成功を確認。段階ログは値を含めず必要最小限。各テストが本物のHTTP／PG／AccessControlを使うこと、共有初期化の失敗を成功扱いしないこと、専用資源が必ず解放されることを保つ。
- [ ] Step 5 — Refactorと対象・consumer回帰。Step3と同じ受入。試験専用責務を整理し同じexact回帰をgreenに保つ。元2ファイル、U1 exact16files、fixture利用側のU2/U3実PG exact filesを直列の別コマンドで確認し、各command内の既定条件を変えない。古いdumpの認証復活対照→除去後全拒否、fresh login、企業データ不変、draft/base保持、40msunknownを維持する。
- [ ] Step 6 — 全体品質と安定性確認。NFR6.1/6.4。lint、typecheck、同じnpm testを2回連続、coverage、build、diff checkの順に実行。全体2回は再発確認のための事前に定めた回数で、失敗したら追加Retryせず停止。新規必要試験を含む実件数・skip0・各exit・全app/src lines>=80を記録。2回成功も恒久的に再発しない証明とは呼ばない。
- [ ] Step 7 — 成果物・正式レビュー・checkpoint。146既存IDs（90AC/23BR/33NFR）・Deferredと累積claimsを保全し、新規差分と履歴を分けてsummary／trace／manifest／指紋を更新。元3修正を新規実装と数えない。rootが完成物を正式レビューへ渡し、登録済み検証を実行して本人判断へ返す。U2へ戻る操作は公式routingに従う。

## TDD Applicability and Diagnostic Limits

今回の変更可能な実行挙動は試験補助の初期化・失敗・解放だけ。実装する場合に限り、必要な境界の失敗試験→最小修正→同じ回帰をgreenに保つ整理の順を守る。最大6境界は、bootstrap失敗時の接続解放、migration失敗時の作成済み専用schema後始末、初期Auth失敗時のpool/schema後始末、同じ共有準備の競合時の安全性、初期化失敗後の次試行、別fixtureのschema／owner分離。既存で成立する境界を件数合わせのために重複追加しない。

新しいアプリdata model／Repository／business logic／API／frontend挙動は作らないため、それらへ人工Redを設けない。計測・純粋文書はTDD非適用として出力内容・差分で確認。過去の3修正のRedを再演しない。既存Standard試験と実PG回帰は減らさない。計測が原因を示さなければ仮説の最適化を実装せず、調査結果と次案を本人へ返す。

## Verification Commands

Unit exact commandsはunit-test-instructions.md。準備と全体検証は次のとおり。すべてNode22の既存依存・dummy provider・localhost/workspace_test専用。テスト/build/previewを同時実行しない。

```text
docker compose -f compose.test.yml up -d --wait
npm run lint
npm run typecheck
npm test
npm test -- --passWithNoTests=false --coverage
npm run build
git diff --check
npm test -- --passWithNoTests=false
```

Step2の診断は各対象1回＋全体1回、必要なら段階計測付き全体1回まで。Step6の全体npm testは意図的に2回、ほかは1回。修正前の失敗と修正後の結果を区別し、失敗を削除／自動Retryしない。Dockerは必要時だけ同じ既存serviceを起動し、volumeリセットや他資源削除なし。計測・cleanupは専用名を照合し自分の資源だけ扱う。

## Deferred Acceptance and Sources

今回の対象はテスト再発の切り分けと必要最小の試験補助修復。U1の本人受容済みスマホ／最新GET失敗のGUI未確認は未確認のまま保つ。U2の保存後往復・実倍率200%と残る品質検証は一時停止したまま保持する。本計画の成功はGUI合格やU2完成の代用ではない。実Supabase17.11、実Auth／Bsession、実外部API、CI／merge／Vercel／本番、既存dependency audit high5/critical1は未確認／未対応のまま。

参照：旧plan/instructions.before-timeout-replan-20261023.md、code-summary.md、restart-verification-20261022.md、U1 functional-designのWF1/WF6とrules、NFRのRD3/PD2/SD1、共有requirements FR1.3/FR6.3とC4、U2のgui-recheck-after-approval-20261023.md（2回の633/635記録）。上流要件・契約・承認済み数値は変更しない。

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

