# U3 — 保存企業比較のコード計画

## Summary

- Builds: 保存企業の7観点比較、欄別の志望度・理由保存、版確認付きMarkdown出力、旧比較の別入口。
- Touches: src/lib/companyComparison・src/components/compare、共通入口4ファイル、U3専用9試験とローカル確認手順。
- Tests: 最低103件（モデル・状態・client・保存・出力・旧形式・UI・実PG結合・readiness）、実画面と全体品質検査。

## Scope and Approval Boundary

同じIntentのrelease Bolt002、U3だけを実装する。U1へのC1/C3/C4を使い、U2内部依存・新DB・新API・新外部サービス・新依存・新環境変数・有料利用を追加しない。Infrastructure Designは追加資源/配置変更がないため本Unitだけ正式にskipped。Vercel/公開の作業は本人担当、実Supabase/Auth/鍵の準備は後日とし、ローカルdummy Auth/使い捨てPG17で進める。

この計画と[Unit試験手順](unit-test-instructions.md)の実際のCode Generation Plan Approval前にはsourceを変更しない。公式code-generation-questionsは作成/編集しない。承認後はチェックを完了時だけ付け、未実施のStepを完了にしない。要件/範囲/検証条件/必要な新依存の変更は別途承認へ戻す。

## Source Ownership

| 種別 | 対象 | 責任/変更限度 |
|---|---|---|
| 新モデル/制御 | src/lib/companyComparison/model.ts、session.ts、client.ts、edits.ts、export.ts、legacy.ts | LC1〜6。現schema/契約と7観点を再利用、ブラウザ専用owner別storeはserver singletonにしない |
| 新画面 | src/components/compare/ComparisonHome.tsx、ServerCompanyComparison.tsx、ComparisonTable.tsx、ComparisonFieldEditor.tsx、ComparisonSessionProvider.tsx、LegacyComparisonBoundary.tsx | 新/旧入口、選択・7観点・独立更新・復旧・出力、app instanceの状態所有 |
| 既存共有接続 | app/layout.tsx、app/compare/page.tsx、src/components/workspace/WorkspaceShell.tsx、src/components/compare/CompanyComparePage.tsx | layoutへProvider、compare入口、ナビとU3 dirty/owner連携、旧比較へ安全adapter。既存U1/生成導線と正常旧操作を維持するために限定 |
| 新試験 | tests/u3-company-comparison/{readiness,model,session,client,edits,export,legacy,ui,comparison.integration}.test.ts | 最低103件、詳細は試験手順。既存assertion/coverageを変更しない |
| 新fixture/試験補助 | tests/u3-company-comparison/fixtures.ts、uiHarness.tsx | 既存U1 helpers/hookHarness・架空データを再利用。別owner、複数メモ、Web/出自、限界値を準備 |
| 新手順/helper | docs/company-comparison-local.md、scripts/check-u3-comparison.mjs | dummy/実PGの実画面とHTTP参考性能、Edge/CDP既存方式、新runtime依存なし |
| 記録 | 本Unit code-generation配下の計画/試験/Step5成果物、docs/session-handoff.md | 実施内容・未達・所有差分を記録。state/audit/diary/approval receiptsは公式tool専用 |

既存src/lib/comparison.ts、U1共有契約/client/schema、DB migration/repository/Auth、U2生成source、package/lock/CI/coverage/Dockerは読取再利用だけ。U1/U2既知不備を修正するための凍結source変更は行わない。共有4fileのU3接続は上表の範囲で承認対象とする。別のfile/責務が必要なら変更理由を明らかにして計画変更を確認する。

## Layer Applicability and TDD Ordering

新永続モデル/DB schema/repository/server endpointの実装は非適用。U3派生モデル・legacy安全境界→C4 consumerと実PG連携→状態/欄別更新/出力→frontendの各適用層でRed→Green→Refactorを行う。既存U1 serverの合格試験を新しいserver実装のRedと称さない。

