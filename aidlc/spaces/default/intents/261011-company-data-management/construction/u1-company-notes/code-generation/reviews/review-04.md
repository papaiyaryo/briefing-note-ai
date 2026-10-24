## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-22T17:03:46Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/workspace/CompanyDetail.tsx > move（249〜259行）／「保存済みの最新を再取得」（312〜319行） | 版競合後に入力を保持したまま最新保存内容を確認できない。再取得ボタンはmoveを通り、draftがあると破棄確認を出し、確定するとworkspaceDrafts.discard(target)を実行してからloadする。取消では最新取得が起きないため、企業編集でもメモ編集でも、最新を見て再編集するために元の入力を失う。AC6.3.2とWF6が求める「最新と保持入力を区別して確認」を満たさない。既存callback試験は移動取消時の保持と単独の復帰を確認するが、この競合から最新確認への連続経路を確認していない。 | 最新取得を画面移動による破棄から分け、元のdraftとそのbaselineを保持したまま最新保存版を表示する。本人が確認して再編集するまで旧入力を捨てず、企業・メモの両方で409→最新取得→入力保持→明示再編集の回帰を追加する。 | Resolved (reviewer) |
| R-02 | Major | docs/company-data-setup.md > backup・復旧／scripts/workspace-restore-check.mjs > app_sessionsを含むdumpとfingerprint | 復元手順が以前の有効sessionも戻し、暗号鍵がある場合の全session失効・再認証を必須にしていない。手順は非公開schema全体をbackupし、鍵が揃わない場合だけ失効を求める。実際の復元確認もapp_sessionsの同一性を成功条件にする。隔離実PGとdummy Authで、アプリlogout成功後に古いCookieが認証不可になり、backup時点のsession行を戻すと同じCookieが再び認証可能になることを再現した（外部logout失敗は許容された障害条件）。RD3の「通常のtokenを復元資料へ持ち出さず、復元後は新たに認証」と不一致で、復旧により失効済みCookieを復活させ得る。 | 通常の企業メモbackupからsession/tokenデータを除外するか、復元後・アプリ再開前に復元された全sessionを必ず失効しtokenを消去する手順を必須にする。鍵の有無に関係なく新規ログインを要求し、復元前にlogout済みのCookieが復元後も拒否される検証を追加する。 | Resolved (reviewer) |
| R-03 | Minor | src/lib/server/workspace/repository.ts > deleteConfirmed（539行の期限検査と直後のcompanyRow FOR UPDATE） | 削除確認期限を親企業ロックの取得前にしか検査しない。要求開始時には有効でも、ロック待ち中に期限切れになると、その後に削除を確定できる。実PGの隔離fixtureで期限を600ms後、親ロックの解放を1100ms後に設定し、期限後でもcompany_delete成功になることを再現した。現在の期限試験は要求開始前に期限切れを作るため、この境界を捕捉しない。 | 親ロック取得後、変更を確定する前にも確認期限を検査し、期限切れなら410で対象を残す。親ロック待ちの間に期限を越える競合試験を追加する。確定済み同操作の再送は引き続き期限検査より先に元結果を返す。 | Resolved (reviewer) |
| R-04 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/manual-restart-20261023-root.md > 未確認・限定事項／code-generation-plan.md > Step 10 | 今回の画面受入ではスマホ幅と、最新取得失敗後の入力保持・追加PATCHゼロの連続操作が未確認。390×844の要求に対する実測は2560×1261であり、PCの成功ではスマホでの操作到達性を確かめられない。取得失敗のcallback回帰と旧390px証拠はあるが、今回の計画にあるGUI確認全体の完了は裏付けない。記録と未チェックはこの限界を正しく示している。 | 実測したスマホ幅で企業・メモの競合、最新との別表示、明示再編集・保存の操作到達性を確認する。制御した最新GET失敗で元入力の保持・保存成功表示なし・追加PATCHゼロを画面と通信で確認し、操作・実測幅・期待／実際を記録する。 | New |
| R-05 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/restart-verification-20261022.md > Fresh Commands and Results／Retry — Fresh Verification Completed | 初回全体実行で復元認証2件と実HTTP/PG最新取得1件が既存5000ms上限で失敗し、同条件のRetryでは成功している。これは製品不具合の再現ではないが、重要境界の試験が今回一度は完了せず、原因も未特定のため、継続的に安定した検証ができるかは未解決。成功635件とcoverage値はこの失敗を解消した証明にはならない。 | 次の承認済み検証で再発を追跡し、再発時は当該処理・DB待機・試験資源の状況を内容や秘密を含めず採取して原因を切り分ける。再試行成功だけで原因解消とせず、根拠なくtimeoutや期待値を緩めない。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| 現行stage定義の読取 | validation_tools指定なし | dispatchの単回advisory範囲で実施。npm・build・coverage・previewはレビュー担当から実行していない。 |
| 独立read-only SHA-256照合 | 96file全一致、aggregate e1d869dcb42cab9f57ac4bb5475ba5c1f4bf63e7f7bfd69cbb6a8bbf4b40d435 | 以前読んだ修正実装と同じbytesが保持されている。新たなアプリ実装や人工Redは必要としない。最初の照合コマンドは引用符の構文エラーで未実行となり、書込みなしで訂正した読取照合が成功した。 |
| 独立read-only traceability確認 | upstream146、coverage146、unique146、OK target欠落0 | AC6.3.2・BR6.6・NFR2.6の注記は今回の再検証と実環境未確認を分けている。追跡先の実在を全受入成功とは扱わない。 |
| 実装・契約の照合 | draft/base保持、明示再編集、復元後session全除去、親ロック後の期限検査を確認 | CompanyDetailの最新取得は破棄処理から独立し、全読取が揃った後だけ表示更新する。編集部品と親callbackの再保存停止、共通復元SQL、確定済み操作の先行照合を保持。WF6／WF7・RD3の境界と整合する。 |
| 今回の自動検証記録 | runner24、Repository15、Restore/Auth50、Frontend59、U1 253成功。全体とcoverage各635成功、skip0。lines85.98%、lint/typecheck/build/diff exit0。実dump/restore成功 | 実行担当の記録を評価した結果であり、レビュー担当の独立再実行ではない。初回632/635の失敗とRetryは残され、旧TDDを今回のRedと呼んでいない。新規の振る舞い変更がないため、正常実装を戻してRedを作る必要はない。 |
| 今回のGUI記録 | 企業・メモ各2タブの409→最新取得→元入力と最新値の別表示→Enter再編集→保存200→別タブ最終値一致。追加PATCHゼロ、限定Shift+Tab到達、専用4区間cleanup成功 | PCの連続経路は画面とserver logで裏付けられる。スマホ幅・全フローkeyboard-only・制御GET失敗のGUI確認へは拡張できない。 |

### Summary

既存3修正の実装と今回の再検証には新たな構造的不整合を認めず、Critical 0／Major 1／Minor 1のためREADY。advisory判断として、未完了のGUI受入条件と試験timeoutの再発性を承認時に検討する必要があり、実Auth／Supabase／B利用者切替／Vercel・公開受入やリリース完了を示すものではない。
