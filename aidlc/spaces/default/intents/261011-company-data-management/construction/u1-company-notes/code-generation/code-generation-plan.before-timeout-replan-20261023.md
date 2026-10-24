# U1：既知の不具合3件の修正計画（改訂3）

## Summary

- Builds: 競合後の下書き保持、復元後の旧セッション拒否、親ロック待ち後の削除期限再検査を修正する。
- Touches: CompanyDetailと必要な編集部品・draft処理、repository、復元SQL・確認スクリプト・設定手順、U1の回帰テストと記録。
- Tests: 3件に対応する新規回帰17ケースを目安にTDD。既存U1と全体回帰、全app/src lines80%以上、lint/typecheck/buildを確認する。

## Scope and Authority

本人は「U1〜U3の既知の不具合を修正する（下書き消失、復元後のセッション失効漏れ、削除期限、重複保存、比較画面の誤った保存成功表示・削除後の更新停止）。」を選び、その後「じゃあやって」と指示した。公式のcode-generation却下が記録され、新しい改訂としてU1から直列で進める。ここまでの指示は修正計画の作成を認めるもので、新しいCode Generation Plan Approval前にはアプリ・試験・復元スクリプトを変更しない。

1 Intent = release Bolt002、Classic/strict、Unit-major/serial、既存branchとdirtyを維持する。全Unitの新しいコード生成レビュー・チェックポイントが必要。既承認の要件・契約・設計を変えず、既存設計との不一致を直す。U2の重複保存と拡大時の入口確認、U3の2件は各Unitの新計画で扱う。本U1作業から後続Unitを変更しない。

[改訂2の計画](code-generation-plan-revision-02.md)と[改訂2の手順](unit-test-instructions-revision-02.md)を履歴として保存する。改訂2で直した40ms/operation_unknown試験と既存証拠は維持する。過去の587件成功・83.50%を本改訂の成功へ転記しない。

## Findings and Intended Behavior

| 所見 | 設計・受入根拠 | 修正後の判定 |
|---|---|---|
| R-01 Major：競合後の最新取得がmove経由でdraftを破棄する | US6.3/AC6.3.2、FR6.3、WF6、BR6.3/6.4、NFR3.2 | 企業とメモの409後、最新保存版と元の入力・元baselineを別々に保持・表示。最新取得だけでは破棄・保存しない。本人の明示再編集後だけ最新版を新baselineにして保存可能 |
| R-02 Major：復元でログアウト済みCookieが復活し得る | US1.1、FR1.3、NFR1、NFR2.6、RD3 | 通常backupからapp_sessionsの行を除外。古い全schema dumpも考慮し、復元後・アプリ再開前に全復元session/tokenを除去する。鍵の有無に関係なく新規ログインが必要。企業・メモ・操作履歴・owner/ID/版は保持 |
| R-03 Minor：削除確認期限を親ロック取得前にしか検査しない | US6.4/US6.5、FR6.4、WF7、BR6.5/6.6、NFR2.3/3.2、RD1 | 親ロック取得後・新規削除確定前にも信頼できる現在時刻で期限を検査。now>=expiryなら410、対象と操作記録を変更しない。確定済み同操作の再送は期限検査より先に元結果を返す |

所見の原文と未解決状態は[前回レビュー](reviews/review-02.md)を保持する。本改訂で未実施の動作を解決済みにしない。

## Files and Ownership

| 対象 | 許可する変更 |
|---|---|
| src/components/workspace/CompanyDetail.tsx | 最新取得を画面移動と分離し、企業・選択メモの最新版と保持入力を区別。明示再編集の入口と状態管理 |
| src/components/workspace/CompanyForm.tsx、MemoEditor.tsx、src/lib/workspace/draft.ts | 上記の保持・baseline・明示再編集に必要な最小差分のみ。本人別の隔離・保留要求を維持 |
| src/lib/server/workspace/repository.ts | deleteConfirmedの親ロック後の期限再検査。既存operation照合とロック順を維持 |
| db/maintenance/reset-restored-sessions.sql（新規） | 復元先の専用schemaだけのapp_sessions行を管理者が除去する実行SQL。識別子placeholderを検証して置換。通常APIへ管理者権限を付けない |
| scripts/workspace-restore-check.mjs、docs/company-data-setup.md | session行を通常dumpから除外し、上記の同一SQLを復元後に実行。古いdumpも再開前に必ず除去する手順、失敗時は再開不可、再ログインを明記 |
| tests/u1-company-notes/uiCallbacks.tsx、uiCases.tsx、draft.test.ts、repository.integration.test.ts | 所見に直接対応する回帰。既存hookHarness/fixtureは必要な最小拡張だけ |
| tests/u1-company-notes/restore.integration.test.ts（新規） | 実PG＋既存runtimeFixture/dummy Authで、同じ復元SQLと本物のAccessControlを通した旧Cookie拒否・新規ログイン・企業データ保持を検証 |
| 本U1記録、docs/session-handoff.md | 今回のbaseline/TDD/手動/品質結果、code-summary/traceability/source-manifestと指紋。rootが引継ぎを更新 |