テストの依存未実装による失敗と、runner/DB準備不備を区別する。試験準備の失敗を直してから本来のRedを実行する。既存統合が最初から通った部分はGreenとして記録し、対応するU3境界Redを示す。架空の破壊でRedを作らず、追加の不備には受入リンク付き回帰テストを先に実行する。

## Ordered Steps

- [x] Step 1 — **調査・所有差分と設定の基準**。対象: US8.1/US9.1、共同US1.1/US1.2。現working tree（HEADだけでない）の既存変更・source hashをbaselineへ記録。branchとNode22.23.3/既存依存/Vitest設定を確認。別担当と既存dirtyを保全。package/lock/DB/CI/coverage設定は変更しない。未承認のU1/U2修正を加えない。

- [x] Step 2 — **Unit runner readiness**。対象: 全試験の前提、NFR6.2。readiness.test.tsを作り既存COMPARISON_POINTSの7キーを確認する1件を実行。実装対象のRedではない。既存試験DBのhealth/版/隔離接続・fixture権限を確認。setup不備は直して記録しRedとしない。

- [x] Step 3 — **モデル・旧形式のRed**。対象: US8.1/US9.1、BR2/3/5/6、NFR4/5。model.test.ts最低12件、legacy.test.ts最低8件を先に作り実行。全選択検証/7観点/欠損/出自/出典/安全Markdown/旧正常・破損・利用不可・非破壊を確認。未実装のU3処理による失敗を記録。

- [x] Step 4 — **モデル・旧形式のGreen**。対象: Step 3と同じ。model.ts/legacy.tsの必要最小処理を実装。既存COMPARISON_POINTS/schemaを使い別DTOを再定義しない。旧正常形式のID/日付は維持、不正混在で元の記録を落とす書込をしない。

- [x] Step 5 — **モデル・旧形式のRefactor**。対象: Step 3と同じ。同groupをgreenのまま整形・整理。U1/U2や既存comparison.tsをまとめて改修しない。

- [x] Step 6 — **C4 consumer・実PG接続境界のRed**。対象: US8.1、共同US1.1/1.2/6.3/6.4、NFR1/2/3/7。client.test.ts最低16件とcomparison.integration.test.ts最低10件を先に作る。U3 adapter未実装の失敗を実行。実PGの既存U1 C4 handler/service/repositoryを再利用し、U3 client経由の参照/限定更新/再取得を試験。既存API部分が初回Greenなら新Redと偽らず、U3境界Redとの対応と実順を記す。

- [x] Step 7 — **C4 consumerのGreen**。対象: Step 6と同じ。client.tsを実装。既存WorkspaceClientを構成利用し、比較参照POSTのread-errorと更新unknownを区別する。全snapshotのruntime/選択整合検証、GET有限再試行、owner/選択世代、1〜20社と各種限度を確認。新API/DB/repository/schemaは作らない。

- [x] Step 8 — **C4 consumerのRefactor**。対象: Step 6と同じ。API fakeと実PG groupを再実行してgreenを保持。隔離schemaをfinallyで閉じる。既存U1 sourceを変更しない。

- [x] Step 9 — **状態・欄別保存・出力制御のRed**。対象: US8.1/US9.1、共同US6.3、BR4/5、NFR2/3。session.test.ts最低12件、edits.test.ts最低16件、export.test.ts最低12件を先に実行。owner/選択/input世代、別欄独立、同要求unknown、明示rebase、commitとGET失敗、送信後追加入力、保存/unknown後の往復・remount、出力確認中変更でfile0を含める。

- [x] Step 10 — **状態・保存・出力制御のGreen**。対象: Step 9と同じ。session.ts/edits.ts/export.tsを実装。browser app instance内store、SSR共有なし。欄別base/draft/frozen intent/outcomeを表示mountと分離。同body/ID再送・committed結果保持・最新を別取得。dirty/pendingは出力阻止、毎クリックC3全版/世代照合、表示と同snapshotから1ファイル。

