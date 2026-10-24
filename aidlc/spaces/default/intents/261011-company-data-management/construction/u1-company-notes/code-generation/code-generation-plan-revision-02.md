# U1：COMMIT期限試験の修正計画（改訂2）

## Summary

- Builds: 全体検証で不安定なCOMMIT期限テスト1件を、COMMIT到達を確認して時計を進める試験へ分離する。
- Touches: tests/u1-company-notes/routes.test.tsの当1caseと必要なimport、U1の計画・試験・証拠記録。
- Tests: 対象file19件と実PG回帰、全体検証、全app/src line coverage>=80%。40msとoperation_unknown期待を維持する。

## Scope and Authority

本人の「間違た。1でおいします願」を「U1の修正計画に戻る」への訂正として公式回答へ記録し、U3をset-aside-for U1で保持してU1のcode-generationだけを公式に開き直した。これは計画作成の指示であり、新しいCode Generation Plan Approval前にはテストも実装も変更しない。

1 Intent = 1 release Bolt002、Classic/strict、Unit-major/serialを維持する。現branch `release/bolt-002-company-data-management-local` と既存dirtyを保持する。実Supabase/Auth/秘密設定は後日、Vercel/公開は本人担当。準備や公開を待つ計画へ戻さない。

前回の実装計画と試験手順の内容は[初回改訂1の計画](code-generation-plan-initial-revision-01.md)・[初回改訂1の手順](unit-test-instructions-initial-revision-01.md)へ履歴として保管する。前回の実承認・実行・レビューは公式auditが正本で、履歴文書を新承認の代わりにしない。今回の順序・権限は本改訂と[新しい試験手順](unit-test-instructions.md)に限定する。旧20Stepを再実装しない。

## Observed Problem and Evidence Change

現case `server deadline during COMMIT response uncertainty stays operation_unknown` は、実PGのpool取得・BEGIN・timeout/role/session照会を40ms以内に通過した後だけCOMMITへ進み、afterCommitを実時間120ms保留する。前段で40msを超えるとCOMMITへ到達せず、既存実装がunavailableを返す構造である。全suiteの複数回の実失敗とfocused19件の成功は[診断案](../../u3-company-comparison/code-generation/u1-deadline-diagnosis.md)・[U3検証記録](../../u3-company-comparison/code-generation/verification-results.md)に残る。OS/PG/同時負荷のどの前段が時間を消費したかは未確定。

この1caseの証明範囲を「実PGへ40ms以内に到達できることを含む期限試験」から「制御transport上で実WorkspaceDatabaseとrequestScopeを通し、COMMIT到達後の期限分類を確実に検査する試験」へ分離する。fake transportを実DB成功と称さない。これは試験方法の実質変更なので、本改訂の新しい本人承認で確認する。

40msを延ばさず、期待をunavailableへ変えず、skip/todo/許容複数値・retry-until-green・設定の緩和を加えない。実装のWorkspaceDatabase/withRequestDeadline/markTransactionCommitをstubして期待エラーだけ投げる試験にしない。

## Files and Ownership

| 扱い | file/責任 | 限度 |
|---|---|---|
| 唯一のアプリ側変更 | tests/u1-company-notes/routes.test.ts | 当1case、その説明と必要なimportだけ。fake Pool/PoolClient・barrierは同case内で完結。他caseのassertion/fixtureは維持 |
| 読取再利用 | src/lib/server/workspace/database.ts、requestScope.ts、errors.ts、既存runtimeFixture/helpers | production変更なし。既存処理と実PG回帰を使う |
| 今回の記録 | 本U1 code-generation配下のplan/instructions、deadline-repair-baseline.json、deadline-repair-evidence.md、code-summary/traceability/source-manifest等 | 旧実績を履歴として保持し、今回実行と区別。state/audit/diary/approvalは公式toolだけ |
| root所有 | docs/session-handoff.md | 現状・本人判断・次作業を引き継ぐ |

新test file・共有helperの変更・新依存は不要。package/lock、Vitest/coverage/CI/timeout設定、DB/migration/Auth、U2/U3のsource/記録、UI/製品挙動は変更しない。通常のschema/権限/原子性/応答途絶のDB試験は実PGのまま。必要範囲が広がったら、理由と差分案を示し再承認する。

## Controlled Test and Preserved Evidence

対象caseでは既存Vitestのfake timersと単調時計performanceを同じ時間軸で制御する。Poolはmax3、PoolClientは既存transactionが必要とする最小query応答を用意する。所有者検証/RLS/原子性をfakeで証明しない。fixture本人を用い、必要なsession/role応答を架空値で閉じる。

