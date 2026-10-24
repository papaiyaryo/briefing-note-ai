# U2 — 訂正OCR・生成候補の企業保存コード計画

## Summary

- Builds: 選択企業へのOCR訂正・生成候補の明示保存、出自／出典・画像非保存、既存復習と.md出力の維持。
- Touches: 既存生成フロー／4生成API／server transport、U1の認証・署名接続部、新しいgeneration補助・保存UI・U2試験・手順書。新DB・依存・Vercel作業なし。
- Tests: 各部品5〜8件を基本に計80件以上を目安とするVitest単体／API fake／実PostgreSQL結合、既存回帰と実画面確認。全アプリline coverage80%以上を維持。

## Approval and Scope

現在は計画のみ。U2のCode Generation Plan Approvalは未取得で、アプリ実装・TDD Red／Greenは未開始。本書の承認後だけPart2へ進む。実Supabase／本人Auth／秘密値の設定は後回し、既存dummy Auth／providers＋使い捨てPostgreSQL17で検証する。Vercelの設定・deploy・公開URL照会・公開確認は本人担当。新たなVercel設定・deployment workflow・実外部API呼出しは追加しない。

同じBolt002のrelease/bolt-002-company-data-management-localを継続し、人の差分を保全する。新しいreleaseやPRをU2だけで分割しない。実装内容は既存49FR／U2の担当34AC・14BR・31NFRに限定し、共有・移行・新DB復習・既知不具合の一括修正を追加しない。

U1の競合後draft保持、復元session復活、削除確認期限の3問題は未修正。U2が使用する同じ編集契約の受入はこれらを解消済みとしない。既存依存audit high5／critical1、実Supabase・実CI・本番も未確認。これらを本計画でリスク受容済みとせず、全体検証の正式な修正経路へ引継ぐ。

## Implementation Boundaries and Planned Files

| 区分 | 作成／変更する対象 | 必要な変更 |
|---|---|---|
| 新規domain／client補助 | src/lib/generation/candidate.ts、draft.ts、save.ts | C2候補mapper・検証、owner別一時draft、凍結送信／結果照会。U1共有型／client／DraftVault／RequestGenerationを利用 |
| 新規UI | src/components/generation/GenerationSavePanel.tsx、GenerationCandidateFields.tsx | 選択企業固定、本文／構造／訂正OCR／イベント確認、保存状態／unknown照会／再試行、dummy表示 |
| 既存画面 | src/components/BriefingNoteFlow.tsx、src/components/workspace/CompanyDetail.tsx、WorkspaceHome.tsx、src/components/steps/UploadStep.tsx、OcrReviewStep.tsx、MarkdownEditStep.tsx | 企業詳細の生成入口、任意target propsで既存単発入口維持、画像release・未保存・本人／作業世代、短い外部保持案内、対応出力 |
| 生成出自のserver接続 | src/lib/server/workspace/generationReceipt.ts、runtime.ts、http.ts | 既存検証形式と同じ発行関数、検証済み本人と既存receipt鍵をserver内で利用。guardExistingの後方互換を保ちcallbackへ本人contextを渡す。保存／Auth本体の意味を変えない |
| 既存生成API／型／client | app/api/ocr/route.ts、structure/route.ts、web-supplement/route.ts、interview-review/route.ts；src/lib/openai/contracts.ts；src/lib/ocrClient.ts、structureClient.ts、webSupplementClient.ts、interviewReviewClient.ts | 検証成功後の任意generationReceipt追加、有限待機／取消し、型検証と既存error互換。新しい必須request項目や独自保存APIなし |
| provider境界 | src/lib/server/openaiClient.ts、ocr.ts、structure.ts、webSupplement.ts、interviewReview.ts；新規src/lib/server/generation/request.ts | provider30秒／server40秒・取消し伝播・finally解放、単発Responses store:false、最小診断。既存provider/model維持 |
| 新規U2試験 | tests/u2-generated-notes/candidate.test.ts、draft.test.ts、save.test.ts、generationReceipt.test.ts、providerRequests.test.ts、routes.test.ts、clients.test.ts、ui.test.ts、generation.integration.test.ts；fixtures.ts、helpers.ts、uiHarness.tsx | 正常＋2つ以上の失敗／境界を各部品で確認。fakeと実PGの役割を分離 |
| 必要な既存回帰調整 | tests/serverOcr.test.ts、ocrRoute.test.ts、webSupplementServer.test.ts、webSupplementRoute.test.ts、ui-components.test.ts；tests/u1-company-notes/existingRoutes.test.ts、providerRegressionCases.ts、runtimeCases.ts、runtimeFixture.ts、helpers.ts、legacyUiCases.tsx、uiCallbacks.tsx | APIの任意追加context／receipt／store:falseに伴うfixture・期待値の追加のみ。元の振る舞いのassertionを弱めず、無関係なU1不備修正をしない |
| 手動確認・資料 | 新規scripts/generated-notes-browser-check.mjs、docs/generated-notes-checks.md；docs/company-data-setup.md | 既存ローカルpreview／Edgeの仕組みを再利用し、U2 flowとcleanupを検証。実設定の空欄・本人作業境界を説明 |

