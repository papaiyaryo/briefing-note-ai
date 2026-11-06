## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-28T05:14:19Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/compare/ServerCompanyComparison.tsx > 保持中の保存操作、line 396 | `readbackState === "error"`だけで「保存成功。最新の取得に失敗しました」と表示する。理由保存が409で競合し、その後「最新を別領域に取得」が失敗すると、edits.ts:181はreadbackStateをerrorにするがstatusはconflict、確定outcomeはない。保持操作にはintentがあるためこの成功文が表示され、同時に出る競合表示と矛盾する。機能設計WF4.4の「確定応答だけを保存成功」に反する。既存UI試験はcommitted＋readback-errorを確認しているが、conflict＋latest-errorの成功文不在は確認していない。 | 成功の補足文を当該操作のcommitted状態と確定結果がある場合に限定する。競合後の最新取得失敗は、保存成功とせず競合・入力保持・取得失敗を表示する。この経路とcommitted後の取得失敗の両方を回帰試験に追加する。 | Resolved (reviewer) |
| R-02 | Major | src/components/compare/ServerCompanyComparison.tsx > refresh catch lines 75–81 / 古いsnapshotの欄表示 lines 354–377 | 比較再取得が404でも汎用errorにするだけで以前のsnapshotとfieldsを保持し、欄エディターを表示する。ComparisonFieldEditor.tsx:86の保存無効条件とComparisonEdits.saveの入口には対象利用不可の判定がない。このため、削除されたメモを再取得して404を受けた後でも、理由を変更して新operationIdのPATCHを送れる。サーバーは拒否できるが、機能設計WF5.6の「対象消失ならその対象の更新/出力を停止」とWF6.4の対象なし/利用不可表示を満たさない。出力は停止している。 | 404で確認できた参照利用不可を通信失敗と区別し、対象への新規保存をUIと制御層で停止する。入力と送信済みintentを保持し、同IDの結果照会は残す。削除後の再取得→編集→保存操作で新PATCHが発生しない回帰を追加する。 | Resolved (reviewer) |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-acceptance-status.md > M7 / NFR1.2 | 実B session、実A→B→A、出力確認中の本人変更のブラウザ実証が未確認。単体のowner世代試験と実PGの権限拒否、制御401・同A復旧は存在するが、この画面統合経路の証拠ではない。現在の文書はこの限界を明記し、Step16も未チェックなので、隠された成功宣言はない。 | 全受入を確定する前に、本人切替が成立する承認済み検証環境でM7と出力中切替を確認する。それまでは現状どおり未確認を維持し、単体/実PGの成功で置き換えない。 | Unresolved |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-revision-02-root.md > M-Rの実観測と未達 / M-R1–M-R5 | 通常保存・409でのbase/draft/latest分離、メモ/企業削除404後の停止と入力保持、企業個別GET200で当該欄だけ再開、PC幅1905と限定キー操作の実GUI証拠はある。一方、明示rebase後再保存、残る別企業の確認保存、他欄dirty同時保存、route往復、比較.md実download、承認済みmobile幅/native200%・400%は未確認。Step9が未チェックであり、隠れた全合格宣言はないが、変更後の利用導線・画面品質の受入証拠は未完了。これはR-03の実本人切替とは別の不足である。 | 全受入を確定する前に残るM-R操作と承認済み画面条件を実アプリで確認し、実際の幅・倍率、期待結果、cleanupを記録する。測定できない条件は未確認のまま引き継ぎ、SSR/callbackや旧CDP履歴で合格へ置き換えない。 | Unresolved |

> R-03 Reviewer note: 実Bセッション、A→B→A、出力中の本人切替は今回も画面実証がない。manual-acceptance-status.md は未確認を明記し、単体・実PG結果と区別している。

> R-04 Reviewer note: M-R1〜M-R5 の今回の実画面成功は0。明示rebase後再保存、別企業保存、他欄dirty、往復、実download、mobile幅とnative倍率の残条件は manual-evidence.md に未確認として残る。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Stage definition | 専用 validation tools の指定なし | 追加の指定検査はない。 |
| source-manifest.json の参照先確認 | 29件、欠落0 | 今回の宣言済み source path は実在する。 |
| traceability.json の構造確認 | upstream_ids 137件、coverage 137件 | 追跡表の両配列は同数。受入の完了判定は未確認項目を残す。 |

### Summary

R-01/R-02 の再検証結果と品質検査は記録され、未実施の画面条件を成功と扱っていない。実画面と本人切替の残条件を解消するまでは、U3全体の受入完了とは判断できない。
