## Summary

- Builds: 保存後のOCR・復習往復で同じメモ1件を保持する既存修正の再検証と、画像入力以降・実倍率200%の画面受入。再現した対象内不具合だけをTDDで修復。
- Touches: BriefingNoteFlow、GenerationSavePanel、U2のUI試験・補助、docs/generated-notes-checks.mdの既存5ファイル。変更不要なら確認と記録に留める。
- Tests: 既存U2全140件（保存往復の回帰8件を含む）・生成回帰82件・実PG結合と実画面。必要な追加回帰は再現不具合に対応させ、全app/srcのline coverage80%以上を維持。

## Scope and Current Evidence

本人のU2 checkpointのRequest Changesを受け、未確認だった標準表示の画像入力以降・保存後OCR／復習往復・メモ1件保持、およびブラウザ実倍率200%の主要操作を確認する。FR5／FR6.2〜3／FR9、US5.1／US5.2／US6.2／US9.1／US9.2、BR4.1〜3／BR5.1〜2、NFR1.4／NFR2.3〜4／NFR3.1〜2／NFR5.2／NFR6.3〜4の既存範囲を維持する。

保存意図をFlowの本人・企業・候補の寿命へ結合する既存修正と8回帰は既に存在する。過去のRed／Greenと今回の再検証を区別し、同じ8件を新規追加・新しいRedとして数え直さない。前回のU2全140件・生成回帰82件・全体635件、lint／typecheck／coverage／build成功は履歴であり、今回の実行証拠へ代用しない。前回の全体1件timeoutと同条件Retry成功も履歴として保持する。

機能設計・NFR要件・NFR設計の現在文書を参照する。NFR設計の軽微な指摘は共有C4に沿って具体化する：操作照会が正常応答でunknownを返した場合、未実行と断定せず同じ凍結要求・operationId・memoIdによる本人の明示再試行を許す。照会そのものが失敗した場合は結果不明を保持し再照会する。新しい再送許可フィールドや別IDを導入しない。上流レビューの文書指摘が解消済みとは記録しない。

本人の環境準備回答「両方確認できる」は保持する。追加観察はログイン・企業登録・固定企業の画像入力画面までで、filechooser待機と接続切断により画像選択完了以降は未確認。準備回答、SSR、callback試験、CSS拡大を実画面受入に代用しない。

## Change Boundaries

変更が必要な場合のapplication／test／資料の許可範囲は次の既存5ファイルのみ。

| ファイル | 確認・必要時の最小変更 |
|---|---|
| src/components/BriefingNoteFlow.tsx | 同じ本人・企業・候補の保存意図を表示パネルより長く保持する責任、生成成功／失敗、本人・企業変更の境界 |
| src/components/generation/GenerationSavePanel.tsx | 保存中／結果不明／確定／確定後GET失敗の再表示、同じメモ取得・編集、二重送信防止 |
| tests/u2-generated-notes/ui.test.ts | 既存8回帰を維持。再現した対象内不具合にのみ必要最小の受入対応試験を追加 |
| tests/u2-generated-notes/uiHarness.tsx | 必要時だけU2専用の実Flow／Panel mount・unmount補助を修正。補助不備を製品Redと混同しない |
| docs/generated-notes-checks.md | 現在の操作・実行証拠・倍率・保存メモIDと件数・未確認事項を更新 |

U1のsource／produces、U3、共有handoff、保存model／client、API、DB／migration、provider、依存・設定・CSSは変更しない。新規sourceは予定しない。5ファイル外や契約・要件変更が必要なら計画の再承認を先に行う。既存source-manifestの41claimsは累積所有の記録として保全し、今回の新規変更数とは区別する。

実Auth／実Supabase／実外部API／Vercel作業を追加しない。新しい認証UI・DB・queue・storage・監視基盤・課金・browser test製品は導入しない。commit／push／merge／deployやguard変更も含めない。dirtyな変更と既存worktreeを保全する。U1は既存の承認済み依存として扱い、古い未修正表記を現状へ転記しない。

## Sequential Steps and Story Traceability

