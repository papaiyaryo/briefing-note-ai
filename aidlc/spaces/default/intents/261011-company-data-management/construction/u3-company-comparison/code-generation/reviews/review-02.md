## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-22T05:15:59Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/compare/ServerCompanyComparison.tsx > 保持中の保存操作、line 396 | `readbackState === "error"`だけで「保存成功。最新の取得に失敗しました」と表示する。理由保存が409で競合し、その後「最新を別領域に取得」が失敗すると、edits.ts:181はreadbackStateをerrorにするがstatusはconflict、確定outcomeはない。保持操作にはintentがあるためこの成功文が表示され、同時に出る競合表示と矛盾する。機能設計WF4.4の「確定応答だけを保存成功」に反する。既存UI試験はcommitted＋readback-errorを確認しているが、conflict＋latest-errorの成功文不在は確認していない。 | 成功の補足文を当該操作のcommitted状態と確定結果がある場合に限定する。競合後の最新取得失敗は、保存成功とせず競合・入力保持・取得失敗を表示する。この経路とcommitted後の取得失敗の両方を回帰試験に追加する。 | Resolved (reviewer) |
| R-02 | Major | src/components/compare/ServerCompanyComparison.tsx > refresh catch lines 75–81 / 古いsnapshotの欄表示 lines 354–377 | 比較再取得が404でも汎用errorにするだけで以前のsnapshotとfieldsを保持し、欄エディターを表示する。ComparisonFieldEditor.tsx:86の保存無効条件とComparisonEdits.saveの入口には対象利用不可の判定がない。このため、削除されたメモを再取得して404を受けた後でも、理由を変更して新operationIdのPATCHを送れる。サーバーは拒否できるが、機能設計WF5.6の「対象消失ならその対象の更新/出力を停止」とWF6.4の対象なし/利用不可表示を満たさない。出力は停止している。 | 404で確認できた参照利用不可を通信失敗と区別し、対象への新規保存をUIと制御層で停止する。入力と送信済みintentを保持し、同IDの結果照会は残す。削除後の再取得→編集→保存操作で新PATCHが発生しない回帰を追加する。 | Unresolved |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-acceptance-status.md > M7 / NFR1.2 | 実B session、実A→B→A、出力確認中の本人変更のブラウザ実証が未確認。単体のowner世代試験と実PGの権限拒否、制御401・同A復旧は存在するが、この画面統合経路の証拠ではない。現在の文書はこの限界を明記し、Step16も未チェックなので、隠された成功宣言はない。 | 全受入を確定する前に、本人切替が成立する承認済み検証環境でM7と出力中切替を確認する。それまでは現状どおり未確認を維持し、単体/実PGの成功で置き換えない。 | Unresolved |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-revision-02-root.md > M-Rの実観測と未達 / M-R1–M-R5 | 通常保存・409でのbase/draft/latest分離、メモ/企業削除404後の停止と入力保持、企業個別GET200で当該欄だけ再開、PC幅1905と限定キー操作の実GUI証拠はある。一方、明示rebase後再保存、残る別企業の確認保存、他欄dirty同時保存、route往復、比較.md実download、承認済みmobile幅/native200%・400%は未確認。Step9が未チェックであり、隠れた全合格宣言はないが、変更後の利用導線・画面品質の受入証拠は未完了。これはR-03の実本人切替とは別の不足である。 | 全受入を確定する前に残るM-R操作と承認済み画面条件を実アプリで確認し、実際の幅・倍率、期待結果、cleanupを記録する。測定できない条件は未確認のまま引き継ぎ、SSR/callbackや旧CDP履歴で合格へ置き換えない。 | New |

> R-01 Reviewer note: `src/components/compare/ComparisonFieldEditor.tsx > hasCommittedOutcome / fieldReadError` と `src/components/compare/ServerCompanyComparison.tsx > 保持中の保存操作（396–404行）` は、committed状態と当該intentに一致するoperationId・対象・action・非空版を持つoutcomeで成功文を制限する。`tests/u3-company-comparison/ui.test.ts > U-R1 / U-R2` は実controller/callbackの409→latest503で両表示の成功文不在と、正しいcommit後取得失敗で成功・確定ID保持を確認し、欠落/別意図/別対象outcomeも拒む。元の誤成功表示は修復されている。