変更不要: package.json／lockfile、新migration／table、DB repository、Auth provider／セッション規則、U3比較、Vercel設定。vitest.config.ts・既存CIのincludeと80%閾値は確認のみで変更しない。想定外の振る舞い／新依存／範囲が必要なら勝手に拡張せず計画を戻す。

U1レビュー済みsourceと重なる接続部だけを変更する。必要な公式再確認が要求された場合はその手順に従い、レビュー済みU1の文書・承認記録を手編集しない。Step5 manifestはU2で実際に変更した全sourceを列挙する。

## Sequential Steps and Story Traceability

- [x] **Step 1 — 着手前・runner・設定確認。** 既存差分とU1 baselineを記録し、Node22、依存、既存vitest.config／coverage／CIを確認。既存の試験専用PG17を使い、必要なら承認済みcompose.test.ymlのup --waitで準備。readinessのexact commandを実行してrunner成立を記録。準備失敗をRedにしない。US1.1／US1.2／全U2、LC1。
- [x] **Step 2 — Model／一時状態 Red。** candidate／draft／saveのexact groupで、C2正当候補、sourceUrl/id/confidence、画像欄排除、本文／構造別正本、owner隔離、同じ凍結要求とunknownの失敗を実行。対象AC5.1.1〜5、AC5.2.1〜5、AC6.2.2〜4、BR1.2／BR2.1〜BR4.3。
- [x] **Step 3 — Model Green。** 最小mapper・一時draft・保存意図を実装。本文を勝手にtrim／再生成しない。新DBや独自DTOなし。送信snapshotと現在draftは別に保持。U1 DraftVaultのowner別一時保管とdirty検出を使い、画像file自体はvaultへ入れない。
- [x] **Step 4 — Model Refactor。** 同じexact groupがgreenのまま型／責務を整理。上限・出典・null／未指定・同一要求のassertionを維持。
- [x] **Step 5 — server出自／provider Red。** generationReceiptとproviderRequestsのexact groupで、実出力provider・本人・UUID・active鍵の発行→U1 verifier、改変／別本人／key不整合拒否、検証失敗時非発行、全単発Responses store:false、30秒cap・40秒取消し／timer解放・安全logの失敗を記録。US5.1／US5.2、BR1.1／BR3.1〜4、SD1／SD2／PD1。
- [x] **Step 6 — server Green。** U1のpurpose/version/keyIdとmemo-generation:v1:の既存署名形式を共用。既存WORKSPACE_RECEIPT_KEYSからserver内でだけ発行し鍵を返さない。構造検証成功時のみ証明を生成し、runStructureの既存JSON検証を保つ。共有transportでprovider30秒以内、server40秒、browser45秒の取消しを伝播し、store:falseを明示。新しい実provider呼出しなし。
- [x] **Step 7 — server Refactor。** exact groupと既存provider回帰をgreenに保ち、重複timer／safe error処理を整理。既存復習中断の範囲外不具合を一括修正しない。
- [x] **Step 8 — API／client Red。** routes／clientsのexact groupで、guard先行・401/403・private,no-store、receiptを含む検証済み応答、C5 union error、既存structure HTTP例外、45秒／遅延応答／取消し、provider前拒否を記録。US1.1／US5.1／US5.2／US9.2。
- [x] **Step 9 — API／client Green。** guardExistingを後方互換で拡張し検証済み本人contextを渡す。structure応答に任意generationReceiptを加え既存memo/providerを維持。request bodyは既存のまま、任意AbortSignalで呼出しを取消し可能にする。不正外部応答は保存不可。既存routeのcode／statusは本書の互換表を維持。
- [x] **Step 10 — API／client Refactor。** exact groupと既存ルート回帰を維持。U1保存GET／POST経路・セッション／削除規則を変更しない。
- [x] **Step 11 — Frontend Red。** ui exact group（各画面部品5〜8件を基本）で、選択企業固定・生成名不一致、訂正と別正本、dummy表示、採用出典、明示保存、拒否／unknown／committed後GET失敗、未保存cancel、本人切替・遅延応答・画像release・対応出力の失敗を実行。US5.1／US5.2／US6.2／US6.3／US9.1／US9.2。
- [x] **Step 12 — Frontend Green。** 企業詳細内に生成入口を追加しCompany ID/nameを固定。既存単発入口は保存先なしの生成・復習・downloadを維持し、保存には企業から開始する案内。新規保存パネルは既存WorkspaceClientで同じC2へ送信、unknown照会／同一ID再試行・確定と再取得失敗を表示。生成企業名で企業を増やさない／改名しない。本文・構造・訂正OCR・イベントを確認・編集でき、再生成・移動の破棄は確認する。
- [x] **Step 13 — Frontend Refactor。** ui／modelと既存UI回帰をgreenに保ち、dirty／owner／作業世代／通知を整理。企業保存用の初期Markdown生成にimageFileNamesを渡さず、画像・file名・一時URLをDTOに入れない。本人の自由本文を機械的に書き換えない。画像差替え・除去・確定・終了・unmountで解放。HTMLを実行しない。既存の新DB復習連携や旧比較の移行・一括修正をしない。
- [ ] **Step 14 — 保存境界の実PG Red。** generation.integration exact groupでdummy生成→署名候補→実U1 HTTP/service／migration／PG保存の結合を確認し、未接続の受入失敗を記録。親消失・別owner・不正証明・不正構造・同一操作再送・確定直後応答途絶と同じID再取得を含む。既存U1 helperは読み取り再利用し、新DB／repository layerを作らない。
- [x] **Step 15 — 保存結合 Green。** 必要最小のU2接続だけを修正して、同じ企業／memo IDの本文・構造・OCR・イベント・採用Web・providerOriginの再取得と画像なしを成立させる。repo／schema／migration変更が不要なため独立した新repository TDD層は非適用。U1既知不備をfixtureで隠さず、該当する全体受入は未解消と明示。
- [x] **Step 16 — 保存結合 Refactor。** exact実PG groupとU2全groupをgreenに保ってfixture／cleanup・接続を整理。fake-onlyの成功をDB整合性の代用にしない。
- [x] **Step 17 — 文書・設定確認。** docs/generated-notes-checks.md／既存setupへ入口・失敗・一時画像・出典・設定空欄・本人作業範囲を追記。新インフラなし、実設定なし、新依存なし。文書と変更しない設定の確認は実行可能な振る舞いがないため人工Red対象外で、構文／リンク／型／build／差分で確認。
- [ ] **Step 18 — 実画面確認。** 既存local preview・架空Auth・隔離PG schema・Edge/CDPを再利用し、U2専用helperで下記flowを実操作。helper自体の失敗検出とexitを先に確認し、setup／helper不備をapp Redに数えない。見つけたU2不備は対応するRed→最小修正→Green、同じflow再実行。finallyと有限watchdogで専用preview／Edge／schema／画像参照をcleanupし他者資源を終了しない。
- [x] **Step 19 — 最終検証。** U2 exact groupと既存生成回帰、全体lint／typecheck／test／coverage／buildを実行。全app/srcのlines>=80%を維持し、除外や閾値を緩めない。必要な受入境界試験は既存Node/Vitest/fake方式で補い、SSR／callbackは実DOMの証拠にしない。DB／Docker変更なしでも実PG結合を実行。失敗・未実施を成功にしない。
- [x] **Step 20 — Step5成果物と自己点検。** code-summary／traceability／厳密source-manifest／TDD・手動証拠を実結果で作成し、実際の全変更を列挙、他者差分とU1既存差分を混同しない。正式レビュー・公式Unit complete／checkpointはrootが担当し、実装担当が承認や最終mergeを代行しない。

