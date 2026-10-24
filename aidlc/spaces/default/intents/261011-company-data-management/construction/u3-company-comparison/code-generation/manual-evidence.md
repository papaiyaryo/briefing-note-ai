# U3 実画面・HTTP証拠

## revision02 — 現在のCUA限定証拠
今回の正本は[manual-revision-02-root.md](manual-revision-02-root.md)。通常save/確定ID、409でbase/draft/latest分離、メモ/企業削除後404→入力保持/新規保存/出力停止、対象別企業確認だけの解除をCUAで確認。PC幅1905と限定Tab/ShiftTab/Enterだけを実観測。mobile/native倍率、明示rebase再保存・別企業保存・route/download等は未確認、Step9は未チェック。旧CDP/native幅の履歴を現在の確認へ流用しない。3専用previewは停止true/schema削除true/exit0、ownedtabs閉鎖。

## 以下はrevision01以前の実画面・HTTP履歴

## CDP Retry後の現在値

現在のM1〜M12/30NFRの実確認済み・未確認・本人実環境は[現在受入表](manual-acceptance-status.md)、個々のcommands/exit/失敗原因/cleanupは[CDP Retry証拠](cdp-retry-evidence.md)を参照。CDP技術停止は解消し適用可能なlocal補完を実施したが、実B/A→B→Aは未確認でStep16未チェック。下の「未到達」は当時の履歴であり現在表を上書きしない。


## U1改訂2後の補完履歴（今回Retry前）

今回の記録は[再開証拠](post-u1-resume-evidence.md)を参照。既存全flow/性能/nativeの反復を避け、切替だけの有限診断と未到達Mだけの独立区間を実行した。比較切替後の実C3は503/unavailable（browser265ms/server228ms）、直後の直接C3は200/20sources。本人の明示再取得で保存成功/送信済み値を保持して追加PATCH0で回復した。503原因は未確定、error表示は契約内でありapp Red認定なし。

未到達区間の初回は候補reload完了前に次pageへ進むhelper待機不備。loading解除/次page enabledの有限待機へ修正後、入口h1、M2別メモ/同企業志望度、構造更新/本文分離、M3志望度独立保存/commit後GET失敗/送信後入力保持・出力阻止まで5check成功。その後CDP Runtime.evaluate timeout、process exit1。app不備かhelper/CDPかは未確定で、これ以上反復しない。最後2回の専用preview/Edge/profile/schemaはcleanup全true、preview exit0、errors=[]。

M4 COMMIT直後途絶/実route remount、M6追加不正/期限/遅延入力/削除/各版変更、M7制御401のDOM復旧・実Bを含むA/B/A、M8正常/混在/読取不能、M10scroll等は未到達/未確認を維持。M9各幅での全エラー操作とM12企業詳細の実操作も未確認。以前のunit/実PG/native証拠と区別し、Manual全行合格にしない。Step16未チェック。

一回の診断ではpreview exit1/stop報告false（schema/Edge/profile true）だった。終了後、既知専用PIDなし/schema0/DB clients空/3000・9224応答なしを別途読取確認した。その回を総合cleanup成功へ書き換えない。通常helperの全flow29check/exit0は以前のsourceの履歴であり、現在helper全flow成功とはしない。

以下は以前の実行履歴。新しい結果で過去の失敗を取り消さない。

## 方法と未達の扱い

既存Edge/CDP、Node22.23.3、ローカルdummy Auth/provider、隔離PostgreSQL17.6。headlessの実アプリ操作であり、Vitest SSR/callbackとは分ける。native zoomは専用profileのbrowser設定と新しい非emulated tabのCSS幅/DPRを実測し、viewport模擬と区別する。fixtureは架空100企業/1000メモ/10000操作、生成出自は保存値fixtureで実API実行の証明ではない。内容・Cookie・鍵は証拠へ記録しない。

`node scripts/check-u3-comparison.mjs`を使う。自己検査は構文exit0/self-test exit0/self-test-failure意図的exit1を先に確認した。setup/helper失敗をapp Redへ加えない。以下は実施済み部分だけで、M1〜M12全条件達成の宣言ではない。

## 初回 setup失敗

CDP Page.enableが15秒でtimeout、アプリ操作前・results0・helper exit1。schemaDropped=true/EdgeStopped=true、previewStopped=false。初回をcleanup成功へ読み替えない。

sandbox内CIMはAccessDenied。安全なrequire_escalated読取で専用local-workspace-preview helperとport3000専用Next引数に一致するprocessは0件だった。推定PIDによるkill・他server操作なし。以後は停止確認後に再起動する。

## 2回目の有限診断

