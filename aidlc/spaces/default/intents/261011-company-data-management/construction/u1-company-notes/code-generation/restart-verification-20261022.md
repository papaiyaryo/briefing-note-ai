# U1：コード生成やり直しの再検証（2026-10-22）

## Scope and Current State

本人のCode Generationやり直しとU1改訂3計画の再承認を受け、既存の3修正を保持して再検証を開始した。今回の担当はアプリ・テスト・設定を変更していない。既存dirty、U2/U3、別作業ツリーは維持した。現在branch表示は`release/bolt-002-company-data-management-local`。

旧[修正証拠](bugfix-evidence.md)に記録したRepository・Restore・FrontendのRed→Green→Refactorは前回実行の履歴であり、今回新たに失敗を作った証拠ではない。正常なコードを戻して人工Redを作らず、同じ回帰を再検証する方針。旧[手動確認](manual-revision-03-root.md)も2026-10-21の履歴として保持する。

## Fresh Commands and Results

既存Node22.23.3をprocess-local PATHで選択し、明示cmd.exeから実行。依存の再インストール、runner/config、assertion、timeout、coverage条件の変更なし。実サービス・秘密値は使用しない。

| command | 今回の結果 |
|---|---|
| `npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false` | exit0、1file、24/24、skip0、1.32秒。18:24:39開始 |
| `npm test` | **exit1**、55files中53成功・2失敗、635件中632成功・3失敗、skip0、39.68秒。18:25:50開始 |

全体baselineで次の3件が既存5000ms上限に到達した。

| location | case | 実出力 |
|---|---|---|
| `tests/u1-company-notes/restore.integration.test.ts:83` | 外部logout失敗でもアプリlogout済みCookieは復元再開後に拒否 | `Test timed out in 5000ms.`、5019ms |
| `tests/u1-company-notes/restore.integration.test.ts:90` | dump時に有効だった別sessionも再開前に拒否 | `Test timed out in 5000ms.`、5578ms |
| `tests/u1-company-notes/uiCallbacks.tsx:577` | AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する | `Test timed out in 5000ms.`、5026ms |

外部logout失敗のdummy warningも出たが、このwarningは対象試験が意図的に使用する経路であり、タイムアウトの原因を証明しない。今回の3失敗を不具合再現の新しいRedと数えず、環境負荷やコード原因も断定しない。

## Stop and Remaining Work

失敗を確認した時点で停止し、同じコマンドの再実行、修正、timeout延長をしていない。親担当へ実コマンド・exit・件数・3箇所を通知した。本人のRetry判断後に再開する。

今回未実施：Repository exact、Restore/Auth exact、実pg_dump/pg_restore全手順、Frontend exact、U1 exact16file、lint、typecheck、coverage、build、diff check。今回coverage値は未計測。635/635・85.95%等の前回値は今回の成功へ転記しない。

今回GUIは未実施で、Step10は完了扱いにしない。企業・メモ各2クライアント競合→最新取得→入力保持→明示再編集→確定保存、取得失敗時の入力保持・追加PATCHゼロ、PC/スマホ/キーボードの今回確認を親担当へ引き継ぐ。専用preview、browser tab、schema、processは今回作成していない。

計画checkboxは変更していない。全体baseline失敗のためStep1を完了とせず、後続の履歴Redを今回完了としてtickしない。summary、traceability、manifest、source指紋、引継ぎ、公式レビュー・checkpoint・lifecycleは親担当が所有する。

実Supabase/PostgreSQL17.11、実本人Auth、実B切替、外部API、実CI、Vercel・本番・release完了は未確認のまま。U2/U3の本人受容済み所見をU1から修正しない。

## Sources

- [承認済み計画](code-generation-plan.md)、[U1 exact試験手順](unit-test-instructions.md)。
- [前回TDDと品質の履歴](bugfix-evidence.md)、[前回の画面確認](manual-revision-03-root.md)。
- [親担当の現在source照合](restart-source-check.md)。

## Retry — Fresh Verification Completed

本人の明示Retry後、同じNode22・ソース・期待値・5000ms・configのまま`npm test`を1回再実行し、635/635成功した。上の632/635失敗は履歴として残し、原因が解消したとの推定は行わない。続いて未実施だった承認済みコマンドを直列実行した。

| command | 今回Retry後の実結果 |
|---|---|
| `npm test` | exit0、55files、635/635、skip0、26.41秒、19:23:04開始 |
| `npm test -- tests/u1-company-notes/repository.integration.test.ts --passWithNoTests=false` | exit0、1file、15/15、skip0、4.73秒 |
| `npm test -- tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/auth.test.ts --passWithNoTests=false` | exit0、3files、50/50、skip0、5.74秒 |
| `node scripts/workspace-restore-check.mjs` | exit0、実pg_dump custom / pg_restore PostgreSQL17、専用DB/schema/dump cleanup成功 |
| `npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/draft.test.ts --passWithNoTests=false` | exit0、2files、59/59、skip0、4.96秒 |
| [試験手順](unit-test-instructions.md)のU1 exact16file command | exit0、16files、253/253、skip0、17.34秒 |
| `npm run lint` | exit0、warning出力なし |
| `npm run typecheck` | exit0 |
| `npm test -- --passWithNoTests=false --coverage` | exit0、55files、635/635、skip0、24.67秒 |
| `npm run build` | exit0、Next.js15.5.19、compile・lint/type・18/18 static生成・route/build trace完了 |
| `git diff --check` | exit0、既存LF→CRLF警告のみ。tracked差分の検査でありuntracked全ファイルの検査ではない |

今回全app/src coverageはlines **85.98%（2963/3446）**、statements84.36%（3135/3716）、branches76.13%（2105/2765）、functions82.42%（769/933）。既存v8/対象/下限を変更せずlines80%以上を満たした。通常レポートはGit管理外の`coverage/`。前回85.95%を転記した値ではない。

復元scriptは通常dumpのsession行0、古いdump相当で復元したsession全除去、鍵によらず再ログイン必須、企業・メモ・成功操作のowner/ID/版/内容指紋とDDL指紋の一致、別ownerへのRLS非開示を確認した。`dedicatedRestoreDatabaseAndSchemaRemoved:true`が実出力され、exit0。dump本体やCookie/tokenは記録しない。実外部backup未確認の出力も保持する。

Repositoryの親ロック後期限検査と成功操作先行照合、共通復元SQL、元draft/baseと最新表示の分離、本人の明示再編集、参照tabと編集停止の分離を既存コード・対象回帰で再確認した。新たな不具合修正・refactor・新規テスト追加は不要で、既存の有効なTDDを壊して再現していない。今回の成功コマンドを新しいRed→Green実装の記録とは呼ばない。

Step1、3、4、6、7、9、11は今回の再検証に対応してcheckedとする。Step2、5、8のRedは前回の履歴だけで今回再実行していないためuncheckedのまま。Step10の今回GUIとStep12の親担当による最終summary/trace/hash・引継ぎ・自己reviewは未完了のままにする。履歴の再利用・最終完了の判断は公式review/checkpointを所有する親担当へ返す。

今回GUIなし。親担当が既存previewで操作確認するまで、PC/スマホ/キーボードの新しい成功を主張しない。今回専用preview/tab/schema/processは作成していない。重い試験・restore・buildは全て終了済み。本人認証を要する実環境・公開確認の制限は上記のまま。
