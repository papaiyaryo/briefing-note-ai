# U1：実PG試験の待ち状態観測・最小修復計画（改訂5）

## Summary

- Builds: 最新取得・入力保持と復元後session拒否の再発timeoutについて、今回の専用資源を識別して準備／後始末の待ちを有限に観測し、確認できた試験補助の原因だけを最小修復する。
- Touches: 下表の既存5ファイルと必要時の新規3ファイル、U1記録。アプリ・本番SQL・設定・U2／U3は変更しない。
- Tests: U1既存253件／全体635件を基準に、観測制御と必要なfixture lifecycleの最大6境界をTDDで検証する。5000／4000／40ms、全assertion、既定並列、app/src全体line80%以上を維持する。

## Scope and Current Evidence

本人が手元のnpm testでuiCallbacks.tsx:577の5000ms timeoutを再現し、「こっちは修正が必要だった気がする」と修正再開を求めた。手元実行の全体件数・phase経過は不明。U1は公式unit resume済み（2026-10-24T02:21:57Z）。同attemptの開始記録を維持し、勝手に新startしない。改訂4の承認は追加診断実行の承認ではない。今回の計画・手順の新しいPlan Approvalまでは、追加の試験／DB接続／観測実装を実行しない。

改訂4の原文とチェック状態はcode-generation-plan.before-wait-diagnostics-replan-20261024.mdとunit-test-instructions.before-wait-diagnostics-replan-20261024.mdへ保持する。無変更UI46/46、Restore6/6、全体635/635成功、続く計測付き全体634/635・UI5021msは過去の結果として保持し、今回の実行や成功へ読み替えない。旧診断予算は使い切っており再演しない。

既存計測ではUIのlatest/draft/base照合4710ms、pool close4713ms、schema cleanup開始4714msを確認したが完了は未確認。bootstrap区間2427msの内訳、lock競合・接続漏れ・重複準備の因果は未特定。schema／backend識別がなかったため当時の残骸を安全に特定できず、削除していない。

その後のU2品質はlint/typecheck・通常635件・coverage635件・build成功。一方、正式checkpoint初回はInvalid URLで498pass/8fail/129skip。本人Retry後、起動場所をdispatchへ分離し--project-dir root・Node22 PATH・fixture既定のローカル試験DB URLをprocess-localに明示した公式verifyでURLエラーは消えたが633/635、UI5038msとrestoreの外部logout失敗ケース5958msで失敗。UI照合4409ms、pool close4412ms、schema cleanup開始4413ms、完了未確認。これも原因確定や修復済みの証拠ではない。U2成果物・reviewは固定して触らない。

## Boundaries and Files

| 許可source候補（最大8） | 用途 |
|---|---|
| tests/u1-company-notes/helpers.ts | 専用schema／admin接続の識別と段階到達の登録。原因確認後だけ初期化・失敗cleanupを最小修復 |
| tests/u1-company-notes/runtimeFixture.ts | 専用pool接続識別、初期Authとclose到達。Repository／AccessControl／pool max3を維持 |
| tests/u1-company-notes/db/bootstrap.sql | 共有準備の因果が確認された場合だけ同じ役割・権限・dummy owner・整合性を保つ最小変更 |
| tests/u1-company-notes/uiCallbacks.tsx | 該当ケースに観測run／fixture識別を関連付け、実handler/PGとdraft/baseの期待を保持 |
| tests/u1-company-notes/restore.integration.test.ts | 各ケース識別と段階観測。旧dump対照→全拒否・data不変・fresh loginを保持 |
| tests/u1-company-notes/fixtureDiagnostics.ts（新規候補） | 診断時だけの資源登録・安全な観測projection・停止／解放制御。通常fixtureへのAPIは後方互換 |
| scripts/u1-fixture-diagnostics.mjs（新規候補） | worker外の有限observerと同じnpm testの子実行。診断以外には使用しない |
| tests/u1-company-notes/fixtureLifecycle.test.ts（新規候補） | 下記最大6境界の必要部分のRed/Green/Refactor。件数合わせの重複試験なし |