- [x] Step 11 — **状態・保存・出力制御のRefactor**。対象: Step 9と同じ。model/client/状態groupと実PGの該当結合をgreenに保つ。known U1/U2問題を本Unit完了と誤記しない。

- [x] Step 12 — **画面と共有入口のRed**。対象: US8.1/US9.1、共同US1.1/1.2/3.1/6.3、NFR5。ui.test.ts最低16件を先に実行。新/旧入口、候補page・終了企業/構造なし、1社1メモ、各欄保存とエラー、old owner late拒否、dirty取消、往復後committed/unknown保持、PC/mobile同じ順、label/status/focus契約。callback/SSRを実DOM証拠としない。

- [x] Step 13 — **画面・共有接続のGreen**。対象: Step 12と同じ。6新比較componentと既存4共通fileだけを接続。app/layoutのapp instance Providerでstore寿命をrouteより上に置く。WorkspaceShellへU3 owner/失効/dirty判定・破棄確認を接続し、既存U1の入力と本人境界を維持。新比較を標準、旧比較は同画面の明示入口。旧CompanyComparePageは安全な読取/更新adapter接続だけ。

- [x] Step 14 — **画面のRefactor・既存回帰**。対象: Step 12と同じ。U3 UIと既存U1 UI/旧比較/生成・復習の関連回帰を確認して整理。既存assertionを弱めない。承認範囲外の問題は未達として記録。

- [x] Step 15 — **手順・画面確認helper・資料**。対象: US8.1/US9.1、NFR6.4/7.1。docs/company-comparison-local.mdとscripts/check-u3-comparison.mjsを作成。既存Edge/CDP/ローカルpreview・dummy Auth・PG手法を再利用、新依存なし。helper構文検査と意図的失敗がexit1になる自己検査を行う。説明文書/純構成には人工Redを作らない。

- [ ] Step 16 — **実画面・HTTP・性能確認**。対象: US8.1/US9.1、共同AC、NFR1〜7。下のManual Acceptance全行を架空fixtureで確認。helperは専用preview/Edge/一時profile/隔離schemaだけを所有しfinally cleanup。native200/400と模擬viewportを分離。HTTP比較p95のローカル参考計測条件を守り、実Supabase達成と称さない。失敗は対象の本物のRedから同範囲で修正し回帰。

- [x] Step 17 — **最終品質確認**。対象: NFR6.3と全担当AC。npm run lint、npm run typecheck、npm test、npm run build、npm test -- --passWithNoTests=false --coverage、git diff --check。全app/src lines>=80の設定/対象を維持。修正があれば関係する確認を再実行。実CI/実Auth/公開未実施を分離。Docker自体は変更しない。

- [x] Step 18 — **差分自己review・Step5成果物**。対象: 全担当AC/BR/NFR。実変更だけのsource-manifest/fingerprint、baselineとの所有差分、code-summary/traceability/TDD/manual/verification記録を作成。全90ACをU3対応/他Unit範囲に追跡し、17BR・30NFRを漏らさない。pending修正や誤った成功宣言がないことを自己reviewし、正式reviewへ渡す。

## Test Strategy and Exact Commands

Standardの各部品5〜8基礎例に境界例を加え、9file最低103件を計画する。8以上は上限ではない。既存全468件を基準に回帰し、既知の受入未達をその件数で覆い隠さない。

