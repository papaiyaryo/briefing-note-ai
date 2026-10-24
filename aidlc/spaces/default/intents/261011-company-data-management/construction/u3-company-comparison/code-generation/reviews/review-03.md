## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-24T16:22:54Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/compare/ServerCompanyComparison.tsx > 保持中の保存操作、line 396 | `readbackState === "error"`だけで「保存成功。最新の取得に失敗しました」と表示する。理由保存が409で競合し、その後「最新を別領域に取得」が失敗すると、edits.ts:181はreadbackStateをerrorにするがstatusはconflict、確定outcomeはない。保持操作にはintentがあるためこの成功文が表示され、同時に出る競合表示と矛盾する。機能設計WF4.4の「確定応答だけを保存成功」に反する。既存UI試験はcommitted＋readback-errorを確認しているが、conflict＋latest-errorの成功文不在は確認していない。 | 成功の補足文を当該操作のcommitted状態と確定結果がある場合に限定する。競合後の最新取得失敗は、保存成功とせず競合・入力保持・取得失敗を表示する。この経路とcommitted後の取得失敗の両方を回帰試験に追加する。 | Resolved (reviewer) |
| R-02 | Major | src/components/compare/ServerCompanyComparison.tsx > refresh catch lines 75–81 / 古いsnapshotの欄表示 lines 354–377 | 比較再取得が404でも汎用errorにするだけで以前のsnapshotとfieldsを保持し、欄エディターを表示する。ComparisonFieldEditor.tsx:86の保存無効条件とComparisonEdits.saveの入口には対象利用不可の判定がない。このため、削除されたメモを再取得して404を受けた後でも、理由を変更して新operationIdのPATCHを送れる。サーバーは拒否できるが、機能設計WF5.6の「対象消失ならその対象の更新/出力を停止」とWF6.4の対象なし/利用不可表示を満たさない。出力は停止している。 | 404で確認できた参照利用不可を通信失敗と区別し、対象への新規保存をUIと制御層で停止する。入力と送信済みintentを保持し、同IDの結果照会は残す。削除後の再取得→編集→保存操作で新PATCHが発生しない回帰を追加する。 | Resolved (reviewer) |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-acceptance-status.md > M7 / NFR1.2 | 実B session、実A→B→A、出力確認中の本人変更のブラウザ実証が未確認。単体のowner世代試験と実PGの権限拒否、制御401・同A復旧は存在するが、この画面統合経路の証拠ではない。現在の文書はこの限界を明記し、Step16も未チェックなので、隠された成功宣言はない。 | 全受入を確定する前に、本人切替が成立する承認済み検証環境でM7と出力中切替を確認する。それまでは現状どおり未確認を維持し、単体/実PGの成功で置き換えない。 | Unresolved |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-revision-02-root.md > M-Rの実観測と未達 / M-R1–M-R5 | 通常保存・409でのbase/draft/latest分離、メモ/企業削除404後の停止と入力保持、企業個別GET200で当該欄だけ再開、PC幅1905と限定キー操作の実GUI証拠はある。一方、明示rebase後再保存、残る別企業の確認保存、他欄dirty同時保存、route往復、比較.md実download、承認済みmobile幅/native200%・400%は未確認。Step9が未チェックであり、隠れた全合格宣言はないが、変更後の利用導線・画面品質の受入証拠は未完了。これはR-03の実本人切替とは別の不足である。 | 全受入を確定する前に残るM-R操作と承認済み画面条件を実アプリで確認し、実際の幅・倍率、期待結果、cleanupを記録する。測定できない条件は未確認のまま引き継ぎ、SSR/callbackや旧CDP履歴で合格へ置き換えない。 | Unresolved |

> R-02 Reviewer note: 現行 `src/lib/companyComparison/export.ts > exportComparison catch` は現owner/選択/要求世代を確認した上で、ClientFailureのnot_foundかつ404だけを `invalidateReferences` へ渡す。通常refreshと同じく選択全体のinterest/reasonを利用不可とし、`ComparisonFieldEditor` は入力・保存・rebaseを停止、`ComparisonEdits.save` も新ID生成前に拒否する。共有ガードはfieldのdraft/base/intent/outcomeを消さず、lookup/retryの同ID経路も利用可能判定では遮断しない。新しい `tests/u3-company-comparison/export.test.ts > BR4.2` は404後の全source両欄の利用不可、2欄の保存送信0、入力保持、download0を検査し、BR5.2は503後の欄利用可とdownload0を検査する。前回残存した出力前404経路は塞がれた。

> R-03 Reviewer note: `aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-acceptance-status.md > M7 / NFR1.2` の実B session、実A→B→A、出力確認中の本人変更のGUI実証は依然未確認。今回のhandoff証拠も実本人変更を成功へ置き換えていない。全受入確定前に本人切替が成立する承認済み環境で確認し、それまでは未確認を維持すること。単体owner世代試験や実PGの権限拒否はこの画面統合経路を代替しない。

> R-04 Reviewer note: `aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-revision-02-root.md > M-R1–M-R5` の明示rebase後再保存、残る別企業の保存、他欄dirty時の保存、route往復、比較.md実download、承認済みmobile幅/native200%・400%の実測は未完了。新しい出力単体試験はこれらのGUI受入を代替しない。全受入確定前に実アプリで残条件・実際の幅と倍率・期待結果・cleanupを記録し、実測不能な条件は未確認として引き継ぐこと。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| SHA256による累積manifest29件の差分確認 | 29件すべて読取可能。保存済みfingerprintとの差分は既知の共有入口3件と今回のexport.ts/export.test.tsの計5件。今回2件は依頼・handoff証拠のSHA256と一致 | 旧aggregateを現行全件一致として扱っていない。共有入口3件は前回の現行ソース確認を継承し、今回変更された出力2件を全文再読した。他Unitのconstruction内容は参照していない。 |
| 現行実装と追加2試験の独立読解 | exportの404分類・現世代確認・共有無効化、sessionの状態保持、UI/save/rebaseの利用不可判定、lookup/retryの保持を確認 | 新規保存はoperationId生成前に止まる。503は無効化されない。追加試験は当該失敗経路を実controllerで検査しており、単なるfile0確認に留まっていない。 |
| traceability参照先のread-only確認 | 137 coverage、存在しないtarget 0 | 対応先の実在を確認。共同AC/NFRのDeferredと実GUI未確認を変更しない。 |
| export-r02-handoff-evidence-2026-10-25.md の証拠確認 | 担当者独立実行のexport試験14/14、exit0を記録。今回reviewerは試験を再実行していない | ユーザー報告の過去Redと担当者直接観測のGreenを区別している。実PG/full/coverage/buildおよび今回lint/typecheck/prettierは未実行。旧635件/85.95%/build成功は今回bytesの保証ではない。 |
| 計画と今回依頼の境界確認 | 旧revision02計画の修正範囲は8file。今回は人間が既適用の出力2fileの確認を明示依頼 | 旧8file計画へ遡及的な承認を推定しない。新しい人間の全受入承認も推定しない。レビューからアプリ・試験・計画の変更は行っていない。 |
| GUI確認 | 追加実測なし、CUA再試行なし | R-03/R-04の未確認を維持する。 |

### Summary

現在の出力前404処理は通常再取得と同じ保存停止境界へ接続され、R-02はFixedと判断する。Critical/Majorの未解決事項はなくREADYとするが、R-03/R-04のGUI受入と今回2file変更後の未実施検証は残り、全受入完了を意味しない。
