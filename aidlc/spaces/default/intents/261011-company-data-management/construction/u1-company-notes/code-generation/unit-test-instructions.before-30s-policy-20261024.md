# U1：実PG待ち観測・最小修復の検証手順（改訂5）

## Scope and Preconditions

新しいPlan Approval後だけ実行する。計画改訂中は読取と計画／手順／改訂4backup保存だけ。Node22、既存Vitest/v8、dummy Auth、localhost/workspace_test、5000ms test／4000ms UI waitFor／40msunknown、全assertionと既定並列を保つ。元の実PG/handler/Authをfakeへ置換しない。U1既存253件／全体635件は基準であり今回の新規数ではない。

改訂4の個別／全体診断は使い切っており再演しない。ユーザー手元の再現と旧成功は新結果へ転記しない。アプリ／設定／deps／U2/U3／共有handoff編集なし。境界と新しい診断予算はcode-generation-plan.mdを正本とする。

## Runner Readiness — Step 1

```text
npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false
```

新しい観測制御のRed前のrunner確認として1回。schema24件はpure入力契約で、実DB正常の証拠ではない。Node22・v8/全app+src line80と対象file存在を読取確認する。0件・型エラー・DB停止・環境不備をRedにしない。DBは必要時だけ計画の既存compose commandで準備する。

## Diagnostic Control Red Green Refactor — Step 2

```text
npm test -- tests/u1-company-notes/fixtureLifecycle.test.ts --passWithNoTests=false
npm run typecheck
```

新fileが存在してB1試験を追加してからexact test commandを実行する。作成前の0件をRedとしない。B1ではDB/子/時計を注入した制御試験により、今回資源だけのprojection、秘密／raw SQL・stdoutの非保存、PID再利用や登録欠落の拒否、観測query単独上限と600回/60秒上限、子exit回収、成功/失敗/停止時のtimer解除・observer.endを検証する。未実装の期待不成立→最小helper/runner→同じcommandをgreenに保つ整理を記録する。単なるログ文字列を写した試験や人工Redは作らない。

fixtureDiagnostics.tsとscripts/u1-fixture-diagnostics.mjsはこの観測制御だけを実装する。helpers/runtimeFixture/対象2fileへの識別と段階計測を接続する。fixtureの仮説修復はしない。typecheckは1回、失敗時は環境/型不備をRedにせず修正可否をrootへ返す。観測器単体成功を実受入合格と呼ばない。

## Additional Wait Diagnostics — Step 3

初回：
```text
node scripts/u1-fixture-diagnostics.mjs --run first -- npm test
```

初回で取得した具体的な仮説と反証条件を記録した場合に限る2回目：
```text
node scripts/u1-fixture-diagnostics.mjs --run confirm -- npm test
```

外側runnerは任意commandを受け付けず、この固定npm testだけをWindowsの既存cmd経由で子実行する。cwdはroot、既存Node22 PATHとfixture既定のdummy localhost試験DB URLを子だけへprocess-localに明示する。runラベルはfirst/confirmに固定し各回固有UUIDを作る。通常のnpm testに同じtest収集・既定並列を適用し、worker/timeout flagsを追加しない。登録済み公式checkpoint commandも変更しない。

今回run配下のworker別登録に、生成schema、fixture/run UUID、application識別、接続PID/backend_start、stageを保存する。接続文字列、token/cookie、owner値、メモやSQL本文／パラメータは保存しない。接続PIDを起動応答から安全に取得できない場合は同接続でpg_backend_pid()を1回取得し、observerのbackend_start照合で再利用を区別する。識別前にbootstrap等を開始しない。観測器の追加I/Oも経過へ含め、試験枠から準備を隠さない。

観測は独立admin接続1本、URLとcurrent_database()でlocalhost/workspace_test照合後のread-only。pg_stat_activity、pg_locks、pg_blocking_pidsを計画の登録PID/application/backend_start範囲で読む。query全文、DB error detail、認証値、実データを取得・保存しない。直接blockerは同DB内の最小wait情報と今回登録内外の分類だけ。対象外backendへcancel/terminateや権限変更を行わない。

100ms serial間隔、最大600snapshot／開始から60秒。queryは診断接続だけ1000ms上限、接続1000ms上限、前queryと重ねない。子終了でtimer停止し枠内の最後のsnapshot後にobserver.endをfinallyでawaitする。観測期限時は未完了を保持して子exitを回収し、全体90秒でも残る場合だけ自分のrunnerの子を停止して失敗扱い。他テストやDB backendは停止しない。固定sleepで到達を推定しない。権限不足・登録欠落・PID不一致・観測不能は追加権限を勝手に与えず停止する。

子raw stdout/stderrを保存せず、許可した集計/exit/skip/既知file-line/timeout定型文とfixture段階・安全なwait metadataだけをprojectionする。通常consoleの任意error本文を記録へコピーしない。観測loop・子exit・観測接続の終了を別々に確認する。

