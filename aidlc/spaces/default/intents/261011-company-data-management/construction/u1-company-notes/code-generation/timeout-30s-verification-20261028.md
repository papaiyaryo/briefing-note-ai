# U1：30秒待機予算の再検証（2026-10-28）

## 範囲と環境

改訂6の再開後、現ソースにある対象3件の `it` 第三引数 `30000` を確認した。アプリ・テストのソースは変更していない。`C:\Program Files\nodejs\node.exe` は v22.20.0 で、各 npm コマンドのプロセスローカル PATH 先頭に指定した。Vitest 4.1.8、coverage-v8 4.1.8。既存設定は `src/**` と `app/**` を計測し、行カバレッジの下限は80%。dummy provider と既存の localhost/workspace_test を使用した。Docker API の状態表示は pipe 権限拒否で読めなかったが、実DBを含む対象回帰とU1全体テストは成功した。DBのvolume操作やcompose起動は行っていない。

設定確認：`uiCallbacks.tsx:686` の実HTTP/PG latest取得、`restore.integration.test.ts:99,106` の復元session拒否。assertion、fixture、cleanup、製品の性能期限は変更していない。待機予算の設定確認なので、計画どおり新しいTDD Redは非適用。過去の成功・失敗を今回の証拠として流用していない。

## 今回の実行結果

以下を承認済み順序で各1回実行した。`npm` コマンドには上記PATH設定のみ付けた。失敗後の再実行はしていない。

| 順 | コマンド | exit | 結果 |
|---|---|---:|---|
| 1 | `npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false` | 0 | 1 file / 24 tests成功、skip 0、Vitest 1.43秒 |
| 3 | `npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false` | 0 | 2 files / 52 tests成功、skip 0、Vitest 6.82秒。対象3件を含む |
| 4a | `unit-test-instructions.md` のWhole U1 exact command（17 files） | 0 | 17 files / 261 tests成功、skip 0、Vitest 20.99秒。fixtureLifecycleを含む |
| 4b | `npm run lint` | 0 | ESLint指摘なし |
| 4c | `npm run typecheck` | 0 | TypeScriptエラーなし |
| 4d | `npm test` | 0 | 56 files / 645 tests成功、skip 0、Vitest 24.02秒 |
| 4e | `npm test -- --passWithNoTests=false --coverage` | 0 | 56 files / 645 tests成功、skip 0、Vitest 25.82秒。全app/src lines 85.96%（2964/3448） |
| 4f | `npm run build` | 0 | Next.js build成功、static pages 18/18 |
| 4g | `git diff --check` | 1 | 公式audit shardの複数行で行末空白。詳細は下記 |

coverageはstatements 84.34%（3136/3718）、branches 76.2%（2111/2770）、functions 82.42%（769/933）。行カバレッジ80%下限は維持した。対象3件は52件の成功に含まれるが、標準reporterは各件の個別所要時間を出さない。30秒以内の機能回帰成功は、性能原因の解消や製品p95目標の達成を示さない。timeout・assertion・cleanup失敗の報告はなかった。

## 停止理由と次の扱い

`git diff --check` は `aidlc/spaces/default/intents/261011-company-data-management/audit/neo-ba01a9a9622f.md` の行末空白を指摘した。`Target` が空の行や過去の `Message` の末尾など計12行であり、U1の担当外で公式tool所有のaudit shardにある。改訂6の「失敗時はRetryせず停止」に従い、auditを手編集せず、コマンドも再実行していない。Step 4は未完了、Step 5の正式review・登録済み公式checkpointも未実施。auditの扱いはorchestratorへ報告した。

U1の既存GUI未確認、B1の未完了、実Supabase/Auth、実外部API、CI、merge/Vercel、性能調査は今回の成功により完了扱いにしない。既存traceabilityのDeferredとsource-manifestの累積対象は維持する。
