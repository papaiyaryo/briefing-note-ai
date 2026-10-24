# U1：実DBテストの30秒上限への変更（改訂6）

## Summary

- Builds: 再発した実DBテスト3件の待機上限を5秒から30秒へ変更し、期待結果と後始末を維持して検証する。性能の原因調査・最適化は後続へ回す。
- Touches: tests/u1-company-notes/uiCallbacks.tsx、restore.integration.test.ts の該当itのtimeout引数とU1記録のみ。進行中の観測器の追加実装・実DB診断は行わない。
- Tests: 既存の最新取得1件・復元session拒否2件を含む対象2ファイル、U1回帰、全体test・coverage・lint・typecheck・build。新規件数は増やさず、assertion・skip0・全app/src line80%以上を維持する。

## Scope and Current Evidence

2026-10-24の本人指示：「U１のテストが止まっているらしい。タイムアウトしているらしい。処理の遅いのは一旦許容する方針で行く」「一旦３０秒にして出来たら突破でいい気がする。処理が遅いのは後でやる内容とすればいいかな」。

この依頼により改訂5の「5000msを維持して原因を診断する」手順を本改訂へ置き換える。改訂5の計画・手順はbefore-30s-policy-20261024バックアップへ保存する。過去の失敗・成功・Red/Greenと未完了事項は削除せず、本改訂の実行結果に読み替えない。新しいPlan Approvalまではsourceやテストを変更・実行しない。

既往の再発はlatest取得のAC6.3.2と復元session拒否（外部logout失敗ケースおよび別sessionケース）の5000ms timeout。原因は未特定。直近の停止は観測器起動にNode24が選ばれた版チェック失敗であり、その回の実DB観測と子テストは未開始。U1は公式resume済み。同じattemptを使用する。

30秒は下記3件のテスト全体の待機上限であり、製品の性能達成基準ではない。成功してもタイムアウト原因解消・性能改善・本番性能合格とは記録しない。製品のDB8秒／server10秒／browser15秒、既存UI waitFor4000ms（interval20）、40ms operation_unknown、上流p95目標は変更しない。性能実測・調査・最適化は後続作業として未完了のまま残す。

## Boundaries and Files

| 対象 | 変更内容 |
|---|---|
| tests/u1-company-notes/uiCallbacks.tsx | 「AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する」のitだけ第三引数30000 |
| tests/u1-company-notes/restore.integration.test.ts | 「外部logout失敗でもアプリlogout済みCookieは復元再開後に拒否」「dump時に有効だった別sessionも再開前に拒否」のitだけ第三引数30000 |
| U1 code-generation記録 | 本改訂・手順・実行結果・summary/trace/累積manifest。state/audit/receiptは公式コマンド所有 |

グローバルVitest設定、他のtest期限、hook timeout、worker/並列、fixtureの初期化・cleanup、実handler/PG/Auth、assertion、fixtureデータ、src/app、本番SQL、依存/lock、U2/U3を変更しない。全suiteのtimeout延長や失敗のskip化はしない。既存dirtyを保持し、commit/push/PR/merge/deployは行わない。

改訂5で追加途中のfixtureDiagnostics.ts・fixtureLifecycle.test.ts・外側runner・段階計測は勝手に削除/完成扱いにしない。観測器の起動、追加B1修復、原因調査、B2–B6最適化は今回は進めない。ただし既存suiteに含まれる試験は除外せず、失敗すれば結果を示して停止する。未完了の所有識別/子exit回収は未解決として引き継ぐ。

## Ordered Steps and Acceptance Links

- [x] Step 1 — 差分・runner確認。AC6.3.2／RD3／NFR6.1・6.4。既存Node22の実行ファイルとVitest/v8、2対象fileと3件の名前、既存設定を読取り確認し、手順のschema readinessを1回実行。環境失敗をRedとしない。DBが必要なら既存compose serviceをvolumeリセットなしで起動する。
- [x] Step 2 — 待機上限の設定変更。上記3件だけit第三引数30000を明示する。新しい振る舞い・不具合修復はなくテスト待機予算だけの変更のため新規TDD Redは非適用。既往timeoutは履歴として参照し、人工Redや同じ失敗の再現を追加しない。認証・データ保持等の期待を変更しない。
- [x] Step 3 — 対象回帰。手順の2ファイルexact commandを1回実行し、実件数・exit・skip・経過と該当3件の結果を記録する。30秒以内に期待結果を満たせば、この待機予算下での機能回帰成功とする。30秒timeout、assertion、cleanup失敗は失敗のまま停止し、自動再試行・追加緩和・原因修復へ進まない。
- [ ] Step 4 — U1回帰と全体品質。U1 exact command後、lint→typecheck→npm test→coverage→build→diff checkを順次1回ずつ実行。既定並列・skip0・全app/src lines80%以上を維持し、失敗時は追加Retryせず提示する。途中の観測制御試験の失敗を除外しない。
- [ ] Step 5 — 記録・review・正式checkpoint。AC/BR/NFRの累積traceとDeferredを保全し、source-manifestとsummaryを実差分・結果で更新。正式reviewと登録済み公式検証コマンドを使い、必要な本人判断を待つ。今回の成功だけでU1全受入・U2 GUI・本番を完了扱いにしない。

## Verification Commands

全コマンドは既存Node22のprocess-local PATH、dummy providers、localhost/workspace_testを使用。手順の対象・U1 exact commandsを先に実行する。検証は直列。必要な環境準備のみ：
```text
docker compose -f compose.test.yml up -d --wait
```

全体品質と公式checkpoint：
```text
npm run lint
npm run typecheck
npm test
npm test -- --passWithNoTests=false --coverage
npm run build
git diff --check
npm test -- --passWithNoTests=false
```

最後は既存の登録済み公式checkpoint用。commandを変更せず、CLI timeout flagsも追加しない。各実行結果を記録し、失敗を削除したり自動Retryしない。

## Deferred Acceptance and Sources

性能調査・準備/cleanupの最適化、観測器B1の残る所有識別と子終了回収、改訂5の未開始DB観測は後続。原因未特定を維持し、30秒内成功で上流p95性能目標の達成を推定しない。製品性能の達成をリリース条件として変更する場合は別途Inception再承認が必要であり、本変更はそれを承認したものではない。

旧3修正とTDD/review/承認の履歴、146IDs（90AC/23BR/33NFR）、受容済みU1 GUI未確認、U2未完了、実Supabase/Auth/外部API/CI/merge/Vercelおよび既存dependency指摘を保持する。今回の承認はU1通過・全release完了の承認ではない。

参照：本人の本ターン指示、改訂5バックアップ、timeout-investigation-20261023.md、timeout-diagnostic-run-20261024.md、既存U2品質/checkpoint記録。製品の実装変更が必要なら本計画で修復せず再計画する。

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