- 前段queryは完了させ、実COMMIT呼出しをbarrier/観測で確認してから40msを進める。COMMIT到達前に時計を進めない。afterCommitはbarrierで保持する。
- deadline promiseへ拒否観測を先に接続し、未処理rejectionを残さない。実COMMIT呼出し1回とoperation_unknownをassertする。成功/未実行/rollback確定に読み替えない。
- query/afterCommitのbarrierをfinallyで必ず解放し、残continuationを回収する。時計/spyは元へ戻し、timer/接続の終了・release重複なしを確認する。barrier待ちはrunnerの有限上限内で失敗する形にし、任意sleepや無限pollingを導入しない。
- 当caseの名前/コメントと証拠へ制御transportであることを明示する。同fileの残18caseは実PGのまま。

| 維持する独立した証拠 | 実施file/既存case |
|---|---|
| 実DB変更と操作記録の原子性/rollback/RLS | database.integration.test.ts、repository.integration.test.ts |
| 実DBのCOMMIT応答途絶後に別接続で確定操作を照会 | repository.integration.test.tsのCOMMIT応答途絶case |
| HTTP503/operation_unknownと同IDのcommitted照会 | routes.test.tsのunknown operation outcome is not uncommitted |
| COMMIT前期限はunavailable、遅延書込を残さない | routes.test.tsのAuth残時間case/実DB遅延書込case、repositoryの期限case |
| U3 consumerの同ID照会 | 既存U3 comparison.integration.test.ts。読取/全体回帰のみでU1作業から変更しない |

## Layer Applicability and TDD

新しいdata model/repository/business/API/frontendのproduction実装は非適用。今回変えるのは期限試験の制御方法だけで、既存19caseを含むStandardの正常・異常境界と実DB回帰を維持する。新componentがないため、件数合わせの新規5〜8caseや人工的な失敗を作らない。

runner成立確認を最初に実行する。既存の失敗は既に当caseと実command/outputがある。Redでは修正前のsource hashと実失敗証拠を結び、前回結果と今回結果を区別する。承認後に修正前の全suiteを1回だけ実行し、再現すればその出力をRedとして追加する。通過した場合は通過と記録し、同一caseのhashが一致する既存の実失敗を再現履歴として引用する。無根拠に繰り返してRedを作らず、sourceが一致しない/診断と食い違う場合は止めて再診断する。準備不備・収集不能・他caseの失敗をこのRedとしない。

Greenは上の当1caseを最小変更してfocused19件を通す。Refactorでは同じfocusedを再実行し、barrier/clock/後始末と既存18caseの実PG維持を確認する。新たなproduction不具合が判明しても本権限で広げず、対象回帰と変更案を返す。

## Ordered Steps

- [x] Step 1 — **履歴と所有baseline**。US6.2/US6.3、NFR6.1。前回計画の履歴・current working tree・当test bytes hash・U1既存manifest・U2/U3書止めhashを確認し、今回開始baselineを記録。既存dirtyを戻さず、U3の未達を保持。
- [x] Step 2 — **runner readiness**。NFR6.1/6.4。既存U1 schema.test.tsのexact commandとNode22.23.3/既存Vitest4.1.8を確認。使い捨てPG17 health/隔離接続を確認し、setup失敗をRedにしない。設定/依存は変更しない。
- [x] Step 3 — **期限試験のRed証拠**。US6.2、BR6.5/BR10.1、NFR2.1/2.4。前節の同一source・旧失敗証拠を確認し、修正前全suiteを1回だけ実行。対象caseの実失敗/成功をそのまま記録。偽Red/不必要な反復なし。
- [x] Step 4 — **Green：当caseの制御transport化**。Step3と同じ対象。実COMMIT到達barrier/afterCommit保持/単調時計を制御し、40ms/operation_unknownを維持。finally解放・clock復元・接続終了を含む最小差分。focused19件を成功させる。
- [x] Step 5 — **Refactor**。Step3と同じ対象。case内の制御と型を整理してfocusedを再実行。原子性/同ID照会/遅延書込を検証する残18caseを実PGのまま保持し、全timer/continuationを回収する。
- [x] Step 6 — **独立した実PG証拠**。US6.2/US6.3、BR6.5、NFR2.1/2.2/2.3/2.4/2.9。database/repository/routesのexact groupを実PGで実行し、上表の境界を保つ。skip0、schema/client cleanupを確認。fakeでSQLの合格を代用しない。
- [x] Step 7 — **最終品質**。NFR6.1。npm run lint、npm run typecheck、npm test、npm run build、npm test -- --passWithNoTests=false --coverage、git diff --checkを順次実行。全app/src lines>=80と既存対象/thresholdを維持。全体失敗は未合格のまま、目標・コマンドを緩めない。
- [x] Step 8 — **Step5成果物・自己review・書止め**。全U1担当AC/BR/NFR。今回の1case差分と旧実装を区別しcode-summary/traceability/manifest/fingerprints/evidenceを更新。U1の既存source claimsを根拠なく削らず、変更対象外の後続Unit共有編集は開始baselineとして区別。既知未達を保持し、正式review前に書止めて返す。

