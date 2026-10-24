# U1：30秒待機予算の検証記録（2026-10-24）

## 範囲と方法

承認済み改訂6の3件だけ、既存 `it` の第三引数を `30000` に変更した。対象は uiCallbacks.tsx の AC6.3.2 latest取得と元入力保持、および restore.integration.test.ts の外部logout失敗Cookie拒否・別session拒否。assertion、UI waitFor 4000ms/interval20、40ms unknown、hook、製品期限、並列設定、実PG/Auth/handler、fixture初期化とcleanupは変更していない。新規テストなし。純粋なテスト待機設定変更なので計画どおり人工的TDD Red/Green/Refactorは非適用。

Node v22.20.0 の既存実行ファイルを指定し、PATHとdummy localhost/workspace_test接続設定はプロセスローカルに設定。Vitest 4.1.8/v8 4.1.8、coverage include全src/app・lines下限80を確認した。fixtureLifecycle.test.tsの存在を確認した。秘密情報や生テスト出力は保存しない。

## 実行結果

| 順 | コマンド | 結果 | 件数・経過 |
|---|---|---|---|
| 1 | `npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false` | exit 0 | 1 file / 24 tests passed、skip 0。Vitest 1.69秒、コマンド6.276秒 |
| 2 | `docker compose -f compose.test.yml up -d --wait` | exit 1、環境権限失敗 | Docker config読取とdocker_engine named pipe接続がpermission denied。テスト件数なし。ツール報告経過0秒（実処理未開始）。DB resetなし |

schema readinessは1回のみ。環境失敗をTDD Redと扱わない。Docker起動失敗で承認計画の停止条件に達したため、自動再試行・権限昇格・DB診断・追加緩和をせず停止した。通常fixture cleanupを必要とする実DBテストは未開始で、今回のcleanup失敗は観測していない。これは実DB cleanupの成功証拠ではない。

## 未実行

- Step 3 の対象2ファイル回帰。3件が30000ms以内で期待結果を満たすかは未検証。
- Step 4 のU1全体（fixtureLifecycleを含む）、lint、typecheck、npm test、coverage、build、diff check。
- Step 5 の正式reviewと公式checkpoint（root所有）。

Step 1はschema runner確認成功後、DB readinessで停止したため未完了。Step 2のみ完了。既往の失敗・成功履歴は本結果へ読み替えない。性能原因は未特定のまま。性能実測/最適化、未完了B1の所有識別・子exit回収、未開始DB観測、上流p95受入は後続であり、30秒設定だけで解決/達成と扱わない。U1全受入・U2/U3・本番完了を意味しない。

## 本人Retry後の継続

上記は停止時点の履歴として保持する。本人のRetry選択をrootが公式記録しUnitをresumeした後、rootによる同じDocker準備コマンドの適切な権限での実行はexit 0、postgres Running / Healthyとなった。schema readinessとDockerをこの継続作業で再実行していない。Step 1の残るDB準備が完了した。

既存Node v22.20.0をprocess-local PATHに設定し、dummy providersとlocalhost/workspace_testのみを指定した。authoritative testing briefを再取得し同じTesting Contractを確認。対象3件のit第三引数30000を再確認し、sourceは再変更していない。U1 exact commandの17ファイルの存在も確認した。

| 順 | コマンド | 結果 | 件数・経過・証拠 |
|---|---|---|---|
| 3 | `npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false` | exit 0 | 2 files / 52 tests passed、skip 0。Vitest 7.27秒、コマンド12.484秒。timeout-30s-target-retry.log |
| 4 | unit-test-instructions.md Whole U1の17 exact files command（末尾`--passWithNoTests=false`） | exit 0 | 17 files / 261 tests passed、skip 0。Vitest 22.92秒、コマンド27.447秒。timeout-30s-u1-retry.log |

指定3件を含む対象回帰と、fixtureLifecycleを含むU1全件が成功した。個別所要時間は標準reporterが出力していない。全件成功から各試験の設定上限内成功を確認し、個別性能値を推定しない。cleanup失敗の報告なし。診断outer runnerは起動していない。Step 4の残る品質検証とStep 5、root所有review/checkpointは進行中。

## 継続後の停止結果 — lint

次の指定コマンド`npm run lint`はexit 1。ESLintは65 problems（25 errors / 40 warnings）を報告した。ログはtimeout-30s-lint-retry.log。通常のESLint規則違反であり、sandbox／DB接続失敗やTDD Redではない。末尾には.claude/tools/aidlc-utility.tsのunused-vars、aidlc.tsのno-require-imports／prefer-const等が含まれる。新たな修復・除外・規則緩和・再試行は実施していない。コマンド実所要時間は収集しておらず推定しない。

Step 4はU1回帰まで成功し、lint失敗で未完了。後続のtypecheck、npm test、coverage、build、diff checkは未実行。Step 5とroot所有のreview／正式checkpointも未実行。計画の完了チェックはStep 1/2/3だけである。全app/src coverage80%以上は今回未測定で、過去のcoverage値を今回の値へ読み替えない。3件のtimeout設定は変更済みで対象/U1は成功したが、Unit全体やreleaseの完了を意味しない。

## lint再確認を飛ばす本人指示後の継続結果

本人は「claudeがlint対象外に下から次の作業に移って」に続いて「そこの処理を飛ばして先に移って」と指示した。rootの解釈に従い、lint再確認を省略して残りの承認済み検証を順次1回ずつ実行した。外部でのlint除外変更はこの継続では検証していない。最新の独立lint結果は上記exit1のままであり、lint合格・免除とは記録しない。rootはUnitを公式resume済み。testing-posture briefは取得成功し、同じTesting Contractのhashを確認した。

既存Node22のprocess-local PATHとdummy localhost/workspace_test接続を用いた。readiness、Docker、対象回帰、U1、lintは再実行していない。下記の順序で各コマンドを1回のみ実行した。

| 順 | コマンド | 結果 | 件数・経過・証拠 |
|---|---|---|---|
| 5 | `npm run typecheck` | exit 0 | コマンド8.850秒。timeout-30s-typecheck-continue.log |
| 6 | `npm test` | exit 0 | 56 files / 643 tests passed、skip 0、Vitest35.04秒。timeout-30s-test-continue.log |
| 7 | `npm test -- --passWithNoTests=false --coverage` | exit 0 | 56 files / 643 tests passed、skip 0、Vitest33.99秒。timeout-30s-coverage-continue.log |
| 8 | `npm run build` | exit 0 | Next.js build完了。timeout-30s-build-continue.log。総実所要時間は未収集 |
| 9 | `git diff --check` | exit 0 | 出力なし、1.368秒。timeout-30s-diff-continue.log |

全app/srcのlines85.95%（2962/3446）、statements84.33%（3134/3716）、branches76.16%（2106/2765）、functions82.42%（769/933）。既存の計測対象・v8 provider・lines80%下限を維持。coverage/coverage-summary.jsonおよびcoverage/index.htmlを生成した。今回のcoverageは過去値の転記ではなく上記実行結果。全体testとcoverageにcleanup失敗の報告なし。fixtureLifecycleも既定収集から除外していない。診断outer runnerは未起動。

独立lintの再確認が未完了のためStep 4は未チェック、review／正式checkpointを含むStep 5も未チェックのまま。code-summaryと該当traceの証跡注記を更新したが、Unit・品質全体・release完了を宣言していない。source-manifestは指定2 test filesと既存診断途中のファイルを含む累積対象を保持しており、今回新しいapplication sourceを書いていないため対象追加／削除はない。146 IDsとDeferred、旧TDD証跡、未完了B1・GUI・実環境・性能受入を保持する。
