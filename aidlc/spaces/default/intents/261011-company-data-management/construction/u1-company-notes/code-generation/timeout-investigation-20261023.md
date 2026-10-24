# U1：実PG試験タイムアウトの調査記録

## Authority and Scope

本人がU2の同条件Retry再発後に「U1の調査・修正計画へ戻す」を選び、再開を指示した。公式操作でU2をset-asideし、U1のCode Generationだけを再開。改訂4の7ステップ計画と試験手順を保存し、本人のApprove Planを公式log answerで記録した（exit0）。その後のrun-stageはu1-company-notes、plan_approval approved。

アプリ・設定・上流設計・U2/U3を変更しない。5000ms test上限、UI4000ms waitFor、40ms unknownと元の期待値を保つ。試験補助の原因が特定された場合だけ、承認範囲内のTDD修復へ進む。原因未特定や製品側の修正が必要なら次案を本人へ返す。新しい診断失敗を旧3修正のRedにしない。

## Prior Reproductions

| 時点 | 全体結果 | AC6.3.2 latest/draft | 復元後別session拒否 | Vitest |
|---|---|---|---|---|
| U2 Step8 初回 | exit1、633/635、53 files成功/2失敗 | 5033ms | 5031ms | 47.44s |
| 本人の同条件Retry | exit1、633/635、53 files成功/2失敗 | 5056ms | 5041ms | 44.86s |

両方Error: Test timed out in 5000ms.。対象はtests/u1-company-notes/ui.test.ts→uiCallbacks.tsx:577とrestore.integration.test.ts:90。原因は未特定。U1の以前の635/635成功やU2単体140件・生成回帰82件、lint/typecheck成功を、今回の全体成功や再発解消に読み替えない。

## Static Findings Before Execution

runtimeFixtureは試験本文内でsetupDatabase・Pool生成・初期login/authenticateを行う。setupDatabaseは共有bootstrapと各専用schema migrationを行い、bootstrapには共有advisory transaction lockがある。UI対象試験はfixture後に実Repository準備と同一プロセスHTTP handlerを通す取得を行い、4000ms waitForで保存版一致を待って元draft/baseを照合する。Restore対象は旧dump行の復活対照と同じ運用SQL適用後の拒否を検証する。これらは候補箇所であり、待ちの因果や製品不備を証明していない。

## Current Execution

承認済み公式testing-posture brief全文と完全rulesを渡し、U1専任の開発担当へSteps1–6を依頼した。rootは同時にテスト/build/previewを起動しない。実コマンド・段階経過・Red/Green/Refactor・cleanupは実際の報告に基づき追記する。Step7の成果物と正式レビュー・checkpointはrootが扱う。現時点で調査成功や修復完了を主張しない。

### Step 1 — Runner and Baseline

実行開始前に公式UNIT_STARTEDを2026-10-23T14:30:41Zで記録（exit0）。担当はその受領前にはreadiness/test/変更を行っていないと報告した。HEAD df63c09be502bf5c9e50b58a69e2bacea5c39bc5+dirty、U1の93claims/96files、U2の41、U3の29を読み取り再確認。

runner exact command：npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false。exit0、24/24、skip0、Vitest4.1.8、duration1.80s／shell5.859s。これはpure契約試験であり、実DB正常の根拠ではない。Node v22.23.3、v8/all app+src/line80設定を確認し、Step1だけをチェック。ファイル変更はなし。この成功は対象2件の再発解消を示さない。

### Step 2 — Unchanged Target Runs

- npm test -- tests/u1-company-notes/ui.test.ts --passWithNoTests=false：exit0、46/46、Vitest5.99s／shell8.512s。
- npm test -- tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false：exit0、6/6、Vitest5.15s／shell7.058s。

承認された無変更の各対象1回だけを実行した。実DB正常の根拠はこの実PG試験の成功であり、schemaのpure試験とは区別する。個別成功は全体再発の原因特定／解消や製品Redの証拠ではない。