> R-02 Reviewer note: 直列の再取得404→新save停止はsession/edits/UIおよびI-R1/I-R2で実装・検証されているが、停止を維持できない経路が残る。① `src/lib/companyComparison/session.ts > invalidateReferences / referenceStale（147–175行）` は要求世代を進めず、`src/lib/companyComparison/edits.ts > refreshLatestField（172–184行）` は同じ要求世代と欄別取得番号だけで解除する。C3のbeginRequest→個別latest開始→C3が404で停止→削除前に読めた個別GET200が遅着、の順ではcurrentがtrueのまま該当ガードを解除し、editing欄の新save、またはconflict欄のrebase→新saveを許す。企業個別404と並行する所属メモGET200にも同じ問題がある。C-R7はlatest開始後にbeginRequestする順なのでこの順序を覆わない。② `src/lib/companyComparison/export.ts > exportComparison catch（48–55行）` は出力前C3の404を汎用errorにするだけで参照を停止しない。出力自体は止まるが、保持した欄へ入力した後、`ComparisonEdits.save` はisFieldAvailable=trueとして新operation/PATCHを作れる。いずれもソースの分岐・世代値を追跡した静的所見で、今回実行再現したものではない。**必要な修正:** 404確認時点で影響対象の既存読取を無効化し、それ以後に開始した検証済み読取だけで停止を解除する。出力前404も同じ停止境界へ接続する。両並行順序と出力前404→編集→saveの新operation/PATCH0回帰を追加し、draft/base/確定結果および同ID照会・再試行は保持する。

> R-03 Reviewer note: `aidlc/spaces/default/intents/261011-company-data-management/construction/u3-company-comparison/code-generation/manual-revision-02-root.md > 実施境界 / M-Rの実観測と未達` と `code-summary.md > 限定GUIの証拠と未確認` は、実B、実A→B→A、出力確認中の実本人変更を未確認としている。同本人2タブ、制御401、単体owner世代、実PG拒否はこの画面統合経路の代わりにならない。全受入確定前に本人切替が成立する承認済み環境で確認し、それまではDeferredを維持する。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `aidlc engine now`（既存cmd.exe） | PASS: `2026-10-22T05:15:59Z` | Dateは実際の出力を転記した。 |
| 独立した読取専用Nodeハッシュ照合 | PASS: manifest29件・unique29、29file hash不一致0、aggregate `59ededfa48d25cf900ad3bb58ab75db4a827b58f9d8e88c8c03ce3f77b72006f`一致。revision02前fingerprintとの差は指定8fileのみ | 累積claimを8fileへ縮小していない。先行Unitの凍結照合はroot保存証拠のみで、本reviewerは兄弟Unit constructionを読んでいない。 |
| 独立したtraceability JSON/対象実在照合 | PASS: upstream137/unique137、coverage137/unique137、90AC/17BR/30NFR、欠落/余分ID0、全target実在、全status `Deferred` | 構造上の追跡と未確認状態を維持。ID存在を受入合格と解釈しない。 |
| Stage定義の検査項目照合 | `required-sections` / `traceability` を確認。独立validatorの実行コマンド指定なし。計画・試験手順・summaryの複数H2とJSON構造を読取確認 | 公式sensorを実行したとは主張しない。linter/type-checkは本stageのimport対象外。 |
| R-01/R-02のソース・回帰試験読取 | R-01の成功投影は修復。R-02の直列停止/同ID継続は確認したが、並行応答と出力前404の残存経路あり | 試験を実行せず、分岐と既存assertionを照合。C-R7の順序の限界を上記R-02へ記録した。 |
| 保存されたTDD/最終品質証拠 | 記録上、Business Red48=11fail/37pass、PG Red12=2fail/10pass、UI Red24=4fail/20pass。最終group48/12/24、U3 139、全体635/55files成功、lines85.95%（2962/3446）、lint/typecheck/build/diff exit0 | 新20件=S5/C7/U6/I2と既存119件を区別。初回Green対照、未実装状態APIのTypeError、shell未起動、mock型不備、初回coverageの既存5000ms timeoutと同条件Retryを保持。reviewer自身の再実行結果ではない。 |
| 限定GUI/cleanup証拠読取 | 同本人2タブの限定成功、3previewすべてexit0/停止true/schema削除true、owned tabs終了を記録。Step9未チェック | 実GUIの実施済み部分を認め、未達を新MinorとR-03に分けて保持。実Auth/Supabase/CI/Vercelの成功証拠にはしない。 |

### Summary

未解決はCritical0・Major1（R-02）・Minor2（R-03と新規1件）であり、規定の件数基準ではREADY。これはadvisory一回の判定で、R-02の全修復、全137IDの受入、実Auth/Supabase/CI、既存audit high5/critical1の解消、人間merge後の対象SHA/Vercel/公開フローの完了を認定するものではない。
