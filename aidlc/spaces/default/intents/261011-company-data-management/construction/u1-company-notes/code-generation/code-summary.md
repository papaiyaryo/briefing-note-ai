# U1：既知3不具合の再実施結果

## 最新の継続結果 — lint再確認を省略、残り検証は成功

本人の「そこの処理を飛ばして先に移って」を受け、rootの公式resume後にlint再確認を省略して、残りの承認済みコマンドだけを各1回実行した。typecheck、全体test、coverage、build、git diff --checkは全てexit0。全体testとcoverageは各56files/643tests成功・skip0（35.04秒／33.99秒）、全app/src lines85.95%（2962/3446）で80%下限を満たした。詳細とログは[最新証跡](timeout-30s-verification-20261024.md)の末尾に保持する。

以前の対象52件／U1 261件成功と独立lintの25 errors／40 warningsを保持し、これらは再実行していない。外部の.claude除外変更の効力は未検証。独立lintの最新結果は失敗であり、品質全体の合格とは扱わない。Step4/5は未チェック、review／正式checkpointはroot所有で未実施。以下の停止記録はその時点の履歴として読む。

traceabilityの該当証跡を追記し、146 IDsと既存status／Deferredを維持。source-manifestは今回の2 test filesを含む累積対象を保持し、新しいapplication sourceの追加／変更／削除は本継続ではない。旧TDD・GUI記録・未完了B1・実環境／性能受入の限界は維持し、30秒機能回帰の成功を性能原因解消としない。

## 改訂6の最新状況 — 30秒待機予算と停止結果

以下の既往実装・検証履歴は保持する。最新の承認済み改訂6では、uiCallbacks.tsxの実HTTP/PG latest取得1件、restore.integration.test.tsの復元session拒否2件のit第三引数だけが30000になっている。assertion、製品期限、fixture、並列、依存や本番処理の変更は行っていない。設定変更なので人工TDD Redは非適用。

[最新証跡](timeout-30s-verification-20261024.md)に、schema24件成功後のDocker権限失敗、および本人Retry後のDocker準備成功を保持した。継続では既存Node22・dummy localhost DBを使い、対象2files/52tests、U1 exact17files/261testsが全成功（skip0、exit0）。既存fixtureLifecycleも含め、cleanup失敗の報告なし。

続く`npm run lint`はexit1、65 problems（25 errors /40 warnings）。.claude/tools等のESLint指摘をtimeout-30s-lint-retry.logへ保存し、計画どおり自動修復やRetryをせず停止した。typecheck／全体test／coverage／build／diff checkは今回未実行。Step1/2/3のみ完了、Step4/5とreview／正式checkpointは未完了。下記の旧全体検証・coverage・source hash一致は過去時点の証拠であり今回の再測定ではない。

146 IDsと既存Deferredは変更していない。30秒以内の機能成功から性能原因解消やp95達成を推定しない。性能調査、未完了B1の所有識別／子exit回収、GUI／U2/U3／実環境／CI／公開受入の未完了事項を保持する。既存source-manifestの累積対象に今回の2 test filesも含まれており、成功時のStep5確定作業はまだ行っていない。

## 変更と実装判断

承認済み[計画](code-generation-plan.md)と[試験手順](unit-test-instructions.md)に従い、既存の3修正を保持して再検証した。今回、アプリ・テスト・設定・依存・制限時間・期待値を変更していない。既存dirtyとU2/U3の実装を保持した。

- CompanyDetailと編集部品は、競合後の元draft/baseを最新保存版と分ける。明示した再編集まで再保存を止める。
- repositoryは親ロック取得後にも削除確認期限を検査し、期限後を拒否する。成功操作の先行照合とロック順は維持する。
- 共通の復元SQLと復元scriptは、通常dumpからsession行を除外し、古いdumpを含め復元後・再開前に全sessionを除去する。企業・メモ・操作履歴は保持する。

実際に変更して修正した時点のファイル・判断・TDDは[前回summary](code-summary.before-redo-20261022.md)と[修正証拠](bugfix-evidence.md)に保持する。今回の成功結果を、新たにRed→Green実装した証拠とは呼ばない。既に正常なコードを意図的に壊して人工Redを作っていない。

## 今回の検証

実コマンドと失敗履歴は[再検証記録](restart-verification-20261022.md)。

| 対象 | 結果 |
|---|---|
| runner | 24/24、exit0 |
| 初回全体baseline | 632/635、既存5000ms timeout3件、exit1 |
| 本人Retry後の同条件全体 | 635/635、55files、skip0、26.41秒、exit0 |
| Repository / Restore・Auth / Frontend | 15/15、50/50、59/59、全exit0 |
| U1 exact16files | 253/253、skip0、exit0 |
| 実dump/restore | session除去、データ/DDL一致、RLS、専用cleanup成功 |
| lint / typecheck / build / tracked diff | 全exit0、build18/18 static生成 |
| 全体coverage | 635/635、skip0、exit0、24.67秒 |

全app/src lines **85.98%（2963/3446）**、statements84.36%（3135/3716）、branches76.13%（2105/2765）、functions82.42%（769/933）。既存の計測対象と80%行下限を維持した。旧85.95%や84.69%の転記ではない。

初回3件はrestore.integration.test.tsの2件とuiCallbacks.tsxの実HTTP/PG最新取得1件の5000ms timeoutだった。本人のRetry後に同条件で成功したが、原因や再発しないことは証明していない。元の40ms/operation_unknown回帰も変更していない。

## 画面確認と計画との差

[今回の画面記録](manual-restart-20261023-root.md)で、企業・メモそれぞれの2画面競合→最新取得→元入力と最新値の別表示→Enterによる明示再編集→保存200→別画面の最終値一致を確認した。限定したShift+Tab操作で最新取得入口へのfocus到達も確認した。

viewport設定は390×844を要求しても実測2560×1261のままで、今回のスマホ確認は未達。制御された最新GET失敗後の入力保持/追加PATCHゼロもGUIでは未実施。Step10は未チェックを維持し、単体・実PGの成功を全GUI受入へ置き換えない。専用preview4区間は全てexit0・専用schema削除を確認し、専用tabs閉鎖/viewport reset済み。

Step2・5・8のRedは前回の有効な履歴だけで今回新たに実行していないため未チェックを維持した。既存TDDと今回の再検証を区別した差であり、未実装のstubを残した意味ではない。Step1・3・4・6・7・9・11は今回の再検証に対応する。

## 追跡・ソース同一性

[source-manifest](source-manifest.json)の93claims/展開96filesと[source-fingerprints](source-fingerprints.json)を保持。GUI後も96filesの記録hashと現在bytesは全一致。U2の41files、U3の29filesも不一致0。[開始時点の照合](restart-source-check.md)と併せ、今回の新しいアプリ差分がないことを確認した。

[traceability](traceability.json)は146 unique IDs（90AC/23BR/33NFR）、119 OK/27 Deferredを維持する。今回直接再検証したAC6.3.2・BR6.6・NFR2.6に証拠の注記を加え、Deferredを合格へ引き上げていない。各OK targetは既存の実装/試験ファイルを指す。

## 残る限界

実Supabase/PostgreSQL17.11、本人Auth、実B切替、外部API、実CI・merge SHA・公開受入は未確認。Vercel作業は本人担当。既存dependency auditのhigh5/critical1は未対処で、依存更新・リスク受容は追加していない。ローカル検証の成功は全体受入・リリース完了ではない。U2/U3の本人受容済み未解決事項はU1から修正していない。

