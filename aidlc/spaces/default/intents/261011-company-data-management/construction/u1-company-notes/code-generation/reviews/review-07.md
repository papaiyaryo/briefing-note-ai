## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-28T17:10:41Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/workspace/CompanyDetail.tsx > move（249〜259行）／「保存済みの最新を再取得」（312〜319行） | 版競合後に入力を保持したまま最新保存内容を確認できない。再取得ボタンはmoveを通り、draftがあると破棄確認を出し、確定するとworkspaceDrafts.discard(target)を実行してからloadする。取消では最新取得が起きないため、企業編集でもメモ編集でも、最新を見て再編集するために元の入力を失う。AC6.3.2とWF6が求める「最新と保持入力を区別して確認」を満たさない。既存callback試験は移動取消時の保持と単独の復帰を確認するが、この競合から最新確認への連続経路を確認していない。 | 最新取得を画面移動による破棄から分け、元のdraftとそのbaselineを保持したまま最新保存版を表示する。本人が確認して再編集するまで旧入力を捨てず、企業・メモの両方で409→最新取得→入力保持→明示再編集の回帰を追加する。 | Resolved (reviewer) |
| R-02 | Major | docs/company-data-setup.md > backup・復旧／scripts/workspace-restore-check.mjs > app_sessionsを含むdumpとfingerprint | 復元手順が以前の有効sessionも戻し、暗号鍵がある場合の全session失効・再認証を必須にしていない。手順は非公開schema全体をbackupし、鍵が揃わない場合だけ失効を求める。実際の復元確認もapp_sessionsの同一性を成功条件にする。隔離実PGとdummy Authで、アプリlogout成功後に古いCookieが認証不可になり、backup時点のsession行を戻すと同じCookieが再び認証可能になることを再現した（外部logout失敗は許容された障害条件）。RD3の「通常のtokenを復元資料へ持ち出さず、復元後は新たに認証」と不一致で、復旧により失効済みCookieを復活させ得る。 | 通常の企業メモbackupからsession/tokenデータを除外するか、復元後・アプリ再開前に復元された全sessionを必ず失効しtokenを消去する手順を必須にする。鍵の有無に関係なく新規ログインを要求し、復元前にlogout済みのCookieが復元後も拒否される検証を追加する。 | Resolved (reviewer) |
| R-03 | Minor | src/lib/server/workspace/repository.ts > deleteConfirmed（539行の期限検査と直後のcompanyRow FOR UPDATE） | 削除確認期限を親企業ロックの取得前にしか検査しない。要求開始時には有効でも、ロック待ち中に期限切れになると、その後に削除を確定できる。実PGの隔離fixtureで期限を600ms後、親ロックの解放を1100ms後に設定し、期限後でもcompany_delete成功になることを再現した。現在の期限試験は要求開始前に期限切れを作るため、この境界を捕捉しない。 | 親ロック取得後、変更を確定する前にも確認期限を検査し、期限切れなら410で対象を残す。親ロック待ちの間に期限を越える競合試験を追加する。確定済み同操作の再送は引き続き期限検査より先に元結果を返す。 | Resolved (reviewer) |
| R-04 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/manual-restart-20261023-root.md > 未確認・限定事項／code-generation-plan.md > Step 10 | 今回の画面受入ではスマホ幅と、最新取得失敗後の入力保持・追加PATCHゼロの連続操作が未確認。390×844の要求に対する実測は2560×1261であり、PCの成功ではスマホでの操作到達性を確かめられない。取得失敗のcallback回帰と旧390px証拠はあるが、今回の計画にあるGUI確認全体の完了は裏付けない。記録と未チェックはこの限界を正しく示している。 | 実測したスマホ幅で企業・メモの競合、最新との別表示、明示再編集・保存の操作到達性を確認する。制御した最新GET失敗で元入力の保持・保存成功表示なし・追加PATCHゼロを画面と通信で確認し、操作・実測幅・期待／実際を記録する。 | Unresolved |
| R-05 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/restart-verification-20261022.md > Fresh Commands and Results／Retry — Fresh Verification Completed | 初回全体実行で復元認証2件と実HTTP/PG最新取得1件が既存5000ms上限で失敗し、同条件のRetryでは成功している。これは製品不具合の再現ではないが、重要境界の試験が今回一度は完了せず、原因も未特定のため、継続的に安定した検証ができるかは未解決。成功635件とcoverage値はこの失敗を解消した証明にはならない。 | 次の承認済み検証で再発を追跡し、再発時は当該処理・DB待機・試験資源の状況を内容や秘密を含めず採取して原因を切り分ける。再試行成功だけで原因解消とせず、根拠なくtimeoutや期待値を緩めない。 | Unresolved |
| R-06 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/code-summary.md > 最新の継続結果 — lint再確認を省略、残り検証は成功 | 独立lintの最新実行は25 errors／40 warningsで失敗。外部で追加された.claude等の除外設定は実行で確認されていないため、現在の設定でlintが成功するかは未確定。記録はこの限界を正しく示している。 | 次の承認済み品質確認でnpm run lintを実行し、現在の設定での結果を記録する。それまではlint成功・品質全体合格・リリース検証完了と扱わない。今回省略した再確認を成功として補完しない。 | Resolved (reviewer) |
| R-07 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/code-generation-plan.md > Scope and Current Evidence / Ordered Steps; timeout-30s-verification-20261025.md > Step 2 | 計画は「新しいPlan Approvalまではsourceやテストを変更・実行しない」としているが、30000指定の3件は検証記録によると承認前のwip commit 46d6b2eで既に反映済みで、今回のStep 2は確認のみで差分がない。つまり承認された変更ではなく、承認前に入った変更を後から承認範囲に取り込んでいる。 | ゲートで、30000指定が承認前のwip commitに含まれていた事実を人が把握したうえで承認する。計画またはsummaryに、この変更が承認前に入っていたことを明記する。 | Unresolved |
| R-08 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/timeout-30s-verification-20261025.md > 前回との差 | lintが前回の65 problemsから今回はexit 0になった理由を eslint.config.mjs の `.claude/**` ignore としているが、この設定の承認経緯は未検証と記録自体が認めている。計画はlint結果の維持を求めており、基準が緩んだ可能性を排除できていない。 | ignore追加のコミットと承認経緯を確認して記録する。アプリ本体のlint対象が減っていないことを確認する。 | Unresolved |
| R-09 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/timeout-30s-verification-20261025.md > 前回との差 | 全体テスト件数が643から645に増えたが、この作業ではテストを追加しておらず原因は未特定である。計画は「新規件数は増やさず」としている。 | 増えた2件のテストと由来を特定して記録し、U1変更範囲外であることを示す。 | Unresolved |
| R-10 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/code-generation-plan.md > Ordered Steps | Step 5(正式review・checkpoint)が既に[x]になっているが、検証記録では公式checkpointコマンドと正式reviewは未実施とされている。完了状態が実態と食い違っている。 | Step 5の完了チェックを、review・checkpoint完了後に付けるか、未完了として扱う。 | Resolved (reviewer) |