依存追加、package/lock・coverage threshold・Vitest/CI・DBスキーマ/migration・Auth APIの変更は非適用。新しいSQLは運用時の復元処理であり通常リクエスト経路に追加しない。U2/U3 source、既存OCR/LLM、実外部サービス、Vercelは今回変更しない。上記以外が必要になれば変更理由と計画差分を示し再承認する。

## Test Design and Layer Applicability

既存runner/configと正常なschema試験を最初に確認する。各対象はRedの実出力→最小Green→Refactorを別に記録し、setup失敗をRedにしない。新componentを増やすための件数合わせはしない。既存Standardの5〜8件/componentと正常・異常境界を保ち、今回追加は次の17件を目安にする。

- 削除5件：企業・メモそれぞれのロック待ち中の期限超過、ちょうど期限の拒否、有効期限内の正常削除、確定済み操作の期限後再送。拒否時は対象・子・操作記録が不変。実PGで親ロックを確保し、待機状態を観測してから期限を越す有限barrierを使う。任意sleepだけでロック到達を推定しない。
- 復元6件：ログアウト前の行を復元した旧Cookieの拒否、有効だった全sessionも再開前に拒否、token行ゼロ、企業/メモ/owner/ID/版/成功操作不変、fresh login成功、SQL再実行の安全性。外部logout失敗でもアプリlogout成功後の旧Cookieを拒否する。安全なSQLを適用する前の旧処理で実際に認証が復活する失敗を先に確認する。
- 画面6件：企業とメモの各409→最新取得→draft/base保持→明示再編集、最新取得失敗時の保持、未承認の再保存ゼロ、移動取消の保持、同じ本人と別本人の隔離。実callback/状態を通し、文字列検索だけで動作の合格にしない。企業とメモの連続経路を分割して見落とさない。

data-modelのDDL変更、新しい独立business層、API契約変更は非適用。既存repository、復元処理、frontendが今回の対象レイヤーで、HTTP/認証と共有consumerは回帰で確認する。純粋な文書・履歴・manifestに人工Redは作らず、SQL実行・構造・リンク・差分で検証する。

## Ordered Steps

- [x] Step 1 — 履歴・baseline・runner準備。US1.1/US6.3/US6.4/US6.5、NFR6.1。改訂2と既知所見を保持し、U1/U2/U3の現在hashとdirtyを区別。既存Node22/Vitest、実PG17、隔離cleanup、schema.test.tsの正常実行を確認。設定/依存を変更しない。
- [ ] Step 2 — Repository Red。US6.4/US6.5、BR6.5/6.6、NFR2.3/3.2、RD1。上記5境界の実PG試験を先に追加し、親ロック待ち後の期限超過が誤って成功する失敗とcommand/outputを記録。
- [x] Step 3 — Repository Green。Step2と同じ対象。親ロック後の期限検査を最小実装し、410・変更ゼロ・期限前成功・成功再送を満たす。
- [x] Step 4 — Repository Refactor。既存ロック順・operation先行照合を整理・再確認し、同じexact試験をgreenに維持。
- [ ] Step 5 — Restore Red。US1.1、FR1.3、NFR2.6、RD3。新規restore.integration.test.tsで、dump時に有効だった行を復元するとlogout済みCookieが通る境界を実PG＋dummy Authで再現。無害な接続失敗・SQL不存在だけをRedとしない。
- [x] Step 6 — Restore Green。Step5と同じ対象。通常dumpのsession行除外、共通復元SQLによる全session/token除去、鍵の有無に依存しない再ログインをscriptと手順へ反映。6境界をgreenにする。
- [x] Step 7 — Restore Refactor。共通SQLの利用・実行対象識別子と最小権限・失敗時再開不可を整理。同じexact試験をgreenに維持し、実pg_dump/pg_restoreの全手順を隔離DBで1回検証。架空dumpをGit/auditへ置かず専用DB/schema/ファイルだけcleanup。
- [ ] Step 8 — Frontend Red。US6.3/AC6.3.2、BR6.3/6.4、NFR3.2。企業・メモの6境界を追加。既存callback runnerで409後の最新取得がdraftを消す実失敗を記録。
- [x] Step 9 — Frontend Green。Step8と同じ対象。最新取得で元draft/baseを保ち、最新保存版と入力を区別。本人の明示再編集で最新版から保存できる最小実装。自動送信・自動破棄なし。
- [ ] Step 10 — Frontend Refactorと画面確認。Step8と同じ対象。exact callback/draft回帰をgreenに保つ。既存local previewのdummy本人で企業・メモ各2クライアント競合→最新取得→保持入力→明示再編集→確定保存を操作。取得失敗で入力保持・追加PATCHゼロ。既存PC/スマホ/keyboardで入口へ到達できることを確認し専用process/schemaをcleanup。
- [x] Step 11 — Unit・全体品質。NFR6.1/6.4。U1 exact group、lint/typecheck/test/build/coverage/diffを直列実行し、全app/src lines80%以上とskip0を確認。既存40ms/operation_unknownと実PG回帰、U2/U3consumerの回帰を維持。失敗や未確認は残す。
- [x] Step 12 — 証拠・自己review・書止め。全U1担当AC/BR/NFR。今回のbaseline/TDD/手動/品質結果を修正証拠へ記録。146件の既存trace IDsとsource claimsを保持して対象所見だけ実証に基づき更新、manifest/指紋と引継ぎを整合。旧reviewは編集せず、新規正式review・Unit checkpointへ返す。

