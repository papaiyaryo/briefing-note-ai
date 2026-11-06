# U1：30秒待機予算の検証記録（2026-10-25、改訂6の再承認後）

## 範囲と方法

改訂6は再承認された。その後、Step 1〜5を順に新しく実行した。2026-10-24の[前回記録](timeout-30s-verification-20261024.md)は履歴として保持する。前回の結果を今回の結果へ読み替えない。

- Node：既存の `C:\Program Files\nodejs\node.exe`（v22.20.0）をprocess-local PATHの先頭に置いた。既定のVolta Node v24.11.0は使っていない。
- runner：Vitest 4.1.8／@vitest/coverage-v8 4.1.8。vitest.config.tsはnode環境で、coverageの対象はsrc/**とapp/**、lines下限は80。設定は変更していない。
- DB：既存のcompose service `briefing-note-u1-test-postgres-1` が既にUp（healthy）だった。localhost:55432のworkspace_testを使う既定のdummy接続である。そのためcompose upは不要で、実行していない。volumeリセットもしていない。
- 秘密情報や.envは参照していない。生ログはrecordに保存していない。

## Step 2 — 待機上限の確認

3件の第三引数が `30000` であることを確認した。前回のwip commit（46d6b2e）で既に反映済みで、作業ツリーの差分はない。二重編集はしていない。

- tests/u1-company-notes/uiCallbacks.tsx:686：AC6.3.2 実HTTP/PG latest取得のit
- tests/u1-company-notes/restore.integration.test.ts:99：外部logout失敗でもアプリlogout済みCookieは復元再開後に拒否
- tests/u1-company-notes/restore.integration.test.ts:106：dump時に有効だった別sessionも再開前に拒否

他のtimeout、hook、UI waitFor 4000ms/interval20、assertion、fixture、製品の期限は変更していない。今回の変更は待機予算の設定だけなので、計画どおり人工的なTDD Redは作っていない（非適用）。

## 実行結果（各1回、直列）

| 順 | コマンド | exit | 件数・経過 |
|---|---|---|---|
| 1 | `npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false` | 0 | 1 file / 24 tests passed、skip 0。Vitest 1.12秒 |
| 3 | `npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false` | 0 | 2 files / 52 tests passed、skip 0。Vitest 6.44秒、コマンド約10秒 |
| 4a | unit-test-instructions.md「Whole U1」の17 files exact command | 0 | 17 files / 261 tests passed、skip 0。Vitest 23.58秒、コマンド約27秒 |
| 4b | `npm run lint` | 0 | 指摘0。コマンド約17秒 |
| 4c | `npm run typecheck` | 0 | コマンド約8秒 |
| 4d | `npm test` | 0 | 56 files / 645 tests passed、skip 0。Vitest 28.42秒 |
| 4e | `npm test -- --passWithNoTests=false --coverage` | 0 | 56 files / 645 tests passed、skip 0。Vitest 28.26秒 |
| 4f | `npm run build` | 0 | Compiled successfully、static pages 18/18。コマンド約56秒 |
| 4g | `git diff --check` | 0 | 出力なし |

全app/srcのcoverageは、lines **85.96%（2964/3448）**、statements 84.34%（3136/3718）、branches 76.2%（2111/2770）、functions 82.42%（769/933）。lines 80%の下限を満たした。下限や計測対象は変更していない。

対象3件は、全52件が成功したことから30000ms以内に期待結果を満たしたと判断した。標準reporterは個別の所要時間を出さないため、個別の性能値は推定しない。cleanup失敗やtimeoutの報告はなかった。fixtureLifecycle.test.tsも既定収集・U1 commandの両方に含まれ、除外していない。診断用の外側runnerは起動していない。

## 前回との差

- lint：前回（2026-10-24）は65 problems（25 errors / 40 warnings）でexit 1だった。今回はexit 0。現行のeslint.config.mjsのignoresに `.claude/**` が含まれている。これはwip commit 46d6b2eまでに既に入っていた設定で、この作業では変更していない。公式runtimeをアプリlintから外すproject方針と一致する。ただし、変更の承認経緯をこの記録では検証していない。
- 全体の件数：前回の643件から今回は645件になった。U1の261件は同じ。U1 exact commandの外にあるテストで2件増えている。今回の作業ではテストを追加していない。増えた原因は特定しておらず、推定しない。

## 未実施・後続事項

- 登録済み公式checkpointコマンド（`npm test -- --passWithNoTests=false`）、正式review、checkpointはorchestratorが担当するため、この作業では実行していない。
- 性能原因は未特定のまま。30秒以内の成功は、性能改善・timeout原因の解消・上流p95目標の達成を意味しない。
- 性能調査、準備/cleanupの最適化、観測器B1に残る所有識別と子プロセスの終了回収、改訂5で未開始のDB観測は後続事項である。
- U1 GUIの未確認事項（スマホviewport、最新GET失敗時のGUI）、U2の未完了、実Supabase/Auth/外部API/CI/merge/Vercel、既存のdependency指摘は保持する。今回の成功は、U1全体の受入やreleaseの完了を意味しない。
