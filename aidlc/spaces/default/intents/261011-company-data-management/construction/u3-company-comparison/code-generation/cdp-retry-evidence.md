# U3 CDP Retryの証拠

## 独立区間の確定結果

- M12初回：企業詳細の本文保存で構造が不変という1条件は成功。その後の連続構造保存の再取得期待に未到達でexit1、原因未確定・app Red認定なし。専用cleanup全true。
- M12限定構造：可視tabと実focusを有限待機・assertする構造だけの独立区間で4check・exit0。構造保存→本文不変→表示本文と対応する.mdを実DOM/実HTTPで確認、専用cleanup全true。本文操作の成功と構造操作の成功を別実行として記録し、最初の連続実行exit1を取り消さない。

## M9の要求文言との照合

## 最新の安全・keyboard補完

M6確認中変更は6check・exit0、専用cleanup全true。各caseで新しいC3確認をdelayReadにより保留し、確認中表示/古いchanged通知なしを確認してから、別clientの実HTTPで構造/企業志望度/メモ理由を変更、またはメモ/企業を削除した。HTTP200成功を確認し解放後、そのcaseのcompletedReads増加とC3 status200（版変更）/404（削除）を待ってfile0を判定した。前caseの通知/単なるファイル数不変を証拠にしない。ブラウザ確認段階の制御と実API/PG変更の結合であり、確定後の全競合排他や新DB isolation保証は追加しない。以前の出力前変更6checkとは別証拠。

layout-onlyは3check・exit0、専用cleanup全true。実CSS1366でPC表だけ、390でmobile観点だけが可視で各7観点順を確認し、既成功の操作/性能/nativeを反復していない。

安全/401の最初の2回はglobal外部HTTP総数1のため4check false・process exit1（専用cleanup全true）。分類診断ではその1件がlogin段階のHTTPS Script GET、fixtureHost/unsafeMarker=falseで、区間開始後は増加0。既存layoutのAnalytics import/renderを読取照合し、次の限定版で既知debug script一致bool=trueも確認した。総数1は消さず、既知baselineと対象操作の外部増分0を別に判定する最小helper修正後は6check・exit0、専用cleanup全true。未知/操作起因要求は許容しない。過去false/exit1は維持する。

同区間でscript/img文字表示、実行0/危険要素なし、Markdownのscript/img/pipe/実改行安全化を実証。javascript/data/資格情報入りURLは既存schemaに反するfake応答が実際に配送されたことをcountで確認し、全3種で拒否表示・file0・非リンク・実行0・操作中外部要求0。共有schemaを厳格化していない。出力確認中401でfile0/保護欄非表示/operations追加0も成功。security区間だけにimg/記号fixtureを追加し、通常の性能fixtureと過去p95を新測定に読み替えない。

keyboard限定は11check・exit0、専用cleanup全true。一時buttonのEnterはkeydown/keypress/click/keyup、radioのSpaceはkeydown/keypress/keyup/clickを実測し全isTrusted。これは一時DOMのprogrammatic focusによる配送プローブ。アプリ側では19回の実Tab到達（計517回、最大122回）で対象へ進み、候補取得/選択、志望度ArrowDown・欄限定保存、理由入力/保存、unknown同ID照会/再試行、明示再取得、競合latest/rebase、比較.md、旧入口/復帰、aria-label付きscroll領域を操作した。主要操作はprogrammatic focusで代用していない。既存のShiftTab/Tab wrap・Escape・20社ArrowRightは別のM10証拠。

このkeyboard回は旧→新復帰時503/unavailable593msも観測し、出力阻止→本人の明示再取得/追加write0で回復した。このerror回復は既存helper clickであり、当回を完全keyboard-only連続flowとは表現しない。再取得button自体のkeyboard activationは別場面で成功した。原因未確定の503を消さず、app Red/production修正はなし。

## 幅別主要操作