U1 code-generationの計画／手順・新証拠・summary／trace／累積manifest／指紋は記録対象。正式state/audit/receipt/memory.mdは公式所有。rootが成果物・正式review・checkpointを担当する。今回の計画作成では計画／手順とその改訂4バックアップ2ファイルだけを変更する。

src/app、実認証・保存・requestScope/deadline、本番migration／復元SQL／復元script、deps/lock、Vitest/CI/coverage設定、preview、U2/U3 source/produces、共有handoff、guardsは変更しない。既存dirty/worktreeを保全しcommit/push/merge/deployなし。実Auth/Supabase・外部API・本番に接続しない。

既存5000ms test、UI waitFor4000ms（interval20）、40ms operation_unknown、製品8/10/15秒、全assertionを維持。fixtureの準備や通常cleanupをbeforeAll/beforeEachや試験後処理へ移して試験枠から隠さない。command内部のworker/並列を変えず、全schema共有／session使い回し／fake-only／RLS・Auth bypassはしない。

## Bounded Wait Observation

1. 外側runnerが診断専用run UUIDを作り、子npm testだけへprocess-localに渡す。fixture生成時に生成済み専用schema（^u1_test_[a-f0-9]{32}$）、fixture UUID、run ID、admin/appの役割タグを登録する。application_nameは63byte以内の固定接頭辞＋短いrun/fixture識別にし、全UUID対応表で衝突を検出する。adminとpool各接続のbackend PIDを接続確立時に取得し、observerがbackend_startと照合してPID再利用を区別する。認証値・owner値・データID・URLは登録しない。
2. 対象はこの子実行で作るfixture。通常動作は変更せず、識別だけ全共有fixtureに付けて当該run内のblockerを追えるようにする。診断helperは今回run専用のdispatch配下へworker別の小さな登録／stage記録を出す。過去runを検索・再利用しない。stage、schema/PID、application識別は試験生成値だけであり、実データを含めない。runner終了後も今回対応表を回収できるようにする。
3. observerは既存dummy admin資格で独立した接続を1本だけ使用する。localhostまたは127.0.0.1かつworkspace_testをURLとcurrent_database()の両方で検証し、別DB/接続先なら接続後の観測前に拒否してcloseする。観測はread-onlyで、接続時上限1000ms・観測SQL単独上限1000msを診断接続だけへ設定する。製品接続／test deadline／DB共通設定は変更しない。
4. 100ms間隔のserial観測、最大600回かつ観測開始から60秒まで。前回query完了前に次を発行せず、上限到達時は未完了として停止する。固定sleepから処理到達を推定せず、実際のstageイベントと取得したDB状態を根拠にする。子実行が終了すればtimerを止め、1回の最終snapshot（600回枠内）を試みてfinallyでobserver.endをawaitする。自分のobserverの終了失敗も未完了として記録する。
5. pg_stat_activityを今回登録済みPID/application_name/backend_startで絞り、state・wait_event_type・wait_event・query/xact経過だけを取得する。pg_locksはそのPIDだけのlocktype/mode/grantedと安全なrelation/advisory識別、pg_blocking_pidsはそのPIDの直接blockerだけを取得する。relationは今回登録schemaか共有bootstrapのauth.usersかその他かという分類を基本とし、対象外relation名は出さない。直接blockerが同じworkspace_test内の未登録backendならPIDと外部blockerという分類だけを残し、query・user・application名やデータを収集しない。datnameが異なるblockerは不明として詳細を取得しない。
6. 共有bootstrap待ち／schema DROP待ち／pool終了待ちとbackendの実待ちを関連付ける。advisory/relation lock競合、残存transaction、待ちがないCPU/I/O時間などを区別し、単に区間が長いだけで原因確定しない。bootstrap省略/cacheやcleanup変更はここでは行わない。観測権限不足・登録欠落・PID不一致・query timeout・子実行異常は診断不能として停止し、権限付与／OS修理／backend強制終了をしない。
7. runnerは子のcwdをworkspace rootへ固定し、既存Node22 PATHとfixture既定のdummyローカルURLを子だけへ明示して、同じnpm testを1回実行する。登録済み公式checkpoint commandは一切変更しない。子は既定並列・既存5000msで走る。観測60秒上限が来ても子成功と扱わず、子のexitを回収する。開始から90秒でも子が残る場合は当該runnerが作った子プロセスだけを停止し診断失敗として返す。他テスト／DB backendへcancel/terminateを送らない。
8. 永続化するのは許可したstage／経過／安全な識別／wait metadata、子exit・集計件数・skip・タイムアウト定型文、既知対象のfile/lineだけ。SQL全文・pg_stat_activity.query・SQLパラメータ・DB error detail・token/cookie・認証値・接続文字列・本文・子のraw stdout/stderrは保存しない。runnerはpipeした出力をallowlistでprojectionし、raw出力をファイル化しない。成功扱いは子exit0と観測停止／接続解放の両方が確認できた場合だけ。