| Group | Exact command / condition |
|---|---|
| runtime | Node22.23.3を既存ローカル環境からprocess PATHへ選び、node --versionとnpm --versionを確認。Node/依存の再インストールやpackage編集は不要 |
| readiness | npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false |
| model/legacy | npm test -- tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/legacy.test.ts --passWithNoTests=false |
| C4/実PG | npm test -- tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false |
| state/edit/export | npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts --passWithNoTests=false |
| UI | npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false |
| U3 exact all | npm test -- tests/u3-company-comparison/readiness.test.ts tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts tests/u3-company-comparison/legacy.test.ts tests/u3-company-comparison/ui.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false |
| helper | node --check scripts/check-u3-comparison.mjs、node scripts/check-u3-comparison.mjs --self-test、node scripts/check-u3-comparison.mjs --self-test-failure（意図的exit1）、node scripts/check-u3-comparison.mjs |
| local DB setup | docker compose -f compose.test.yml up -d --wait。既存使い捨てPG17・localhost/workspace_testのみ。人間のDBや既存volumeを消さない |
| final | npm run lint / npm run typecheck / npm test / npm run build / npm test -- --passWithNoTests=false --coverage / git diff --check |
| checkpoint | 登録済み npm test -- --passWithNoTests=false を公式checkpointでそのまま再利用。コマンドを変更しない |

Node22環境のPATH準備はprocess-localで行い、機械固有の絶対pathや秘密を文書/commitに保存しない。npm wrapperのcache更新は正式source review中には行わない。review後にsource/producesを無断編集しない。

## Manual Acceptance

実fixtureは本人A/B、同名別IDの2社以上・各複数メモ・本文のみメモ・manual/dummy/openai保存値・異なる7観点・Web全metadata・null/undecided志望度・理由・終了企業・長文/危険文字を含む。openai値のfixtureは実API実行の証明ではない。

| ID | 操作 | 期待/記録 |
|---|---|---|
| M1 | 本人ログイン→保存企業を比較、企業・メモ選択、追加page、0/1/20/21社 | 終了企業も候補、各社1メモ、選択順、0と失敗/構造なしを区別。社数・保存件数を変更しない |
| M2 | 同社メモ切替、構造化項目を別clientで更新→再取得、本文のみ修正 | 7観点/理由は選択メモから、企業志望度は同じ。本文から事実を補わず保存版が更新 |
| M3 | 志望度と理由を別保存、一方拒否、送信後に追加入力 | 対象欄だけ変更、片成功を独立表示、入力保持、成功後GET失敗で再保存を促さない |
| M4 | 更新応答を途絶→照会/unknown同要求再試行、保存→画面往復/再mount→戻る | 同ID/body、重複書込なし。unknown/committed結果と追加入力を保持、単なる往復で新ID/新要求なし |
| M5 | 別client変更→旧版保存→最新確認→明示rebase | 元base/draftとlatestを同時に確認、入力破棄や自動mergeなし。本人操作で新意図 |
| M6 | 比較出力、確認中に構造/志望度/理由を別client変更・メモ/企業削除・401・遅延・不正・途中入力 | 全選択company/memo版と世代確認、変化/失敗は.md0。changedは最新表示→再クリック。同じsnapshotの順/7観点/出典/出自/志望度/理由と出力が対応 |
| M7 | 未保存/unknownのまま出力、選択変更取消、通常route往復/失効A→B→A | 出力阻止、取消でfocus/入力/選択保持、別ownerへ保護内容を出さない。同本人は最新確認後の明示復旧 |
| M8 | 明示旧入口で正常/破損混在/読取不能/0件、旧の従来編集/出力 | 正常形式とfallback ID/日付を維持。元データ自動変更/削除/移行/サーバー送信なし。不正を落とす書込は止める |
| M9 | PC1366×768、mobile390×844、320/767/768、native200/400、長文/危険HTML/URL | 選択/比較/保存/競合・unknown/出力/旧入口へ到達。native zoomは実browser/CSS幅/DPR/対象tabを記録しviewport模擬と分ける。文字実行なし |
| M10 | Tab/ShiftTab、入口/通知/入力/破棄取消 | 入口h1、入力/再取得/保存時にfocusを奪わない。label/statusとPC table/mobile観点順、到達可能scroll、取消focus復帰 |
| M11 | 100企業/1000メモ/10000操作・20社比較の実HTTP参考測定、idle観測 | warmup5後2client×50、p95/最大/失敗/fixture bytes/DB size/対象版/環境を記録。APIp95≤2秒目標、DB200MiB予算。cold/認証は別、idle追加API0 |
| M12 | 既存単発生成・企業詳細/本文・構造編集・本文/復習.md・旧比較回帰 | 認証後の既存導線と出力を維持。全受入/既存問題解消とはしない |

