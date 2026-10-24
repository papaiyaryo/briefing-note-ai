# U1 COMMIT期限試験 — 改訂2の実行証拠

## 開始・所有baseline

公式tool briefのU1 target/Testing Contract `a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440`と改訂2の8Step・instructions、新rules全文を読了して着手。旧20Stepは再実装しない。

branch `release/bolt-002-company-data-management-local`、HEAD `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`。開始時204既存source/configのbytes hashと旧U1 manifest91claimsを[baseline](deadline-repair-baseline.json)へ保存した。既存dirty/untrackedを保全し、今回の唯一のアプリ側変更はroutes.test.tsの当1case/importに限定する。

修正前target bytes SHA256: `93a94a79166eea5e8bb594b812cb00d8c721aa575cf78f4d9f9ad933c9dc6989`、root確認値と一致。U2の41source NUL/LF aggregateは `53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8`、U3の29source colon/LF aggregateは `c567f1d4ff8637a9e10d97f133d679aa46eb97801cbe0752c048a3a3c777d5ae`で凍結値と一致。後続Unitの共有変更は開始時bytesとして区別し、旧U1実績を新結果へ流用しない。

## Step2 runner/PG準備

Node22.23.3/npm11.6.1、既存依存/Vitest4.1.8。process-local PATHだけを使い、依存/config/CI/coverageは変更しない。

`npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false`

1file/24passed・skip0・exit0。これはrunner readinessでapp Redではない。

既存loopback workspace_testのPG preflightはexit0、PostgreSQL17.6、app role rolsuper=false/rolbypassrls=false、所有random schemaのUSAGE確認成功、専用schema drop=true。ignoredローカルscriptだけで秘密/本文は出力しない。他schema/DB/volumeを削除していない。

## Step3以降

`npm test`を修正前に1回だけ実行。54files/587tests中586passed/1failed・exit1、skip0、対象caseだけexpected operation_unknown/actual unavailable（63ms）、routes.test.ts:262。全体24.78秒。runner/収集/準備や他caseの失敗ではなく、指定source hash93a94a...の既存期限試験の実Redである。失敗待ち反復/偽Redなし。

[修正前targetの内容とhash](deadline-repair-target-before.json)も保存し、当case/import以外が変わらないことを最終比較できるようにした。既存U3記録の同じ失敗は履歴で、今回1回の実結果と区別する。

## Step4 Greenと試験制御の補正

`npm test -- tests/u1-company-notes/routes.test.ts --passWithNoTests=false`

初回の制御transport試験は18passed/1failed・exit1。COMMIT/afterCommit到達と40ms経過は観測できたが、外側のtest contextでfake timerを進めるとtimer callbackが元requestのAsyncLocalStorage contextを保持せずunavailableになった。これは試験制御の不整合で、productionの新Redではない。

同case内の実WorkspaceDatabase.afterCommitで開始するasync continuationがadvanceClock barrierを待ち、その元request scope内からvi.advanceTimersByTimeAsync(40)を実行するよう補正した。test側はCOMMIT/afterCommit到達と拒否観測登録を済ませてからbarrierを解放する。classification/transaction/requestScope自体のstubなし。afterCommitは別barrierで保持し、finallyで全barrier解放、残continuation回収、pool.close、release一回、timerゼロ、時計復元をassertする。待機にはcaptured native timerの有限watchdogを使い、契約40msは延長しない。

補正後同exact commandは1file/19passed・skip0・exit0（4.45秒）。他18caseと独立した実PG健康確認を保持。制御transportだけでRLS/原子性/実COMMIT応答途絶の成立とは主張しない。

## Step5 Refactor / Step6 実PG

既存Prettierで対象fileだけ整形（exit0）。同じfocused exact commandを再実行し1file/19passed・skip0・exit0（4.55秒）。import以外の先行18caseは修正前内容とLF正規化後一致することをrootも読取照合した。

`npm test -- tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/routes.test.ts --passWithNoTests=false`

実結果は3files/40passed・skip0・exit0（16.47秒）。計画の39件見込とは区別する。database.integrationが既存operationalCasesもimportするためであり、今回case追加はない。制御transportの1caseと残39件を分離し、実PG原子性、RLS、実COMMIT応答途絶後の別接続照会、HTTP unknownと同ID確認、COMMIT前取消を保持した。

group終了後のread-only診断は専用schema0、DB clients空、preview3000/CDP9224応答なし・exit0。自分の接続/schemaが残っていないことを確認し、他者資源を停止していない。

## Step7 最終品質 / Step8 所有と自己review

重い検査を並列化せず順次実行。npm run lint（warning0）、npm run typecheck、npm run buildはいずれもexit0。npm testは54files/587passed・skip0・exit0（27.41秒）。npm test -- --passWithNoTests=false --coverageも54files/587passed・skip0・exit0（30.55秒）、全app/src lines83.50%（2794/3346）。statements81.89%、branches73.11%、functions79.09%。既存include/lines80下限を維持し他指標80を主張しない。git diff --checkはexit0、既存LF/CRLF警告のみ。検査後のread-only診断も専用schema0・DB clients空・preview/CDP応答なし。

開始204fileの所有照合はtargetとroot所有handoffだけが差分。先行18case/production/他test/依存/CI/coverage/U2/U3を保持する。旧summary/traceを履歴保存し、旧reviewed TSV/manifest91claimsは保持。現在94source aggregateと1case差分をsource-fingerprints.jsonに分離した。90AC/23BR/33NFRは削減せず、既知draft破棄・lock後削除期限・session復活を未解消へ明示。今回画面/外部Auth/CI job/公開/実復元を再検証したとはしない。

記録整備のJavaScriptでstructuredClone未定義による停止があったが、アプリsource/検証結果には影響しない。既に適用済みの履歴コピーを重複せず、未適用のmetadata更新だけ再開した。全検証の成功を再試行で作っていない。

最終read-only validatorはexit0・errors0。strict manifest91claimsが開始時のoldU1Manifestと完全一致、展開94fileの現hash/aggregate一致、trace146ID（90AC/23BR/33NFR）保持、summary/evidenceリンク欠落0。先行18caseはimportを除きLF正規化後完全一致。修正後target SHA256は33733741017a5208c0b8e5f0b1cd5d9b98ec00a1f94338905adeacf1474374c5。U2 aggregate530045…とU3 aggregatec567f1…も不変。validator初回のmanifest-history表示はbaseline key名の誤参照、U3算式はno-final-LFの見落としで、読取検査側を訂正し元の算式で一致確認した。アプリsourceの不一致ではない。

自己reviewで制御transportの範囲、40ms/unknown期待、先行拒否観測、COMMIT一回、finally解放/時計復元、実PG独立証拠、所有差分と既知未達を確認した。改訂2の8Stepを完了checkboxへ反映し、アプリsourceと本Step5成果物を書き止めた。正式review/公式完了は未実施。