sandbox外の同helperでCDP message244（response207/event37）を確認、14check成功。sandboxとの因果は断定しない。競合rebase保存後の自動再取得中にhelperがdisabledの再取得ボタンを押そうとしてexit1。完了状態の待機不足でありapp Redに数えない。専用preview/schema/Edge cleanupすべてtrue、preview exit0・stop報告true。既存DB/volume/他processは変更しない。

成功した部分: h1初期focus、未選択の出力阻止、1社の7観点/未記載/要確認、同名別IDと終了企業、2秒idle API追加0、危険HTMLをtextとして保持、入力中focus維持、理由拒否時の入力保持、unknown照会後の同ID/body再試行、保存参照とWeb/provenance対応の.md、別client版変更時file0、比較POST失敗で操作照会0、競合base/draft/latestの別表示。

M1の20/21社や複数ページ、native200/400で保存/出力/旧入口、既存本文/復習.mdはこの回では未到達。存在だけの確認を操作成功へ読み替えない。helperをenabled完了状態の有限待機へ訂正し、これらの追加操作を次の有限実行で確認する。

## 実TCP HTTP参考性能（2回目）

100企業/1000メモ/10000操作、20社一貫比較。warmup5後に2client×50回。p95 554.79ms、最大700.09ms、失敗0。初回参考896.80msは別。fixture UTF-8 JSON7,894,886bytes、DB全体15,322,259bytes。PostgreSQL17.6/x86_64 Alpine、Node22.23.3、Windows10.0.26300、loopbackで測定。対象HEAD df63c09be502bf5c9e50b58a69e2bacea5c39bc5＋U3 working tree。最終source hashはStep18に別記する。

p95≤2秒/DB≤200MiBのローカル参考条件はこのfixtureで成立。実Supabase/本番・通常外部ネットワーク・cold start/休止復旧・初回認証の達成は未確認。handler直接試験とは区別する。

## 3/4回目の限定実行と現在値

3回目は28check成功/1helper条件失敗、process exit1。20社選択へ拡張したのに同名2社のcheckが旧`length===2`のままだった。アプリ不備とは数えない。該当2企業の実ID包含へ訂正し、他の社数前提も局所点検した。

4回目は29/29check成功、ただしprocess exit1。Edge155.0.4283.62/protocol1.3、Windows10.0.26300、Node22.23.3。専用previewStopped/schemaDropped/edgeStoppedはすべてtrue、previewExitCode0/signal null/previewStopReported true。profile除去の確認はこの出力にはなく、finallyのEdge停止/profile除去catchのどちらがexit1を設定したかは未特定。profileロック等を確定原因としない。

最後にfinallyへ段階/エラーcodeだけの診断と専用profile除去の有限retryを追加した。rootの停止指示により未再実行。29check成功をhelper総合exit0へ読み替えない。実画面後のU3本人世代catch修正もブラウザでは未再確認である。

native browser zoomは専用profile設定・新しい非emulated tabで基準幅1342/DPR1、200%幅671/DPR2、400%幅335/DPR4。両倍率で理由保存→最新表示→比較.md1件→旧入口を実操作し、horizontal overflowなし。1366/390/320/767/768の別結果はviewport模擬で、各幅で全エラー操作を反復したわけではない。既存単発dummy OCR→訂正→生成→本人本文編集→対応本文.md→復習生成→復習.mdも実操作した。64KiB以下の架空2×2PNGだけを使用。

4回目実TCP値: warmup5、2client×50、20社、p95 482.70ms/最大647.59ms/失敗0、cold参考1450.87ms、fixture7,894,886bytes/DB15,338,643bytes。fixture件数/版/環境は上と同じ。3回目p95 420.13ms/最大523.79ms/失敗0は別測定として保持する。

## M行の実操作・単体証拠・未確認

