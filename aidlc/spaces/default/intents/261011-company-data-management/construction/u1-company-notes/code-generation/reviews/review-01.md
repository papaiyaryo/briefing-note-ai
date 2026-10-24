## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-16T01:34:09Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/workspace/CompanyDetail.tsx > move（249〜259行）／「保存済みの最新を再取得」（312〜319行） | 版競合後に入力を保持したまま最新保存内容を確認できない。再取得ボタンはmoveを通り、draftがあると破棄確認を出し、確定するとworkspaceDrafts.discard(target)を実行してからloadする。取消では最新取得が起きないため、企業編集でもメモ編集でも、最新を見て再編集するために元の入力を失う。AC6.3.2とWF6が求める「最新と保持入力を区別して確認」を満たさない。既存callback試験は移動取消時の保持と単独の復帰を確認するが、この競合から最新確認への連続経路を確認していない。 | 最新取得を画面移動による破棄から分け、元のdraftとそのbaselineを保持したまま最新保存版を表示する。本人が確認して再編集するまで旧入力を捨てず、企業・メモの両方で409→最新取得→入力保持→明示再編集の回帰を追加する。 | New |
| R-02 | Major | docs/company-data-setup.md > backup・復旧／scripts/workspace-restore-check.mjs > app_sessionsを含むdumpとfingerprint | 復元手順が以前の有効sessionも戻し、暗号鍵がある場合の全session失効・再認証を必須にしていない。手順は非公開schema全体をbackupし、鍵が揃わない場合だけ失効を求める。実際の復元確認もapp_sessionsの同一性を成功条件にする。隔離実PGとdummy Authで、アプリlogout成功後に古いCookieが認証不可になり、backup時点のsession行を戻すと同じCookieが再び認証可能になることを再現した（外部logout失敗は許容された障害条件）。RD3の「通常のtokenを復元資料へ持ち出さず、復元後は新たに認証」と不一致で、復旧により失効済みCookieを復活させ得る。 | 通常の企業メモbackupからsession/tokenデータを除外するか、復元後・アプリ再開前に復元された全sessionを必ず失効しtokenを消去する手順を必須にする。鍵の有無に関係なく新規ログインを要求し、復元前にlogout済みのCookieが復元後も拒否される検証を追加する。 | New |
| R-03 | Minor | src/lib/server/workspace/repository.ts > deleteConfirmed（539行の期限検査と直後のcompanyRow FOR UPDATE） | 削除確認期限を親企業ロックの取得前にしか検査しない。要求開始時には有効でも、ロック待ち中に期限切れになると、その後に削除を確定できる。実PGの隔離fixtureで期限を600ms後、親ロックの解放を1100ms後に設定し、期限後でもcompany_delete成功になることを再現した。現在の期限試験は要求開始前に期限切れを作るため、この境界を捕捉しない。 | 親ロック取得後、変更を確定する前にも確認期限を検査し、期限切れなら410で対象を残す。親ロック待ちの間に期限を越える競合試験を追加する。確定済み同操作の再送は引き続き期限検査より先に元結果を返す。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| manifest展開・SHA-256再計算 | PASS: 91 claims／94実ファイル。fingerprint 5d814912e29c2801c0b77754d9f145709017944c72ba4233bc865175db4a589a | 依頼時のsourceと一致。新規ファイルと既存差分、route、SQL、試験・補助script、設定・手順を対象に確認し、明らかな無関係claimは見つからなかった。 |
| aidlc engine sensor-traceability | PASS: pass:true、findings_count:0、gaps／orphans／invalid_targets等は空 | 対応表の構造・参照は有効。ただし、上記の連続操作と復元後の失効を証明するものではない。 |
| 隔離実PGによる削除期限境界の再現 | FAIL: expiredBeforeParentUnlock:true、deleted:true | 期限切れの確認から削除が成立するMinor指摘を確認。専用fixtureを終了・削除し、アプリsourceは変更していない。 |
| 隔離実PG・dummy Authによるsession行復元の再現 | FAIL: appLogoutSucceeded:true、旧Cookieは復元前false／復元後true | アプリ側失効後にbackup時点のsessionを戻すと認証が復活することを確認。実Supabaseの試験ではなく、外部logout失敗時にも内部失効で守るという契約の検証。専用fixtureは終了・削除。 |
| 完成sourceと既存検証記録の照合 | 記録上PASS: 336tests／skip0、lines82.48%、lint／typecheck／test／build exit0 | 全アプリのincludeとlines80下限、実PG17・dummy境界、CIのPG serviceを確認。全suiteは重複実行せず、独立実行は上記の懸念確認に限定した。実CI、実Supabase・外部p95、公開受入は未実施として維持する。 |

### Summary

判定基準上はCriticalなし・Major2件のためREADYだが、承認判断には競合後の入力保持と復元時のsession失効の2件を提示する必要がある。認証・所有者RLS・版・成功操作記録・共通HTTPの主要境界は実装され、U2／U3と外部公開の未確認も区別されている。本レビューは修正、実環境適合、Bolt公開完了を意味しない。