> R-04 Reviewer note: `manual-restart-20261023-root.md` は390×844を要求しても実測2560×1261で、制御した最新GET失敗後のGUI確認も未実施と明記する。今回の再検証はテスト3件と品質コマンドで、この画面確認を追加していない。U1全受入の完了とは扱えない。

> R-05 Reviewer note: 2026-10-25と10-28の対象・全体テストは成功したが、初回5000ms timeoutの原因と安定性は未特定。`code-summary.md` は性能原因の解消を主張せず、後続調査を残している。

> R-06 Reviewer note: 10-28の記録で`npm run lint` exit 0。今回のレビューでも同コマンドを実行してexit 0、指摘なしを確認した。

> R-07 Reviewer note: `timeout-30s-verification-20261025.md` は3件の30000設定が前回wip commit `46d6b2e` に既に入っていたと示す。一方、承認計画の「新しいPlan Approvalまではsourceやテストを変更・実行しない」は、設定が承認前に入っていた時系列を明示せず、`code-summary.md` も承認前であったとは書いていない。承認時にこの経緯を明確に提示する必要がある。

> R-08 Reviewer note: 現在の`eslint.config.mjs`は`.claude/**`を除外し、レビュー時のlintは成功した。`timeout-30s-verification-20261025.md` 自身が、この設定の承認経緯は未検証とする。アプリの`src/app`を除外する設定は見当たらないが、除外導入の由来と承認は未記録。

> R-09 Reviewer note: `timeout-30s-verification-20261025.md` は全体テスト643件から645件への増加を認めるが、追加2件の名前と由来を特定していない。U1対象261件は同数で、今回の30秒変更で新規テストを追加した証拠はない。

> R-10 Reviewer note: `code-generation-plan.md` のStep 5は未チェックで、`code-summary.md` も正式reviewとcheckpointを未実施と明記する。完了状態の先取りは解消した。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Stage-declared validation tools | 指定なし | 追加の専用ツールはない。 |
| `npm run lint` | exit 0、指摘なし | 現行設定でのlint成功を再確認した。 |
| 対象ソース照合 | 3件とも`it`第三引数が30000 | 承認計画の対象と現ソースの設定が一致する。 |

### Summary

対象3件の30秒待機設定と再検証結果は整合し、行カバレッジ85.96%も計画の下限を満たす。スマホ幅と故障時GUI確認は残り、承認前に入った設定の時系列、lint除外の由来、2件増加したテストの出所は、次の判断時に明示して扱う必要がある。