helperはlocalhost限定、専用port/preview/profile/Edge/隔離schemaの所有とcleanupを確認し、既存serverや別DBを停止/削除しない。実画面は一度の失敗後に対象の原因を切り分け、同じ無根拠な確認を反復しない。成功したDOM/callbackやemulationをnative画面合格へ代用しない。未達はStepを未チェックのまま残し、原因/限界/後続を記す。

## Acceptance Traceability

| 担当範囲 | AC/BR/NFR | Steps / evidence |
|---|---|---|
| 保存比較と比較.mdの主担当 | AC8.1.1〜5、AC9.1.2/.4/.5、BR2/3/5/6 | 3〜18、全group、M1/2/6/8/9/10 |
| 本人・別owner・別client | AC1.1.1〜4、AC1.2.1〜4、BR1 | 6〜14/16〜18、client/session/実PG/UI、M7 |
| 志望度・情報区分・参照 | AC2.2.1/.2/.5、AC3.1.4/.5、AC5.2.1〜5、AC7.1.1、BR3/4 | 3〜14/16〜18、M2/3/6/9 |
| 競合・削除参照・復旧 | AC6.3.1〜4、AC6.4.3、AC6.5.2/.4/.5、BR4/5 | 6〜14/16〜18、M4/5/6/7 |
| 品質/画面/容量 | U3 NFR1.1〜1.5、2.1〜2.7、3.1〜3.3、4.1〜4.4、5.1〜5.3、6.1〜6.4、7.1〜7.4 | 上流30件を全groupとM1〜12へ引き継ぎ、Step18で全IDの実証/未達を記録 |

ACの設計対応は機能設計traceの35件、他Unit55件を維持する。共同条件は本Unitの比較部分だけを示し、単独で全90件達成としない。実行前の件数・手順は予定であり、実施記録ではない。

## Carried Findings and Release Limits

U1の競合draft破棄・復元session復活・ロック待ち後削除期限、U2の保存後往復による同候補重複保存・native200%入口未確認、既存dependency auditは未修正/未達。U3で同様の不備を防ぐ試験を追加しても、凍結済みU1/U2の修正証明としない。必要な修正は正式なBuild-and-Test loop-back等へ持ち越す。

実Supabase/Auth/鍵、実CI、公開/対象merge SHAは未確認。本人担当Vercel/デプロイを行わず、今回のローカル完了と区別する。PR/人間mergeはリリース全体の後続であり、本計画承認はその代行ではない。

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

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[モデル](../functional-design/entities.md)、[画面責任](../functional-design/frontend-components.md)、[90AC設計対応](../functional-design/traceability.json)。
- [NFRの対応](../nfr-requirements/traceability.json)、[NFR設計](../nfr-design/logical-components.md)、[安全設計](../nfr-design/security-design.md)、[信頼性設計](../nfr-design/reliability-design.md)。
- [Unitと共有変更境界](../../../inception/units-generation/unit-of-work.md)、[担当AC](../../../inception/units-generation/unit-of-work-story-map.md)、[共有契約](../../../inception/contract-design/contract-summary.md)、[要件](../../../inception/requirements-analysis/requirements.md)、[Bolt上限/検証](../../../inception/delivery-planning/bolt-plan.md)。
- [引継ぎ](../../../../../../../../docs/session-handoff.md)。既存ソース・設定・試験補助を読取確認した。今は計画だけでアプリsource/テスト/helperは未変更。