| 行 | 実ブラウザで確認した範囲 | 単体/実PGとの区別・未確認variant |
|---|---|---|
| M1 | 0/1/20/21社、50メモ追加page、本文のみ候補、同名2ID/終了企業、保存100社不変 | 正常/失敗状態の網羅はunit側。件数だけで全エラー状態成功としない |
| M2 | 1社から固定7観点、未記載/要確認 | 同社メモ切替・他client構造変更・本文のみ変更の連続実操作は未確認。model/実PGの対応は別 |
| M3 | 理由拒否と入力保持、理由保存後表示 | UI志望度保存・送信後追加入力・commit後GET失敗は実画面未確認。edits単体/実PGで確認 |
| M4 | dispatch前unknown→同ID/body照会/再試行、committedの新旧画面投影往復で追加write0 | commit直後応答途絶・unknownのroute remountは実画面未確認。unit/実PGと区別 |
| M5 | 他client理由変更→旧版競合→base/draft/latest別表示→明示rebase保存 | 実画面確認済み範囲 |
| M6 | 対応.mdとmetadata、他client企業版変更file0→再確認出力、比較POST失敗で操作照会0 | 構造/理由版変更・削除・401・遅延・不正・確認中入力のDOM連続操作は未確認。export/client/実PGで別確認 |
| M7 | 未保存移動Escape取消で入力と起動元focus保持 | unknown/失効A→B→A/明示復旧の実画面操作は未確認。session/edits/UI callbackで別確認 |
| M8 | 明示旧入口0件、移行なし | 正常編集/出力・破損混在・読取不能はlegacy/UI単体。実画面では未確認 |
| M9 | 各viewport overflow、危険HTML text、native200/400の保存/出力/旧入口 | nativeで競合/unknownを反復していない。URL境界はmodel単体。全操作/全幅達成とはしない |
| M10 | 初期h1、入力中focus、Escape取消/復帰 | Tab/ShiftTab wrap・scroll領域キーボード到達の実操作は未確認。UI callback/SSRを代用しない |
| M11 | 指定量の実TCP参考性能、2秒idle追加API0 | 外部/実Supabase/cold認証は未確認 |
| M12 | 共通入口、単発生成編集本文.md、復習.mdの実操作 | 企業詳細/本文/構造編集は全suite内の既存回帰成功範囲。今回ブラウザ未操作 |

以上よりManual Acceptance全行の全条件は未完了、Step16を未チェックのまま残す。setup/helper失敗・実DOM成功・unit成功・未実施を分ける。専用プロセス/schemaは停止済み、他者資源のkillやDB volume削除は行っていない。

## 公式Retry後の最新実行

cleanup診断では29check成功・exit1でowned-edge-stop/code128、ただし最終edgeStopped/profileRemoved/previewStopped/schemaDropped=trueを観測。所有child exit通知を有限待機する最小helper修正と両境界の自己検査後、29/29check成功・process exit0、すべての専用cleanup true、edgeStopFailed=false/errors=[]を確認した。過去exit1を遡って成功へ変更しない。

その成功回の実TCP p95 616.30ms/最大929.48ms/失敗0、cold参考1518.68ms、fixture7,894,886bytes/DB15,617,171bytes。条件はwarmup5→2client×50/20社、同じPG17.6/Node22.23.3/Edge155。native200/400の理由保存/比較.md/旧入口と、既存単発本文/復習.mdを再実操作。viewport模擬と別に記録する。

次のM補完は25check成功後、追加入力破棄→旧/新比較切替のready待機でexit1。追加成功は次の範囲。

- M2: 同社別メモの理由と共通志望度、別clientの構造更新→再取得、本文だけ更新しても構造/7観点を補完しないことを実HTTP/DOMで確認。
- M3: 志望度changesだけでMemoが不変、COMMIT後GET失敗でも保存成功を保持、送信値の実DB取得と送信後追加入力の保持/出力阻止を確認。
- M10: 未保存ダイアログのShiftTab末尾wrap/Tab先頭wrapをtrusted CDP keyで確認。

最小診断はHTTP100回計測等を省き20社/当欄の送信・追加入力・切替だけを再現。before-switchはserver=true/ready=false/loading=false/readError=false/requests52。破棄後legacy=true/server=false。再入口後legacy=false/server=true/ready=false/loading=false/readError=true/login=false/requests56。単に旧画面に留まったという仮説はこの観測に合わない。HTTP失敗/取消し/世代などの原因は未確定、app Red認定/修正はしていない。診断はfull acceptanceを意図的に行わずexit1。補完・診断の両方とも専用preview/Edge/profile/schema cleanup全true・errors=[]。

一時診断分岐は解除し通常helperへ復帰、構文exit0。rootの停止指示に従い新しい実行/修正なし。M4のCOMMIT後途絶/実route remount、M6追加の不正/15秒期限/遅延入力、M8正常/混在/読取不能、M7制御401/A復帰、M10 scrollはhelperへ準備したが今回未到達。未実行コードを成功証拠にしない。M6の削除・各種版変更、M9各幅での全エラー操作、M12企業詳細の実操作も未確認。上のM表はこの追加成功範囲だけ補正し、全条件達成としない。

実B authenticated sessionは現ローカルpreviewのWORKSPACE_ALLOWED_USER_IDがA固定のsingle-owner構成では成立しない。凍結Auth/設定を変更せず、別ownerの単体/実PG隔離証拠と実A/B/A DOM確認を区別して保留する。実Auth準備待ちへ戻す意味ではない。