同条件の変更前全体npm test1回：exit0、55files/635件すべて成功、skip0、Vitest25.96s（transform18.59s/import44.33s/tests127.02s）。集計tests時間は並列処理の合算であり、wall timeと同一ではない。原因未特定のため修復はしていない。承認済み最後の計測付き全体1回に向け、許可された試験補助と該当試験だけに安全な段階observer/経過を追加する。既定の時間制限・実I/O・assertionを変えない。

### Interruption and Resumption

開発担当が使用量上限で中断。2026-10-24の本人の「続けて」を受け同じ担当で再開した。中断時のapply_patch完了を回収し、helpers.ts/runtimeFixture.ts/uiCallbacks.tsx/restore.integration.test.tsの4ファイルに計測が適用済みと確認。最後の実行は無変更の635/635成功で、計測付き全体は未実行だったため、重複実行せずそこから再開した。observerは任意・対象7ケースだけの段階名と経過で、bootstrap.sql/アプリ/上限/assertionは未変更との報告。結果を確認するまでは原因特定や修復成功としない。

上限メッセージには2026-10-24 1:59 AMの再試行時刻が示されていた。再開時に確認した時刻は2026-10-24 03:35 JSTで、本人指示による担当の再開も成功した。過去日付の解除通知予約や別アカウントによる回避は行っていない。

### Step 2 — Final Instrumented Run

承認済み最後の計測付き全体npm test1回はexit1、54files成功/1失敗、634/635、Vitest26.96s。UIのAC6.3.2 latest/draftだけが5021msで既存5000ms timeout。Restoreの失敗はこの実行で再発していない。追加の試験実行や仮説修復は行わずSteps3–6を停止した。

該当ケースの開始からの到達経過：

| 到達段階 | 経過ms |
|---|---:|
| admin接続完了 | 49 |
| 共有bootstrap完了 | 2476 |
| migration完了 | 3048 |
| 初期login完了 | 3594 |
| authenticate完了 | 3648 |
| 対象作成完了 | 3900 |
| 初期read完了 | 4080 |
| latest取得開始 | 4158 |
| 4handler完了 | 4690 |
| latest/draft/baseの元assertion成立 | 4710 |
| pool close完了 | 4713 |
| schema cleanup開始 | 4714 |
| schema cleanup完了 | 完了ログなし |

元の受入assertionは5000ms前に成立し、その後のcleanup中に全case上限へ達したことが観測された。bootstrap区間2427msは実測であり、その内訳がadvisory lock待ちか、重複準備が原因か、接続漏れか、cleanup未完了の理由は今回の計測では特定していない。製品の入力保持が失敗したとは記録せず、試験全体が成功したとも記録しない。pool close完了とschema cleanup成功は別である。

現状は段階の切り分けまでであり、原因に対応する最小修復を選べる因果証拠が不足する。cache導入や上限／assertion／並列変更はしていない。

担当の最終報告と[診断出力](timeout-diagnostic-run-20261024.md)を確認した。計測差分をメモリ上だけ逆適用した4ファイルは変更前SHA256と4/4一致し、元の処理・期待値・制限を保つとの報告。git diff --checkはexit0（未追跡ファイルを含む全体の品質合格ではない）。現在変更は4ファイルの計測追加だけで、仮説修復・新規試験・追加Retryはない。Step1だけチェック、Step2は有限診断を実行したが原因の因果は未特定、Steps3–6未着手。

実行session97377はexit1で終了、進行中sessionなし。pool-close完了まで確認。schema名・接続IDを計測へ出していなかったため今回の専用schemaを安全に特定できず、schema cleanup完了は未確認。別の試験資源へ誤って触れないためDB列挙・削除は実行しなかった。追加調査では必要最小の資源識別とDB待ち状態の観測方法を先に計画する必要がある。U1の正式レビュー・完了承認へは進めず、本人へ次の調査方針を返す。

### Human Deferral and Return to U2

