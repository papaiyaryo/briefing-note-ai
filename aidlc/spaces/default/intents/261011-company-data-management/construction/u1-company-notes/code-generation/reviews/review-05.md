## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-24T09:33:28Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/workspace/CompanyDetail.tsx > move（249〜259行）／「保存済みの最新を再取得」（312〜319行） | 版競合後に入力を保持したまま最新保存内容を確認できない。再取得ボタンはmoveを通り、draftがあると破棄確認を出し、確定するとworkspaceDrafts.discard(target)を実行してからloadする。取消では最新取得が起きないため、企業編集でもメモ編集でも、最新を見て再編集するために元の入力を失う。AC6.3.2とWF6が求める「最新と保持入力を区別して確認」を満たさない。既存callback試験は移動取消時の保持と単独の復帰を確認するが、この競合から最新確認への連続経路を確認していない。 | 最新取得を画面移動による破棄から分け、元のdraftとそのbaselineを保持したまま最新保存版を表示する。本人が確認して再編集するまで旧入力を捨てず、企業・メモの両方で409→最新取得→入力保持→明示再編集の回帰を追加する。 | Resolved (reviewer) |
| R-02 | Major | docs/company-data-setup.md > backup・復旧／scripts/workspace-restore-check.mjs > app_sessionsを含むdumpとfingerprint | 復元手順が以前の有効sessionも戻し、暗号鍵がある場合の全session失効・再認証を必須にしていない。手順は非公開schema全体をbackupし、鍵が揃わない場合だけ失効を求める。実際の復元確認もapp_sessionsの同一性を成功条件にする。隔離実PGとdummy Authで、アプリlogout成功後に古いCookieが認証不可になり、backup時点のsession行を戻すと同じCookieが再び認証可能になることを再現した（外部logout失敗は許容された障害条件）。RD3の「通常のtokenを復元資料へ持ち出さず、復元後は新たに認証」と不一致で、復旧により失効済みCookieを復活させ得る。 | 通常の企業メモbackupからsession/tokenデータを除外するか、復元後・アプリ再開前に復元された全sessionを必ず失効しtokenを消去する手順を必須にする。鍵の有無に関係なく新規ログインを要求し、復元前にlogout済みのCookieが復元後も拒否される検証を追加する。 | Resolved (reviewer) |
| R-03 | Minor | src/lib/server/workspace/repository.ts > deleteConfirmed（539行の期限検査と直後のcompanyRow FOR UPDATE） | 削除確認期限を親企業ロックの取得前にしか検査しない。要求開始時には有効でも、ロック待ち中に期限切れになると、その後に削除を確定できる。実PGの隔離fixtureで期限を600ms後、親ロックの解放を1100ms後に設定し、期限後でもcompany_delete成功になることを再現した。現在の期限試験は要求開始前に期限切れを作るため、この境界を捕捉しない。 | 親ロック取得後、変更を確定する前にも確認期限を検査し、期限切れなら410で対象を残す。親ロック待ちの間に期限を越える競合試験を追加する。確定済み同操作の再送は引き続き期限検査より先に元結果を返す。 | Resolved (reviewer) |
| R-04 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/manual-restart-20261023-root.md > 未確認・限定事項／code-generation-plan.md > Step 10 | 今回の画面受入ではスマホ幅と、最新取得失敗後の入力保持・追加PATCHゼロの連続操作が未確認。390×844の要求に対する実測は2560×1261であり、PCの成功ではスマホでの操作到達性を確かめられない。取得失敗のcallback回帰と旧390px証拠はあるが、今回の計画にあるGUI確認全体の完了は裏付けない。記録と未チェックはこの限界を正しく示している。 | 実測したスマホ幅で企業・メモの競合、最新との別表示、明示再編集・保存の操作到達性を確認する。制御した最新GET失敗で元入力の保持・保存成功表示なし・追加PATCHゼロを画面と通信で確認し、操作・実測幅・期待／実際を記録する。 | Unresolved |
| R-05 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/restart-verification-20261022.md > Fresh Commands and Results／Retry — Fresh Verification Completed | 初回全体実行で復元認証2件と実HTTP/PG最新取得1件が既存5000ms上限で失敗し、同条件のRetryでは成功している。これは製品不具合の再現ではないが、重要境界の試験が今回一度は完了せず、原因も未特定のため、継続的に安定した検証ができるかは未解決。成功635件とcoverage値はこの失敗を解消した証明にはならない。 | 次の承認済み検証で再発を追跡し、再発時は当該処理・DB待機・試験資源の状況を内容や秘密を含めず採取して原因を切り分ける。再試行成功だけで原因解消とせず、根拠なくtimeoutや期待値を緩めない。 | Unresolved |
| R-06 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/code-summary.md > 最新の継続結果 — lint再確認を省略、残り検証は成功 | 独立lintの最新実行は25 errors／40 warningsで失敗。外部で追加された.claude等の除外設定は実行で確認されていないため、現在の設定でlintが成功するかは未確定。記録はこの限界を正しく示している。 | 次の承認済み品質確認でnpm run lintを実行し、現在の設定での結果を記録する。それまではlint成功・品質全体合格・リリース検証完了と扱わない。今回省略した再確認を成功として補完しない。 | New |

> R-04 Reviewer note: 実測スマホ幅での企業・メモ競合、最新との別表示、明示再編集・保存、および制御した最新GET失敗後の入力保持・成功表示なし・追加PATCHゼロのGUI確認は未完了。code-summary.mdの「画面確認と計画との差」「残る限界」と改訂6はこの範囲を残している。PC結果とcallback試験をスマホ受入の完了へ読み替えず、実測幅・操作・画面／通信の期待と実際を残す必要がある。

> R-05 Reviewer note: 承認された3件のit第三引数30000をソースで確認した。対象52件、U1 261件、全体643件の成功記録は現在の待機予算での完了を示すが、以前5000msで完了しなかった原因の特定や継続的安定性の証明ではない。次の承認済み検証で再発を追跡し、再発時は処理・DB待機・試験資源を秘密や本文を含めず切り分ける。30秒への変更は本人承認済みであり、製品期限・p95達成の証拠とはしない。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| stage定義・計画・証跡・traceability・source-manifestの読取照合 | code-generationの追加validation tool指定なし。改訂6の対象と未完了範囲を照合 | U2/U3、実環境性能、GUI残項目、Productionは完了に繰り上げていない。 |
| 対象テストソースの読取照合 | uiCallbacks.tsx:686、restore.integration.test.ts:99/106は30000。UI内waitForは4000を保持 | 試験単位の待機予算と、画面・製品の期限を区別している。 |
| 承認済み検証の最新記録 | typecheck、全体test 56files/643tests・skip0、coverage lines85.95%、build、diff checkは成功。対象52件／U1 261件も成功記録あり | 実行証跡のレビュー結果。今回のレビューでは追加実行していない。性能・GUI・Production受入の代替にはならない。 |
| lintの最新記録 | FAIL、25 errors／40 warnings。本人指示により再確認を省略 | 外部除外変更後の合格は未確認。上記Minorとして残す。 |
| aidlc engine now | 2026-10-24T09:33:28Z | レビュー日時。 |

### Summary

承認された3件の試験待機予算変更と既存契約との間に、新たな重大な実装矛盾は確認しなかった。残存1 Major／2 Minorを伴う助言レビューとしてREADYとするが、スマホ・取得失敗GUI、原因切分け、lint合格、実環境性能およびリリース全体の完了を示すものではない。