## Exact Commands and Environment

全て承認後に実行する。Unit exactは[試験手順](unit-test-instructions.md)に記載。現在のNode22.23.3をprocess PATHで使い、npm/Node/依存の再installや機械固有pathのcommitをしない。DBは既存compose.test.yml・localhost/workspace_test・使い捨てPostgreSQL17、dummy Auth/provider/架空fixtureのみ。

| 用途 | command |
|---|---|
| 修正前の失敗確認 | npm test |
| 最終品質 | npm run lint / npm run typecheck / npm test / npm run build / npm test -- --passWithNoTests=false --coverage / git diff --check |
| 既存DBを用意する必要時のみ | docker compose -f compose.test.yml up -d --wait |
| 公式checkpoint | 登録済み npm test -- --passWithNoTests=false を変更せず再利用 |

重い検証は同時実行しない。Docker/CI/DB定義の変更は今回非適用。文書/履歴/manifestには人工Redを作らず、構造・リンク・hash・差分で確認する。clock/transportの実装確認は実試験で行う。外部文書の最新性を前提にした依存更新はしない。

## Acceptance Traceability

| 対象 | Steps | 今回の証拠/限界 |
|---|---|---|
| US6.2、FR6.3、BR6.3/6.5 | 2〜7 | 書込結果不明を成功/未実行へ読み替えない。UI自体の受入完了ではない |
| NFR2.1、BR10.1、PD2/RD2 | 3〜7 | COMMIT到達後40msの分類を制御transportで確実に検査。実SQL取消は既存実PG |
| NFR2.2/2.3/2.4/2.9 | 5〜7 | 実PGの原子性・COMMIT途絶・同ID照会を維持 |
| NFR6.1/6.4 | 1〜8 | TDD履歴と今回結果、Standard、全app/src lines80%、品質検証・source所有を記録 |
| US6.3、AC6.3.1〜4 | 6〜8 | 既存競合回帰の維持。AC6.3.2の既知draft問題は未修正、今回修正済みとしない |

最終traceabilityは元のU1の90AC/23BR/33詳細NFRを保持して状態を再確認し、今回の狭い変更を全受入達成へ拡張しない。前回完成状態やcoverage値を今回の実行結果へ流用しない。

## Carried Findings and Release Limits

U1の競合時latest取得にdraft破棄が必要な問題、backup復元で失効sessionが復活する問題、親lock待ち後の削除確認期限問題は今回の修正対象外で未解決。U2の重複保存/拡大入口未確認、U3の旧新切替後readError未確定/未到達Manual条件も保持する。既存dependency audit high5/critical1は変更しない。

実CI/本番Auth/Supabase/公開/mergeは未確認。Vercel作業・人間merge・公開の代行をしない。U1再完了後のU3再開は公式routingへ従い、U2の既完了を取り消さない。この1caseの安定化と全体検証成功は全90AC/リリース完了の証明ではない。

## Sources

- [未適用の診断と具体案](../../u3-company-comparison/code-generation/u1-deadline-diagnosis.md)、[U3の実失敗/成功記録](../../u3-company-comparison/code-generation/verification-results.md)。
- [U1動作仕様WF5](../functional-design/functional-spec.md)、[BR6.5/BR10.1](../functional-design/rules.md)、[論理モデル](../functional-design/entities.md)。
- [性能要件NFR2.1](../nfr-requirements/performance-requirements.md)、[整合性要件](../nfr-requirements/reliability-requirements.md)、[品質](../nfr-requirements/observability-requirements.md)、[技術前提](../nfr-requirements/tech-stack-decisions.md)。
- [期限/後始末設計](../nfr-design/performance-design.md)、[結果不明設計](../nfr-design/reliability-design.md)、[安全設計](../nfr-design/security-design.md)、[配置](../infrastructure-design/infrastructure-specification.md)。
- [共有契約C4](../../../inception/contract-design/contract-summary.md)、[Unit定義](../../../inception/units-generation/unit-of-work.md)、[ストーリー](../../../inception/user-stories/stories.md)、[要件](../../../inception/requirements-analysis/requirements.md)。
- [履歴計画](code-generation-plan-initial-revision-01.md)、[履歴手順](unit-test-instructions-initial-revision-01.md)。過去の準備と本人担当への変更を維持する。

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