本人は追加調査の提案に「飛ばしていいかな。」と回答し、その説明後「次に進もう」と指示した。追加調査を保留し、原因未特定・後始末未確認を残す判断として扱う。全体合格・U1完成・修復済みという承認には置き換えない。公式操作でU1をU2のためset-asideし、U2を再開した。計測4ファイルと未解決事項は保全し、U1の追加実行・修復は行わない。

### Additional Reproduction and Resumption — 2026-10-24

U2の正式checkpointで登録済み `npm test -- --passWithNoTests=false` を実行したところ、初回はDB接続先のURL解析で失敗（498成功・8失敗・129skip、exit1）。本人のRetry後、検証を呼ぶ作業ディレクトリを記録内のruntime用directoryへ分け、`--project-dir`で同じprojectを指定し、Node22とfixture既定の使い捨てローカルDB接続先をprocess-localに明示した。ソース・期待値・時間制限・登録済みコマンドは未変更。URL解析エラーは再発せず、55filesのうち53成功、633/635、skip0、exit1、Vitest25.86sとなった。起動時のローカル設定読込の影響は候補であり、URL値の注入元を確定したとは扱わない。

この再実行はUIのlatest試験5038msとRestoreの「外部logout失敗でもアプリlogout済みCookieは復元再開後に拒否」5958msで既存5000ms timeout。UIはlatest取得4408ms、元draft/baseの照合4409ms、pool close完了4412ms、schema cleanup開始4413msまで到達した。schema cleanup完了とRestoreの遅延箇所は未確認。修復・全体合格・U2checkpoint承認の証拠ではない。正式proofはtool所有のまま保全する。

本人が再現を主導するため保留を求め、公式parkで保留。その後、本人のPowerShellでNode v22.23.3の出力を確認し、同じ登録済みnpm testを実行したとの会話に続けて、uiCallbacks.tsx:577の同じAC6.3.2試験が5000ms timeoutとなったログを提示した。本人側の全体集計・他ケース・段階時刻・DB後始末結果は提示されていないため推定しない。

本人の「こっちは修正が必要だった気がする」を受けてU1の修正作業を再開。公式report/nextの指示に従ってunparkし、UNIT_RESUMEDを2026-10-24T02:21:57Zで受領した。現run-stageはU1のStep2/7、改訂4のplan_approval approvedである。ただし旧Step2の診断予算は終了しているため、追加実行や仮説修復は行わず、専用資源の識別とDB待ち状態を有限に観測する改訂5計画と手順を準備し、改めて本人のPlan Approvalへ返す。U2のreview済み成果物とGUI未確認は保全する。

### Revision 5 Approval and Execution

改訂5の8ステップ計画・exact手順と改訂4のbackup2つを保存し、rootが内容を再読した。本人が今回の正式Plan Approvalに「Approve Plan」と回答。公式log answerでu1-company-notesのapprove記録に成功し、続くrun-stageのplan_approval approvedを確認した。testing-posture brief全文と現在の全rulesを専任担当へ渡し、Steps1–7の実行を依頼した。rootは同時にtest/build/previewを起動しない。Step8の正式成果物・review・checkpointはrootが担当する。

今回の新診断予算は初回と具体的仮説検証の必要時2回目まで。B1の観測制御をTDDで確認してから実DB観測を開始し、原因を確認できた場合だけ必要なfixture補助のTDD修復へ進む。旧診断を再実行する許可、期待値・5000/4000/40ms・既定並列を変更する許可ではない。実行の到達点と結果は担当の実報告から追記する。

### Revision 5 — Step 1 Runner

専任担当の実報告：`npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false` はexit0、24/24、skip0、Vitest4.1.8、duration1.73s／shell5.482s。Node22 PATH、v8／全app+src／line80設定と、開始時U1 93claims/96files・U2 41・U3 29のhashを再確認した。新候補3fileはこの時点で未作成。Step1だけをチェックする。pure schema契約のrunner成功であり、実DBの正常・診断成功・修復完了の証拠ではない。