通常のfixture closeは試験中に最後までawaitし、pool close／schema DROP／admin endを別々に確認する。実行後は今回対応表のexact schema/PIDだけをread-onlyで確認し、所有と終了が証明できないものへ操作しない。過去のu1_test_*を列挙削除せず、blockerをcancel/terminateしない。通常cleanup失敗時は失敗を保持する。今回の専用資源のcleanup修復が必要な場合も下記TDDと最小修復の対象として扱い、未確認を合格へ書き換えない。

## Ordered Steps and Acceptance Links

- [x] Step 1 — 現状とrunner確認。US1.1/US6.3、AC6.3.2、NFR2.6/6.1/6.4。既存hash/dirty・U1 93claims/96filesとconsumer現在値を読み取り、旧結果と新実行を区別する。Node22/Vitest/v8/line80を確認し、runner readiness exact commandを1回だけ確認。旧対象2file診断と旧全体診断を再演しない。
- [ ] Step 2 — 観測制御のTDDと設置。純粋な段階計測はTDD非適用。新helper/外側runnerの登録scope、出力projection、有限停止と子exit回収・観測接続解放という変更する挙動はB1の意味ある失敗試験→最小Green→Refactorをexact commandで確認。実DB障害／型エラーをRedとしない。既存計測を拡張するだけでfixtureの仮説修復はしない。型検査を1回確認し、壊れた観測経路を診断実行に使わない。
- [ ] Step 3 — 新予算の待ち観測。準備/cleanupの因果を初回観測付き全体1回で取得。必要な場合だけ、初回に観測した具体的な仮説と反証条件を記録して2回目1回まで。同じ許可範囲の観測point追加は可だが修復・時間制限・負荷の人工変更は不可。予期した5000ms timeoutは診断結果でありTDD Redではない。2回目を成功狙いのRetryにしない。原因未特定・観測不能・許可外原因ならここで停止し、未完了資源/不確実性/次案をrootへ返す。
- [ ] Step 4 — 必要なfixture修復のRed。US1.1/US6.3、NFR2.6/6.1。実測で原因が試験準備／cleanupと確認できた場合だけB2–B6の必要部分を選び、fixtureLifecycle exact commandの期待不成立を記録する。仮説のcache/最適化を先に実装せず、既存で成立する境界を複製しない。製品側/本番SQL/許可外fileが必要なら新計画まで停止する。
- [ ] Step 5 — 最小Green。Step4と同じ受入。原因に対応するfixture/helper/bootstrapだけを最小修復し同じexact commandを通す。共有初期化を触る場合は失敗を成功cacheへ残さず、同じ実DB識別の範囲だけを対象にし、並行安全・各schema/owner/Auth隔離と必要な実DB検証を保持する。cleanupの失敗を隠さない。
- [ ] Step 6 — Refactorと対象／consumer回帰。試験専用責務を整理し同じexact回帰をgreenに保つ。元2file、Restore/AuthとFrontend、U1 exact16files、U2/U3実PG consumer exact filesを直列の別コマンドで確認する。各command内部の既定並列と全assertion、40msunknownを維持。U2/U3成果物は触らない。
- [ ] Step 7 — 全体品質。NFR6.1/6.4。lint→typecheck→同じnpm testを2回連続→coverage→build→diff checkの順。意図した全体2回は追加Retryではなく事前の再発確認。失敗した時点で追加実行せずrootへ返す。必要な新規試験を含む実件数・skip0・exit・app/src全体line80%以上を記録し、2回成功を恒久的安定の証明と呼ばない。
- [ ] Step 8 — 成果物・正式review・checkpoint。rootが146既存IDs（90AC/23BR/33NFR）とDeferred・累積claimsを保全して新規差分と履歴を分けて記録し、完成物を正式reviewへ渡す。登録済みcommandの公式検証と本人判断へ返す。U2へ戻る操作は公式routingに従い、U1成功でU2全体やGUIを代替しない。