この最大2回が新予算の全部。旧対象2fileの単独診断は追加しない。初回で原因確認できれば2回目は不要。初回で手掛かりがなく仮説を定義できない場合や、2回目後も因果未特定ならSteps4以降へ進まずrootへ返す。予期した5000ms timeoutは診断結果であり修復Redではない。DB停止など無関係な失敗は公式pauseへ返す。bootstrap区間が長いだけでlock/cacheを原因と決めない。

## Fixture Red Green Refactor — Steps 4 to 6

```text
npm test -- tests/u1-company-notes/fixtureLifecycle.test.ts --passWithNoTests=false
```

実測因果が試験補助にある場合だけB2–B6の必要部分を追加する。B1と合わせ最大6境界、旧成立試験の重複追加なし。bootstrap失敗と接続解放／再試行、migration後始末、初期Auth失敗のpool/schema/admin解放、同DB共有準備の競合／別DB cache分離、fixtureのschema/owner/Auth分離とclose完了を必要に応じ検証する。故障注入を使う単体試験はfixture制御の証拠であり、実AccessControl/旧dump/handlerの代用ではない。

Redの期待不成立→原因に対応する最小fixture修復→同じcommandのGreen→整理して同じcommandのRefactorを記録する。新testを含む実件数とskipを記録し、元5000/4000/40msとassertionを変更しない。製品src/本番SQL/許可外fileが必要なら実装せず再計画へ返す。通常closeは試験内でawaitし、試験終了後へ移してtimeoutから隠さない。

元2fileをそれぞれ1回確認し、その後に既存consumer回帰を実行する。これは修復後の回帰であり診断予算のRetryではない。

```text
npm test -- tests/u1-company-notes/ui.test.ts --passWithNoTests=false
npm test -- tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false
npm test -- tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/auth.test.ts --passWithNoTests=false
npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/draft.test.ts --passWithNoTests=false
```

UIの実保存version一致、元draft値とbaseVersion完全一致を保持。Restoreの旧dumpでlogout cookieが通る対照、共通復元SQL後のlogout cookie/別session拒否、token0/data不変、fresh login、再実行安全を保持する。

## Whole U1 and Shared Fixture Consumers — Step 6

```text
npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/board.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/auth.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/routes.test.ts tests/u1-company-notes/existingRoutes.test.ts tests/u1-company-notes/ui.test.ts --passWithNoTests=false
npm test -- tests/u2-generated-notes/generation.integration.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

実ファイルの存在とconsumerのsetupDatabase/runtimeFixture利用を読み取り確認してから実行する。不在なら名前を推測して実行せず計画修正へ返す。consumerの試験は共有補助修正の退行確認だけで、U2/U3編集やUnit完了を認めない。各テストのschema/owner/認証隔離とcleanup、既存40ms結果不明・RLS・原子性のassertionを維持。


## Whole Quality — Step 7

次を順に、commandごとに直列で実行する。各command内部の既定並列は不変。

```text
npm run lint
npm run typecheck
npm test
npm test
npm test -- --passWithNoTests=false --coverage
npm run build
git diff --check
```

全体2回は修復後再発確認のため事前に定めた2回。失敗時は追加Retryせずrootへ返す。実件数/skip0/exitと全app/srcのline80%以上を記録する。2回成功を恒久的安定の証明にしない。診断用markerを通常コマンドへ渡さず、診断器の観測負荷と通常品質を区別する。

## Official Checkpoint — Step 8

rootが成果物・正式review後、登録済み公式verifierでそのまま実行するcommand：
```text
npm test -- --passWithNoTests=false
```

外側診断runnerへ置換せず、flagsを追加しない。公式start/resume/receiptや本人判断を試験担当が代行しない。checkpoint失敗は品質成功と別に記録し、自動Retryしない。

## Evidence and Cleanup

rootが新証拠へcommand/exit/件数/skip/段階/待ち/判定根拠/未確定事項/今回資源の終了状態を記録する。過去記録は上書きしない。今回登録したexact schema/PIDだけを終了時にread-onlyで照合する。今回所有を証明できないschema、過去残骸、他backendへcleanupを行わない。観測器は自分の接続だけを必ず解放し、子とfixtureのcleanup未確認を隠さない。通常fixture cleanupが失敗したらその失敗と未完了を保持し、修復を上記TDDに戻す。

旧3修正とreview/承認、trace146IDsとDeferred、累積source所有を保持する。U2成果物/reviewは固定。実GUI/実Auth/Supabase/外部API/CI/merge/Vercel本番は今回確認したとしない。原因未特定・観測不能・許可外修正が必要なら停止し、診断予算を増やす新しい案は本人の承認を受ける。