1366×768の明示単幅モードは4check・exit0、専用cleanup全true。各主要操作で可視/有効候補を選び、scroll後のfocus/viewport/elementFromPointを確認し、CDP mousePressed/mouseReleased後の実click event.isTrusted=trueをassertした。候補選択→比較→理由だけ保存→unknown同ID照会/再試行→本人の明示C3再取得→競合base/draft/latest確認→明示rebase保存→比較.md→旧入口→復帰を終端まで実操作。M9をkeyboard全操作の証拠とはせず、M10実keyと分ける。

390×844も同じ主要操作を明示単幅モードで4check・exit0、専用cleanup全true。PC/mobileのCSS非表示側をtextContentだけで合格にしないため、以後の区間に表示中領域と7観点順の読取assertを加え、既成功1366/390には全操作を繰り返さないlayout-only補完を用意した。

320は7check・exit0、767/768は各5check・exit0、すべて専用cleanup全true。各幅で選択/比較/欄限定保存/unknown照会・同要求再試行/明示再取得/競合latest・rebase/出力/旧入口往復まで実操作。CSS幅320/767はmobile観点領域のみ、768はPC表のみが可視で、7観点順を確認した。320の旧→新復帰時は503/unavailable250msを観測し、出力阻止→明示回復/追加write0を別checkにした。原因未確定の元503を消さない。

native200/400は各6check・exit0、専用cleanup全true。専用profileのbrowser設定と新しい非emulated tabで基準CSS1342/DPR1、200%は671/DPR2、400%は335/DPR4。各倍率で不足する選択/比較/欄限定保存/unknown同ID復旧/競合latest・明示rebaseと可視mobile7観点順を実操作した。以前に同じnative倍率で実証した比較.md出力/旧入口は再利用し、viewport模擬からnative成功へ読み替えていない。

保持操作の再試行後はC3がstaleのままという通常契約を確認し、helperに明示「比較参照を再取得」を加えた。省略してreadyを待った実行はexit1・専用cleanup全trueであり、アプリへ新たな自動更新要求を課さない。その後の全幅実行要求1件は、まず単幅を確認する最新指示に反すると自動承認レビューで拒否され未起動だった。明示単幅モードへ縮小して上記結果を得た。拒否を回避する間接実行や同じ全幅要求の反復は行っていない。

計画M9とtech-stack-decisions.md NFR5.2は、列挙された幅/倍率で候補選択・比較・独立保存・競合/unknown復旧・出力・旧入口へ到達することを要求する。全種類の異常と全幅の直積を追加の合格条件にしていない。以前の「全エラー×全幅未確認」は追加測定の限界であって、その直積自体を承認条件として扱わない。

必要な不足は、以前のviewport条件ではoverflow/controls存在だけで主要操作未実施、native200/400では保存/出力/旧入口は成功済みだが競合/unknown復旧未実施という点。これらだけを独立M9へ引き継ぎ、既存native保存/出力/旧入口の実証は再利用する。NFR5.1の危険URLは共有schemaの資格情報なし絶対http/https制約と照合し、NFR5.3のfocus/通知/keyboard証拠とも区別する。正本計画・NFR本文は変更しない。

M9のfake javascript URL応答区間は期待した拒否文言に未到達、process exit1・専用cleanup全true。共有schemaのsourceUrlはisSafeUrl制約を持つが、当helper実行から拒否成功/全応答の表示成功/アプリ不備のいずれも断定しない。この区間を幅別操作から除いて分離した。次の幅1366の実行もtrusted Enter後のunknown表示に未到達でexit1、専用cleanup全true。Enterによるclick発火をまだ証明しておらずapp Redにしない。主要操作は可視・有効な要素を選び、scroll後のviewport内とfocus/座標上の要素をassertしてCDP mousePressed/mouseReleasedを送る限定helperへ切り分けた。M9全操作keyboard成功とは記録せず、既存M10のtrusted key証拠と区別する。

- M10：20社比較のlabel付きtable scroll領域へfocusし実ArrowRightでscrollLeft>0、focus/aria-label保持を確認。2check・exit0、専用cleanup全true。
- M6各版/削除：別clientの構造/企業志望度/メモ理由の各版変更、選択メモ削除、企業削除で各比較.md0を実DOM/実HTTPで確認。6check成功、専用cleanup全true。実session/実PGを通すが他ownerの実B認証とは区別する。