## Verification Commands and Environment

新Plan Approval後にのみ実行する。Node22と既存依存をprocess PATHで再利用し、再installしない。Unit exact commandは[試験手順](unit-test-instructions.md)の正本に従う。重い試験・build・DB処理は直列。

| 用途 | command |
|---|---|
| 必要時のみ使い捨てPGを起動 | docker compose -f compose.test.yml up -d --wait |
| 復元の全手順 | node scripts/workspace-restore-check.mjs |
| ローカル画面 | node scripts/local-workspace-preview.mjs |
| 最終品質 | npm run lint / npm run typecheck / npm test / npm run build |
| 全体coverage | npm test -- --passWithNoTests=false --coverage |
| 差分 | git diff --check |
| 公式Unit checkpoint | 登録済み npm test -- --passWithNoTests=false を変更せず実行 |

復元確認はlocalhost/workspace_testと専用名の一時DB/schemaだけ。SQLを本番へ適用しない。専用名の絶対的な対象確認とfinally cleanupを維持。通常DBroleへsession表の直接権限を広げず、本人・token・Cookie・dump本体を証拠に出力しない。

## Release Limits and Deferred Work

実Supabase/PostgreSQL17.11への接続、本人Auth作成・設定、実外部API、実CI・merge・公開受入は未確認。Vercel作業・公開確認は本人担当で後回し。U3の実Bセッション切替は未確認のままで、本改訂のdummy Auth試験を代用にしない。既存dependency audit high5/critical1は対象外で、依存更新やリスク受容を勝手に行わない。

U1の3所見を修正後も全体受入やリリース完了を宣言しない。U2/U3は公式routingが各Unitを示した後に、それぞれ計画承認・修正・レビュー・検証を行う。

## Sources

- [前回の未解決3所見](reviews/review-02.md)、[改訂2計画](code-generation-plan-revision-02.md)、[改訂2手順](unit-test-instructions-revision-02.md)。
- [機能仕様WF1/WF6/WF7](../functional-design/functional-spec.md)、[業務規則](../functional-design/rules.md)、[論理モデル](../functional-design/entities.md)。
- [復元・原子性・期限設計](../nfr-design/reliability-design.md)、[性能/期限](../nfr-design/performance-design.md)、[認証境界](../nfr-design/security-design.md)、[配置](../infrastructure-design/infrastructure-specification.md)。
- [整合性要件](../nfr-requirements/reliability-requirements.md)、[契約](../../../inception/contract-design/contract-summary.md)、[Unit](../../../inception/units-generation/unit-of-work.md)、[要件](../../../inception/requirements-analysis/requirements.md)。
- [既存設定・復元手順](../../../../../../../../docs/company-data-setup.md)は改訂対象であり、旧session復元の記述を設計の正本として優先しない。

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