## Exact Commands and Compatibility

readiness: `npm test -- tests/flow.test.ts tests/serverOcr.test.ts tests/ocrRoute.test.ts tests/webSupplementRoute.test.ts --passWithNoTests=false`。各Red／Green／Refactor groupとU2全体・生成回帰のexact file指定はunit-test-instructions.mdに記載する。新ファイル未作成の収集失敗をrunner成功としない。

| 最終／準備コマンド | 目的 |
|---|---|
| docker compose -f compose.test.yml up -d --wait | 既存の試験専用PGだけを準備。秘密や実Supabase不要 |
| npm run lint | アプリlint |
| npm run typecheck | 型検査 |
| npm test | 既存＋全完成Unitの回帰 |
| npm test -- --passWithNoTests=false --coverage | 全app/srcの80% line coverage、0件成功不可 |
| npm run build | 秘密なしbuild |
| node scripts/generated-notes-browser-check.mjs | 実装後の専用ローカル画面helper。有限watchdog・cleanup必須 |
| git diff --check | 空白・差分の最終点検 |

公式checkpointは登録済み `npm test -- --passWithNoTests=false` を変更しない。上の全体コマンドをunit-test-instructionsの単体実行コマンドへ混ぜない。既存CIへ新workflow／実secretsを追加しない。変更した純粋文書には人工的な失敗試験を作らない。