- M6：不正応答・実15秒期限・確認中追加入力の各出力0、503時出力阻止/明示再取得/追加write0を含む6check・exit0。専用cleanup全true。
- M7：制御401による保護欄非表示、同本人の最新参照確認と明示復旧、draft保持/追加write0の3check・exit0。これは実B sessionや実Authの証明ではない。専用cleanup全true。
- M8初回：旧正常編集/出力/ID・日付保持/送信0、混在非破壊、読取不能≠0件は実操作成功。ただし未選択なのに比較readyを待つ終了前提が誤り、process exit1。専用cleanup全true。app Redにはしない。
- M8補正後：独立区間の終了を仕様どおり未選択/出力disabledへ訂正した限定1回で5check・exit0、専用cleanup全true。過去exit1は維持する。

上記はM2/M3全flow、性能100回、native zoomを最初から反復せず、独立した実Edge155.0.4283.62/Node22.23.3/dummy・loopback PG17.6で確認した範囲。後段の未確認条件をこれらで成功化しない。

fresh公式briefのU3 marker、Testing Contract a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440、全plan/instructionsとrules全文を分割回収して読了。1〜15/17〜18完了・16未完了を保持。開始source29fileは欠落0/変更0、aggregate a56c3783dd915054858aa2f62501da73b82786d01bba63baf6806808a2a69740。以前の587tests/83.50%等の結果を維持し、無根拠な全体反復なし。

## 正確な停止操作

構文exit0後、`node scripts/check-u3-comparison.mjs --m4-diagnostic`で1社のM3送信後追加入力→破棄→再入→M4だけを有限診断した。全flow/性能/native zoomは反復していない。安全なaction名/開始完了/所要時間とnative dialogの種類だけを記録し、本文/資格情報/dialog messageを出力していない。

M3-open-custom-discard 305ms、confirm 432ms、reentry 185ms、ready/recovery 1766ms、M4-input 515ms、send 592ms、unknown待機388msで完了。次のM4-open-board-routeでPage.javascriptDialogOpening type=beforeunloadを観測し、Runtime.evaluateは15019msでtimeout。custom route dialogの承認前だった。同時にBrowser.getVersionは応答あり。CDP transport全体の停止ではなく、native dialogが開いたscript評価の待機として切り分ける。診断exit1、専用preview/Edge/profile/schema cleanup全true、preview exit0、errors=[]。

helperのdownload観測が全anchor.clickをnew MouseEvent（cancelable未指定）へ置換しており、未保存ガードのpreventDefault契約を壊す箇所があった。blob download以外はcaptured native anchor.clickへ委譲する最小修正を行った。native dialogを自動acceptせず、app/未保存ガード自体は変更しない。小さな実DOM自己検査でcancelable/preventDefault/location不変、限定M4でcustom guard→route往復→同ID照会を確認する。これはhelperの不備で、app Redには加算しない。

## 限定M4の再確認

修正後構文exit0、`node scripts/check-u3-comparison.mjs --m4-check`は9check成功・process exit0。実DOM自己検査で通常anchor eventがcancelable、preventDefaultでlocation不変を確認。M4 custom guard確認前は/compareに留まり、明示確認後だけ企業ボードへ移動した。実route remount後もunknownを保持し、同ID照会でcommittedを取得、追加PATCH0・実保存理由一致。native dialogは発生0/自動承認0。専用preview/Edge/profile/schema cleanup全true、preview exit0、errors=[]。

この回もM3再入時の503/unavailable（343ms）を観測し、失敗中の出力阻止と本人の明示再取得/追加write0を別checkにした。以前の503やtimeoutを遡って成功へ変更しない。Edge155.0.4283.62/Node22.23.3、loopback実PG/dummy fixture。既知のM2/M3全flowは反復せず、後段M6/M7/M8/M10を独立区間として確認する。