### Revision 5 — B1 Red

専任担当の実報告：新しいfixtureLifecycle.test.tsと観測helper骨格を作成後、`npm test -- tests/u1-company-notes/fixtureLifecycle.test.ts --passWithNoTests=false` はexit1、8/8失敗、Vitest1.32s／shell4.580s。対象は今回資源の識別・projectionと子／observerの寿命制御で、収集とimportは成立したうえで未実装の期待が不成立となった。環境・型・実DB障害をRedとはしていない。この時点でfixture修復・DB接続は未実行。B1の最小Greenへ進む。

### Revision 5 — B1 Green

専任担当の実報告：B1の最小実装後、同じfixtureLifecycle exact commandはexit0、8/8、skip0、Vitest1.43s／shell5.922s。scope/identity、秘密とraw出力のprojection、子の成功／失敗、観測失敗、回数／時間上限、観測接続解放失敗の境界が通った。次は実adapterと既存fixture識別の接続、同じcommandのRefactor確認と型検査。この時点のB1成功は制御の試験であり、実DB診断・元fixtureの原因修復・実受入成功を意味しない。

### Revision 5 — Refactor, Typecheck and Startup Failure

専任担当の実報告：B1のRefactor後、同じfixtureLifecycle commandはexit0、8/8、skip0、Vitest1.45s／shell6.120s。`npm run typecheck` はsession47586の最終exit0を回収した。その後、application名の別fixture衝突拒否と終了時exact schema存在照合のadapter変更が追加されているため、この成功を最終bytesの検証に読み替えない。

承認済み初回wrapper `node scripts/u1-fixture-diagnostics.mjs --run first -- npm test` は、process-local PATH指定にもかかわらずNode v24.11.0で起動し、Node22必須guardでexit1（0.708s）となった。guardはrun directory作成・observer接続・子spawnより前にある。DB接続・子npm test・対応表/result.jsonは未生成で、complete/childClosed/observerClosedとcleanup照合は生成前のため非該当。進行中sessionなし。実DB診断の結果・製品Red・原因修復の証拠ではない。追加Retryや仮説修復は行わない。

この時点のsource差分は既存helpers.ts/runtimeFixture.ts/uiCallbacks.tsx/restore.integration.test.tsと、新規fixtureDiagnostics.ts/scriptsのu1-fixture-diagnostics.mjs/fixtureLifecycle.test.ts。bootstrap.sql・アプリ・U3は未変更。U2の累積所有との重複は許可されたruntimeFixture.tsであり、U2成果物を直接編集していない。Step1のみ完了、Step2は最終adapterが未検証のため未完了へ戻した。

rootの静的確認でも同PID別identityの上書き拒否と、child.kill後の有限なclose回収・孫processの未確認を残す必要を指摘した。担当は初回実行中へ変更を追加せず、起動失敗の回収後も修正・実行を止めた。再開時は既存Node22実行ファイルの直接指定、B1内の残る所有／終了制御の修正、同じB1 commandと型検査による現在bytesの再確認を先に行い、未開始の初回診断へ戻す案を本人へ提示する。観測不能を理由に診断予算や試験時間を増やさない。

公式UNIT_PAUSEDを2026-10-24T03:18:00Zで受領した。本人の次の判断まで追加実行を停止する。正式source-manifest／summary／review／checkpointは未更新であり、Unit完了を意味しない。

## Limits and Human Setup

U2の保存後OCR/復習往復と実倍率200%は未確認のまま、U2品質も停止状態を保持。U1の以前の受容済みGUI未確認も維持。今回用preview/作業タブは作っていない。実Auth・Supabase・外部API・CI・merge・Vercel・本番の達成は主張しない。

計画承認前にapproval-mail送信を試みたが、Not configuredでexit1、未送信。本人のパスワード入力を伴う設定処理は実行していない。メール失敗は承認の代替や作業中止理由とせず、実際のセッション内Approve Planだけを承認として記録した。
