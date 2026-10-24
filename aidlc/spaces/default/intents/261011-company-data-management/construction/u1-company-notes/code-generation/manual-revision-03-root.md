# U1改訂3：親担当の追加画面確認（2026-10-21 Asia/Tokyo）

## Scope

承認済み[改訂3計画](code-generation-plan.md)Step10の残る企業・メモの別画面一致と390px表示を、既存の専用local previewとCUAの操作で確認した。全て架空の企業・本文・dummy本人。実Supabase/Auth/外部API/本番/Vercelではない。操作対象以外のユーザーのブラウザタブへ触れていない。

## Recovery and Environment

再開時に旧ブラウザbinding・旧専用タブ・旧実装担当が存在しなかったため、新しい公式next/continueのapproved・Step10/12（1〜9完了）を確認。既承認の計画を変更せず続行した。旧previewはport3000にlistenerなし。

最初のpreview起動は127.0.0.1:55432 ECONNREFUSED/exit1。環境不備であり不具合のRedではない。承認済みcompose.test.ymlをup -d --waitしてHealthy/exit0へ復旧し、専用previewを再起動した。

viewport.setが返っても新タブの実測が1920pxになる試行があった。設定を受理したことだけでは成功にしない。同じrootの検証タブはabout:blank時390×844、企業詳細とメモ編集の実ページでも390×844/DPR1を確認。別タブは1920pxであり、全タブが390pxだったとはしない。

## Company — Two Views

架空企業を390pxのタブAで登録し、同じ企業を別タブBに表示した。両方が同じ旧保存版を読んだ状態で、Bの業界欄へ保持する入力、Aへ別の先行入力を入れた。

1. Aで先行保存200、Bの古い版保存は409。
2. Bで「保存済みの最新を再取得」。破棄確認なしで取得し、元の保持入力と先行保存値を別領域へ表示した。
3. 明示再編集前は企業情報の編集欄と保存がdisabled。保持した入力を失わなかった。
4. 「保持した企業入力で再編集」へEnterを送信し、保持入力の編集と明示保存が可能。保存200。
5. Aで明示再取得し、業界欄がBの最終保存内容と一致した。Aの実測390×844を再確認。

HTTPログは企業新規201、更新200→409→200、必要な読取200。企業の競合・再編集の操作自体は1920pxのB、390pxのAは登録・初回編集保存・最終取得を操作した。全経路を390pxだけで実行したという主張にはしない。

## First Preview End — Preserved Failure

企業確認後のメモ新規操作はpreviewの5分寿命終了時に結果不明となった。同じoperationの「操作結果を確認」を選んだが環境終了後で照合できなかった。新operationで作り直さず、成功/未保存を断定していない。

取得した終了ログでは当メモPOSTは記録されず、専用process stop確認true/schema削除true/exit0。未到達は保存成功の証拠ではない。次の実行は別の使い捨てschemaと新しい架空fixtureで、旧操作の再送・未保存判定の代用ではない。

## Memo — 390px Conflict and Cross-View Readback

第2専用previewで架空企業と手入力メモを新規作成。タブAは同じ390×844px、タブBは別表示。メモ新規201、保存後読取200を確認した。

1. 同じ保存メモを両タブで開き、Aに保持本文、Bに異なる先行本文を入力。
2. Bの先行保存PATCH200とreadback200を確認後、Aの古い版を明示保存して409。
3. Aの「保存済みの最新を再取得」では、企業・メモ一覧・ボード・選択メモの4読取が全て200。
4. Aに元の保持本文、最新textareaに先行保存本文を同時表示。実ページのinnerWidth390を再確認。本文保存isEnabled=false。
5. 「保持した入力で再編集」へEnterを送信。保持本文がtextareaへ戻り、本人の明示保存PATCH200、同タブのreadback200。
6. Bで最新を明示再取得し、textareaの表示とtextContentがAの最終本文と一致した。
7. このrunのHTTPログに503は0。更新は200→409→200の3回で、明示再編集前の余分な保存なし。

最初の本文fillはlabelがtabpanelとtextareaの両方に一致して失敗。結果に示された既存data-testidのmemo-markdownへ特定し直した。アプリ不具合やRedではない。

## Additional Finding — Read-Only Tabs

手順4の再編集前に、比較用項目tabのisEnabled=falseを実測した。AXでも本文・比較用項目・原文出典のtabが全てdisabled。編集・保存の停止に加え、最新内容の区分切替による閲覧まで停止していた。

実装担当の静的な自己確認と一致したため、承認済みMemoEditor内でTabButtonsと編集停止fieldsetを分ける最小修正を、対象Red→Green→Refactorで進める。ここで記録した時点では未修正。修正後の参照タブ確認は別欄へ追記し、本記録の既成功/未達を上書きしない。

## Read-Only Tabs — 修正後の追加確認

実装担当の対象Red58件中57成功/1失敗→TabButtonsをdisabled fieldset外へ移動→Green58/58→Refactor58/58の後、親担当が新しい専用previewで参照切替だけを確認した。上の未修正時点の観測は履歴として残す。

- 架空メモの先行保存200→古い版409→最新4GET全200。元の保持本文と最新本文を区別する状態を作った。
- 明示再編集前の比較用項目と原文・出典のtabはisEnabled=true、本文保存はfalse。
- 比較用項目tabを開くと構造化項目なしを正しく表示し、追加・比較理由の入力/保存はdisabled。
- 原文・出典tabで、今回の手入力fixtureに対応したOCRなし・説明会情報なし・採用Webなしを閲覧できた。
- 本文tabへ戻ると最新本文を表示し、本文保存は引き続きfalse。保持入力は別領域に残った。再編集・再保存はこの限定確認では行っていない。
- HTTPログのPATCHは先行200と競合409の2回だけ。参照切替による追加PATCHなし、503なし。
- stopでexit0、dedicatedPreviewStopConfirmed=true/schemaDropped=true、2専用タブを閉じた。表示幅は通常PCのまま。直前の390px全経路の成功をこのPC確認の結果に読み替えない。

## Cleanup Summary

第2runは専用helperにstopを送りexit0、dedicatedPreviewStopConfirmed=true、dedicatedSchemaDropped=true。対象の3タブを閉じ、viewport.resetを実行した。確認用SQLはpreview schema件数0、他のactive接続件数0。port3000のListen検索は出力なし（not-found相当exit1）。

既存DBコンテナは後続品質検証用にHealthyのまま保持。旧workerの別runのStopConfirmed=falseや503、期限終了による未達もbugfix-evidence.mdの履歴へ保持する。このローカルdummy確認を実Auth・実Bセッション・本番受入・リリース完了へ拡張しない。

