## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-19T04:37:54Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/workspace/CompanyDetail.tsx > move（249〜259行）／「保存済みの最新を再取得」（312〜319行） | 版競合後に入力を保持したまま最新保存内容を確認できない。再取得ボタンはmoveを通り、draftがあると破棄確認を出し、確定するとworkspaceDrafts.discard(target)を実行してからloadする。取消では最新取得が起きないため、企業編集でもメモ編集でも、最新を見て再編集するために元の入力を失う。AC6.3.2とWF6が求める「最新と保持入力を区別して確認」を満たさない。既存callback試験は移動取消時の保持と単独の復帰を確認するが、この競合から最新確認への連続経路を確認していない。 | 最新取得を画面移動による破棄から分け、元のdraftとそのbaselineを保持したまま最新保存版を表示する。本人が確認して再編集するまで旧入力を捨てず、企業・メモの両方で409→最新取得→入力保持→明示再編集の回帰を追加する。 | Unresolved |
| R-02 | Major | docs/company-data-setup.md > backup・復旧／scripts/workspace-restore-check.mjs > app_sessionsを含むdumpとfingerprint | 復元手順が以前の有効sessionも戻し、暗号鍵がある場合の全session失効・再認証を必須にしていない。手順は非公開schema全体をbackupし、鍵が揃わない場合だけ失効を求める。実際の復元確認もapp_sessionsの同一性を成功条件にする。隔離実PGとdummy Authで、アプリlogout成功後に古いCookieが認証不可になり、backup時点のsession行を戻すと同じCookieが再び認証可能になることを再現した（外部logout失敗は許容された障害条件）。RD3の「通常のtokenを復元資料へ持ち出さず、復元後は新たに認証」と不一致で、復旧により失効済みCookieを復活させ得る。 | 通常の企業メモbackupからsession/tokenデータを除外するか、復元後・アプリ再開前に復元された全sessionを必ず失効しtokenを消去する手順を必須にする。鍵の有無に関係なく新規ログインを要求し、復元前にlogout済みのCookieが復元後も拒否される検証を追加する。 | Unresolved |
| R-03 | Minor | src/lib/server/workspace/repository.ts > deleteConfirmed（539行の期限検査と直後のcompanyRow FOR UPDATE） | 削除確認期限を親企業ロックの取得前にしか検査しない。要求開始時には有効でも、ロック待ち中に期限切れになると、その後に削除を確定できる。実PGの隔離fixtureで期限を600ms後、親ロックの解放を1100ms後に設定し、期限後でもcompany_delete成功になることを再現した。現在の期限試験は要求開始前に期限切れを作るため、この境界を捕捉しない。 | 親ロック取得後、変更を確定する前にも確認期限を検査し、期限切れなら410で対象を残す。親ロック待ちの間に期限を越える競合試験を追加する。確定済み同操作の再送は引き続き期限検査より先に元結果を返す。 | Unresolved |

> R-01 Reviewer note: `src/components/workspace/CompanyDetail.tsx` > `move`（251〜262行）と保存済みの最新を再取得するボタン（316〜324行）を再確認した。最新取得も `move` を経由し、draft があれば確認後に `workspaceDrafts.discard(target)` を実行する。取消では取得されない。競合後の保持入力と最新保存版を並行して確認する経路は依然なく、企業・メモ両方の保持入力を残した最新取得と明示再編集、および連続経路の回帰確認が必要。今回の期限試験修正はこの動作を変更していない。

> R-02 Reviewer note: `docs/company-data-setup.md` > backup・復旧（23〜31行）と `scripts/workspace-restore-check.mjs` > dump・fingerprint を再確認した。非公開schema全体のbackupと `app_sessions` を含む同一性確認が残り、全session失効は鍵がない場合に限定されている。鍵がある復元でも再開前の全session失効・token消去を必須にするか、通常backupからsession/tokenを除外し、復元前にlogoutしたCookieが復元後も拒否される確認が必要。以前の再現を解消する変更はなく、今回PG再現は実施していない。

> R-03 Reviewer note: `src/lib/server/workspace/repository.ts` > `deleteConfirmed` の期限検査（539〜540行）は親企業の `FOR UPDATE`（541行）より前だけにある。ロック取得後、削除までに期限を再検査しないため、待機中の期限超過を拒否できない。親ロック後の期限検査と待機中に期限を越える回帰確認が依然必要。確定済み同操作の再送は元結果を先に返す必要がある。今回の期限試験修正はこの処理を変更していない。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Node 22によるmanifest・fingerprint照合 | PASS：91 claimsを94実ファイルへ展開し、個別hashおよび集約 `4f419fdb5da964d28f61d712638557e56a497cf780389c508ea47578e293510c` が一致 | 現在のsourceと記録の対応を確認した。manifestはbaselineと同一で、無関係なclaimの追加は検出しなかった。 |
| 修正baseline・修正前本文との比較 | PASS：baselineとの差分は `tests/u1-company-notes/routes.test.ts` と `docs/session-handoff.md`。修正前本文のhash一致、既存18ケースの本文不変を確認 | 承認対象の最後の期限試験、必要なimport・注記の変更と引継ぎ記録の更新に限定される。現在の対象試験hashは `33733741017a5208c0b8e5f0b1cd5d9b98ec00a1f94338905adeacf1474374c5`。 |
| TypeScript構文検査・実処理との静的照合 | PASS：対象試験・`requestScope.ts`・`database.ts` の構文診断0件 | 制御したPool/PoolClientと時計を使い、実WorkspaceDatabaseと実requestScopeでCOMMIT到達後の40ms期限超過、`operation_unknown`、接続破棄と後始末を確認する試験である。SQLの実原子性や実PG性能をこの試験だけで証明する主張はしていない。 |
| `aidlc engine sensor-traceability --output-path aidlc/spaces/default/intents/261011-company-data-management/construction/u1-company-notes/code-generation/traceability.json --stage code-generation` | PASS：findings 0、各gap・invalid targetなし | 146件の一意なtrace IDと参照先を確認。AC6.3.2・BR6.6・NFR2.6は既知所見に対応したDeferredとして残っている。 |
| 計画・Q&A・完了証拠の照合 | PASS（文書・sourceの照合） | 計画改訂2の実回答による承認、修正前失敗、制御試験の失敗から修正までの経緯、最終検証記録を確認。提出証拠は587試験成功・lines 83.50%・lint/typecheck/build成功。レビューではnpm・試験・preview・実PG再現を起動しておらず、これらの成功を独立再実行結果とは扱わない。 |

### Summary

今回の単一試験修正に新たな実質所見はない。既存のMajor 2件・Minor 1件は未解消のままであり、規定の判定基準ではREADYとする。この判定は既知不備への本人のrisk acceptanceや機能受入完了を意味せず、今回の承認範囲も拡張しない。