- [x] **Step 1 — runner・構成と現在差分の確認。** Node22、既存Vitest／v8、全app/src coverageと80%閾値を読み取り確認。unit-test-instructions.mdのreadiness exact commandを実行し、exit・収集数・対象版を記録する。テスト設定は変更不要を明示し、runner／fixture不成立や0件をRedにしない。US5.1／US6.2、NFR6.3〜4。
- [x] **Step 2 — 既存修正と8回帰の保全確認。** 実Flow／Panelの親子寿命と既存R1〜R8、model、U2全体、既存生成回帰を同じ条件で確認。保存済み往復・保存中往復・確定後GET失敗・unknown照会・本人／企業切替・新生成成功／失敗・保存後編集を確認する。正常unknownの明示再試行と照会失敗の区別も既存テストと共有C4で照合する。歴史的Redの再演や通る試験の複製はしない。US5.1／US5.2／US6.2／US9.2、BR4.1〜3。
- [ ] **Step 3 — 標準表示の追加実画面確認。** 下記の実UI操作を画像入力から実行し、保存後OCR往復・既存復習往復を経ても同じmemoId・件数1を保つことを取得画面で確認。保存成功通知だけでは判定しない。US5.1／US6.2／US9.2、AC5.1.5／AC6.2.2〜4／AC9.2.1〜3。
- [ ] **Step 4 — 実倍率200%と承認済み表示条件の確認。** 標準表示と実倍率200%を区別し、画像選択・OCR訂正・生成確認・保存・再取得の主要操作を実UIで実行。PC1366×768、390×844、幅320／767／768、400%、キーボード・label・通知等の既存条件も維持。自動操作で実倍率や画像選択を制御できない場合は本人の実操作へ引き継ぎ、未確認を合格にしない。NFR5.2、US5.1／US9.2。
- [ ] **Step 5 — 必要時Frontend Red。** Step2〜4で対象内の製品不備が再現した場合に限り、受入対応の最小回帰試験を先に書き、exact UI commandで期待不成立による失敗出力を記録する。runner・補助・接続・倍率未反映の失敗はRedではない。不具合がなければ本工程は非適用として記録し、旧8回帰を新規Redに数えない。US5.1／US6.2／US9.2、NFR6.3。
- [ ] **Step 6 — 必要時Frontend Green。** Step5の失敗に対してFlow／Panel内の最小変更だけを行い、同じexact UI commandでgreenを記録。照会成功unknownは同じ凍結要求・IDの本人再試行、照会失敗は再照会とする既存C4を維持し、新しいAPI応答は作らない。不具合がなければ非適用。BR4.1〜3、NFR1.4／NFR2.3〜4。
- [ ] **Step 7 — 必要時Frontend Refactorと画面再確認。** greenを保って責務を整理し、UI・model・該当実画面を再実行。assertion・timeout・閾値を弱めない。変更なしなら非適用を記録。US5.1／US6.2／US9.2、NFR6.3〜4。
- [ ] **Step 8 — 文書と全体品質検証。** docs/generated-notes-checks.mdを実結果で更新。lint・typecheck・全test・coverage・build・diff checkを実行。全app/src line80%以上、実PG結合を維持。失敗時は通常のverify/fix／公式Retry経路を使い、試験時間制限を延長しない。US5.1／US9.2、NFR6.3〜4。
- [x] **Step 9 — 成果物・自己点検。** rootがcode-summary・traceability・累積source-manifestを実結果で整え、135件（90 AC／14 BR／31 NFR）の既存対応とDeferredを維持する。今回変更と履歴を分け、U1／U3の凍結依存・秘密非保存・preview cleanupを確認。機能未確認は未確認のまま残す。
- [ ] **Step 10 — 正式レビューと検証checkpoint。** rootが完成物の正式レビューを依頼し、指定検証コマンドの実結果を記録して本人のU2判断へ渡す。新しいコード計画への承認とUnit受入判断は別のチェックポイントとする。

データモデル／DB、Repository、保存business logic、APIは今回変更しないので人工的なRedを設けない。Frontendの変更が必要な場合のみStep5→6→7の順を守る。文書や既存設定の確認には実行可能な新挙動がないためTDD非適用とし、参照・構文・差分を確認する。Standardの既存部品別試験、正常＋境界、実PG結合を維持する。

## Native Zoom and Manual Acceptance

1. 同時test／buildが終わり、localhost3000が空いていることを確認。既存previewを下記コマンドで起動する。dummy Auth／providers、実使い捨てPG、既存300000ms寿命と自身のcleanupを維持する。
2. CUAの実UIでダミー本人へログインし、ダミー企業を登録または今回用対象を開く。標準表示の実倍率／CSS幅／DPRと保存メモ件数を記録する。
3. 「画像・OCRからこの企業のメモを作成」から64KiB以下の架空画像を選択。OCR実行→訂正テキストを編集→生成→本文・構造・訂正OCRと保存先企業を確認→「この企業へ保存」へ進む。外部APIや実メモは使わない。
4. 「画像・OCR確認へ戻る」→「最後の生成候補へ戻る」、既存復習の生成・表示→閉じるを実際に往復する。確定表示・元memoIdを保ち、同じ企業詳細／メモ再取得で件数1と同じ保存メモを確認する。後続編集を新しい作成として送らない。
5. ブラウザの実UIで200%を確認し、同じ主要操作へ到達する。CSS scaleやviewportだけの変更を倍率の証明にしない。実倍率反映を確認できない場合やfilechooser／接続が失敗した場合は未確認を残し、必要な実操作を本人へ具体的に引き継ぐ。
6. 各UI待機は最大30秒、生成は既存45秒上限。原因を特定した再確認は1回まで。無期限再試行やブラウザ設定の無断変更、アプリ状態・Fileの注入はしない。操作はCUAのdocumented locator／filechooser APIを使用し、独立CDP／Playwrightライブラリやbrowser fetchは使わない。
7. 最後に倍率・一時viewportを戻し、所有タブとpreviewを終了。自身のNextプロセス・隔離schemaのcleanup結果を確認する。停止確認false／exit1を成功へ書き換えず、必要なら既知PIDとportの不在を独立確認する。他者プロセス・DB／volumeを停止・削除しない。

標準表示・実倍率200%・保存後往復のそれぞれに、対象版・到達操作・結果・memoId／件数・cleanupを対応させる。callback／SSRは補助証拠とし、実画面の合格には使わない。新規保存やprovider呼出しを実データで行わない。

## Verification Commands and Completion Criteria

準備と全体検証は以下の既存コマンドを維持する。unit-test-instructions.mdにはU2関連のexact test commandsだけを記載する。

```text
docker compose -f compose.test.yml up -d --wait
node scripts/local-workspace-preview.mjs
npm run lint
npm run typecheck
npm test
npm test -- --passWithNoTests=false --coverage
npm run build
git diff --check
npm test -- --passWithNoTests=false
```


全体成功と画面受入を両方確認する。実画面が未確認のままならその範囲を明示して本人のcheckpoint判断を待つ。既存40ms・5000ms等の制限、期待値、coverage対象／除外／80%閾値を合格のために変更しない。実Auth／外部性能／CI job／本番の達成は別確認のまま引き継ぐ。

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