/api/structureの互換: 不正要求invalid_input400、openaiキー未設定not_configured500、StructureErrorは当該code422、provider429はrate_limited429、その他provider／現在abort経路provider_error502。追加共通認証／Originは401／403。他の既存routeは既存server/errors.tsの写像を保つ。deadlineによる終了を無期限待ちへ戻さず、HTTP値を勝手に統一しない。

## Manual Acceptance and Evidence

PC1366×768、スマホ390×844、幅320／767／768、200%／400%拡大、PCキーボードとlabel／通知を確認する。架空画像64KiB以下・dummyのみ。OS／browser／対象版・fixture・各結果を記録し、実画像・本文・資格情報をauditへ貼らない。

| flow | 期待結果 |
|---|---|
| 企業詳細→画像→OCR訂正→生成名不一致→確認→保存→再取得 | 同じcompanyId、企業数不変、全保存項目とdummy判別が一致 |
| 本文と構造の別編集、採用Web | 片方を自動書換しない。sourceUrl／fetchedAt／id／confidenceを保持し紙と別区分 |
| 生成／構造検証失敗、証明改変／失効、保存拒否 | 成功保存なし、訂正と入力保持、修正／再認証可能 |
| 結果不明→操作照会→同一要求再試行 | 重複メモなし、unknownを未実行と決めない。確定後GET失敗でも保存成功を保持 |
| 未保存移動cancel、本人切替、遅延応答 | cancelは継続、別本人／別企業へ内容・成功通知を適用しない |
| 画像差替え・除去・確定・終了 | object参照とfileを解放、保存後は画像なしで同じメモを読める |
| 既存単発生成→編集download→復習→download | 対応する表示内容を出力。新DB復習／結果保存なし |
| キーボード・狭幅・拡大・危険HTML | 主要操作に到達、focus／通知が機能し、危険文字を実行しない |

認証・実外部・CI job・公開・U1既知不備の未確認／未修正は分けて残す。保存後競合のAC6.3.2等をU1既知不備があるまま全体合格と称さない。U3比較出力の受入をU2の成功に含めない。

## Design and Acceptance Mapping

| 要件群 | 対応ステップ・設計 |
|---|---|
| AC1.1.1〜4／AC1.2.1〜4 | 1、5〜10、14〜19。BR1.1／1.2、SD1、RD1。本人／owner／再取得のU2共同範囲 |
| AC5.1.1〜5 | 2〜19。BR2.1〜2.3／3.1／4.1、PD1／PD2／RD1 |
| AC5.2.1〜5 | 2〜19。BR3.1〜3.4、SD2。区分・要確認・出典・dummy |
| AC6.2.1〜5／AC6.3.1〜4 | 2〜4、11〜19。BR4.1〜4.3／SD1／RD1。保存後編集はU1へ依頼、既知不備の解消済み主張なし |
| AC9.1.1／3／5、AC9.2.1〜4 | 7、11〜19。BR5.1／5.2、RD2。比較AC9.1.2／4はU3 |
| NFR1.1〜5、NFR2.1〜7、NFR3.1〜2、NFR4.1〜4、NFR5.1〜2、NFR6.1〜4、NFR7.1〜7 | 全20ステップ、PD1／PD2／SD1／SD2／SC1／RD1／RD2／OD1／LC1。31IDの実装ファイル対応はStep20で実結果から記録 |

## Sources

- ../functional-design/entities.md、rules.md、functional-spec.md、frontend-components.md、traceability.json。
- ../nfr-requirements/ の6要件文書とtraceability.json。
- ../nfr-design/ の6設計文書とtraceability.json。Infrastructure Designは追加変更なし・構成既定のためU2だけ公式skip済み。
- ../../../inception/units-generation/unit-of-work.md、unit-of-work-story-map.md；requirements-analysis/requirements.md；user-stories/stories.md；domain-design/components.md；contract-design/contract-summary.md；delivery-planning/bolt-plan.md。
- docs/session-handoff.md、現在の生成画面・U1共有client／guard／receipt verifier／runtimeの静的確認。CodeKBのU1実装前の記載で現在のsourceを上書きしない。

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

