## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-20T19:56:47Z
**Iteration:** 2

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/components/workspace/CompanyDetail.tsx > move（249〜259行）／「保存済みの最新を再取得」（312〜319行） | 版競合後に入力を保持したまま最新保存内容を確認できない。再取得ボタンはmoveを通り、draftがあると破棄確認を出し、確定するとworkspaceDrafts.discard(target)を実行してからloadする。取消では最新取得が起きないため、企業編集でもメモ編集でも、最新を見て再編集するために元の入力を失う。AC6.3.2とWF6が求める「最新と保持入力を区別して確認」を満たさない。既存callback試験は移動取消時の保持と単独の復帰を確認するが、この競合から最新確認への連続経路を確認していない。 | 最新取得を画面移動による破棄から分け、元のdraftとそのbaselineを保持したまま最新保存版を表示する。本人が確認して再編集するまで旧入力を捨てず、企業・メモの両方で409→最新取得→入力保持→明示再編集の回帰を追加する。 | Resolved (reviewer) |
| R-02 | Major | docs/company-data-setup.md > backup・復旧／scripts/workspace-restore-check.mjs > app_sessionsを含むdumpとfingerprint | 復元手順が以前の有効sessionも戻し、暗号鍵がある場合の全session失効・再認証を必須にしていない。手順は非公開schema全体をbackupし、鍵が揃わない場合だけ失効を求める。実際の復元確認もapp_sessionsの同一性を成功条件にする。隔離実PGとdummy Authで、アプリlogout成功後に古いCookieが認証不可になり、backup時点のsession行を戻すと同じCookieが再び認証可能になることを再現した（外部logout失敗は許容された障害条件）。RD3の「通常のtokenを復元資料へ持ち出さず、復元後は新たに認証」と不一致で、復旧により失効済みCookieを復活させ得る。 | 通常の企業メモbackupからsession/tokenデータを除外するか、復元後・アプリ再開前に復元された全sessionを必ず失効しtokenを消去する手順を必須にする。鍵の有無に関係なく新規ログインを要求し、復元前にlogout済みのCookieが復元後も拒否される検証を追加する。 | Resolved (reviewer) |
| R-03 | Minor | src/lib/server/workspace/repository.ts > deleteConfirmed（539行の期限検査と直後のcompanyRow FOR UPDATE） | 削除確認期限を親企業ロックの取得前にしか検査しない。要求開始時には有効でも、ロック待ち中に期限切れになると、その後に削除を確定できる。実PGの隔離fixtureで期限を600ms後、親ロックの解放を1100ms後に設定し、期限後でもcompany_delete成功になることを再現した。現在の期限試験は要求開始前に期限切れを作るため、この境界を捕捉しない。 | 親ロック取得後、変更を確定する前にも確認期限を検査し、期限切れなら410で対象を残す。親ロック待ちの間に期限を越える競合試験を追加する。確定済み同操作の再送は引き続き期限検査より先に元結果を返す。 | Resolved (reviewer) |

> R-01 Reviewer note: `src/components/workspace/CompanyDetail.tsx` の `load` と最新再取得ボタンを確認。再取得は `move`／`discard` を通らず、必要な読取が全て成功した後だけ保存版を更新する。企業・メモの元draftとbaseVersionは保持され、版が異なる間は親callbackと編集部品の双方で保存を止める。CompanyForm／MemoEditorの明示再編集だけが保持入力を新baselineへ移す。`tests/u1-company-notes/uiCallbacks.tsx` の企業・メモ各409→最新取得→元draft/base一致→再編集前PATCH増加なし→明示再編集→新expectedVersion・新operationIdで保存のassertion、取得失敗・移動取消・参照タブの回帰を照合した。手動記録も2画面の最終値一致を扱っている。

> R-02 Reviewer note: `docs/company-data-setup.md` のbackup・復旧は通常dumpのsession行除外と、古いdumpを含む復元後・再開前の全session/token除去を必須にし、鍵が揃う場合も新ログインを要求する。`scripts/workspace-restore-check.mjs` は `--exclude-table-data`、通常復元sessionゼロ、古いsession投入後の共通SQL適用、企業データとDDL指紋の一致を別々に確認する。`db/maintenance/reset-restored-sessions.sql` は検査した専用schemaのsession全行をtransaction内で除去する。`tests/u1-company-notes/restore.integration.test.ts` は外部logout失敗後の旧Cookie復活を対照に、同じSQL適用後の旧・有効Cookie拒否、tokenゼロ、データ不変、新login、再実行を本物のAccessControl／実PGで確認するassertionを持つ。

> R-03 Reviewer note: `src/lib/server/workspace/repository.ts` の `deleteConfirmed` は親企業のロック取得直後にも `expires_at <= Date.now()` を検査し、対象変更前にconfirmation_expiredを返す。既存executeの確定操作照合がこの処理より先にある順序を維持する。`tests/u1-company-notes/repository.integration.test.ts` は企業・メモ双方で実PGのLock待機を有限barrierで観測してから時計を期限後へ進め、対象・操作不変を検査する。now=expiry、期限内削除、期限後の成功再送も個別に検査する。

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| stage frontmatter確認 | validation_toolsの指定なし | 今回のdispatchに従いnpm・build・preview等の書込みを伴う検証は再実行していない。 |
| 独立read-only SHA-256照合 | 96file、mismatch 0、aggregate一致：e1d869dcb42cab9f57ac4bb5475ba5c1f4bf63e7f7bfd69cbb6a8bbf4b40d435 | 読み取ったsourceは凍結された指紋記録と一致する。 |
| 独立read-only traceability JSON／target確認 | upstream 146、coverage 146、unique 146、OK target欠落0 | 追跡IDの件数・一意性と実在する対応先を確認。これだけで全受入成功とはしていない。 |
| 実装・回帰assertion照合 | 3所見の修正分岐と回帰条件が一致 | 最新取得と明示再編集、復元後の認証拒否、ロック待ち後の期限拒否を読み取りで追跡できた。 |
| TDD／最終品質記録の評価 | 記録上U1 253/253、全体607/607、skip0、lines84.69%、lint/typecheck/build exit0 | bugfix-evidence.mdとcode-summary.mdは不具合Red、試験訂正、環境失敗、最終成功を区別する。これは実装担当の実行証拠であり、レビュー担当の独立再実行結果ではない。 |
| 手動画面記録の評価 | 企業・メモの409→最新確認→保持入力→Enter再編集→保存→別画面一致、390px実測、参照タブ修正後確認を記録 | manual-revision-03-root.mdは表示幅・各run・未確定操作・cleanupを区別している。今回レビューはブラウザを操作していない。 |

### Summary

単一のadvisory再確認として、U1の既知3所見は全てFixed、新しい具体的な所見はない。共有契約の本人・版・成功再送・情報区分を維持する修正であり、実Auth／Supabase／Vercel・公開受入や後続Unitの完了を意味しない。