## TDD Boundaries and Diagnostic Budget

最大6境界を必要な部分だけ実装・検証する。B1は新しい診断制御を実行する前、B2–B6は原因確認後だけ。各対象にRed→Green→Refactorのcommand/exit/期待不成立/成功を残す。

| 境界 | 受入と必要時の試験 |
|---|---|
| B1 観測の所有・寿命 | 今回登録済み資源だけを読むprojection、禁止fieldを永続化しない、query/総回数/総時間上限、子exit/失敗/停止時のtimerと観測接続解放。injectしたDB/child/時計を使って失敗を再現し、実fixture受入の代用にしない |
| B2 共有準備失敗 | bootstrap失敗時adminを解放し失敗を成功扱いしない。次試行が失敗cacheに固定されず適切に初期化する |
| B3 migration失敗 | 作成済みの自分の専用schemaとadminだけを後始末し、別schemaを触らない |
| B4 初期Auth失敗 | 本物のlogin/authenticate失敗が伝播し、作成済みpool/schema/adminを解放する |
| B5 共有準備の競合 | 因果確認時のみ重複準備の扱いを修復。同じ実DBで競合安全・失敗後再試行、別DBへ成功cacheを流用しない |
| B6 fixture分離と終了 | 別fixtureのschema/owner/Authを隔離し、通常closeのpool/schema/adminとobserverが完了する。所有不明の残骸や他backendを処分しない |

段階ログ自体・文書に人工Redを作らない。B1のfake制御試験は観測器の振る舞いの証拠であり、実PG/handler/Authの成功とは別。故障注入は試験補助だけとし製品処理や本物の受入assertionは置換しない。runner/型/DBの無関係な失敗をRedにしない。

新しい全体診断は最大2回だけ（初回＋具体仮説を検証する必要時1回）。2回とも同じ既定npm testで、試験準備をhookへ移さない。原因が得られなければ残りの修復・品質へ進まず追加方針を本人へ返す。各SQL観測は最大600回／100ms間隔／60秒、子全体回収は90秒以内。これらは診断器の寿命であり、test/productの上限を伸ばすものではない。未完了loop/子/接続を成功としない。

## Verification Commands

すべて既存Node22依存・dummy providers・localhost/workspace_test。テスト/build/previewを同時実行しない。診断runner自身のread-only観測だけをその子npm testと並行させ、別テスト実行は並行しない。準備は必要時だけ同じ既存serviceを起動し、volumeリセットなし。

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

最後のcommandは登録済み公式checkpoint用で、外側runnerや追加flagsに変更しない。新診断のwrapper exact command、readiness、B1–B6とconsumerのexact commandsはunit-test-instructions.md。各コマンドの失敗を削除・自動Retryしない。

## Deferred Acceptance and Sources

旧3修正（draft保持・復元後全session除去・親ロック後削除期限再検査）と旧TDD/review/承認は履歴として維持する。既存で受容済みのU1スマホ／最新GET失敗GUI未確認、U2の残る受入とcheckpoint未完了、実Supabase17.11/Auth/Bsession/外部API、CI/merge/Vercel本番、dependency audit high5/critical1は今回成功を主張しない。U2最新品質の成功と正式checkpoint失敗を分けて記録する。

参照：timeout-investigation-20261023.md、timeout-diagnostic-run-20261024.md、改訂4バックアップ、U1 WF1/WF6とRD3/PD2/SD1、共有FR1.3/FR6.3/C4、U2の既存品質/checkpoint記録。上流契約・承認済み数値・公式検証commandは不変。今回の全checkboxは新Plan Approval前の未完了である。

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
