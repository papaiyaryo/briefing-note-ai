# U3 revision 02 — 最終ローカル検証

## Environment and Scope

既存 Windows cmd.exe、process-only PATH の Node22.23.3、npm11.6.1、Vitest4.1.8/node、v8 を使用。全app/src lines80%以上、既存timeout/assertion/fixture/include/excludeを維持した。実外部API・Auth/Supabase・CI・Vercel・公開は検証していない。DB試験はlocalhostの使い捨てPG17と既存fixtureを使用した。

## Final Step 10 Results

| コマンド | 最終結果 | 実測 |
|---|---|---|
| `npm run typecheck` | exit0 | mock戻り値型注記後に成功 |
| `npm run lint` | exit0 | 最終テストファイル変更後に成功 |
| `npm test` | exit0 | 55 files / 635 tests成功、skip0、25.17秒 |
| `npm test -- --passWithNoTests=false --coverage` | exit0 | 同条件Retryで55 files / 635 tests成功、skip0、26.16秒 |
| `npm run build` | exit0 | Next.js15.5.19、compile/type/lint/static生成/build traces成功 |
| `git diff --check` | exit0 | 追跡差分の空白エラーなし。既存ファイルへのLF→CRLF警告あり。未追跡ファイルの空白検査をこのコマンドが行ったとは扱わない |

coverage最終値: lines **85.95% (2962/3446)**、statements84.33% (3134/3716)、branches76.16% (2106/2765)、functions82.42% (769/933)。既存の全app/src対象とlines80下限を変更せず達成。レポートは既存 `coverage/coverage-summary.json` / `coverage/index.html`。変更前baselineは615件・lines85.12%で、最終635件との差は承認済み新規20件。

## Failures and Human Retries Retained

1. Step8 UI Refactorの最初の再実行はshell起動前に `CreateProcessAsUserW failed: 2`。試験未開始でありアプリRedに数えない。公式pause後の本人Retryにより既存cmd.exeで同じ検証を再開し、UI24件と全U3 139件が成功した。
2. 最初のStep10 typecheckはexit2、`edits.test.ts:453/463` のTS2345。mock初期実装がcomparisonReasonをstringへ狭く推論し、正当なstring|null fixtureを受け付けなかった。公式pause/本人Retry後、setup.readMemoのasync戻り値を `Promise<typeof source.memo>` と明示する1箇所だけを修正した。null入力・全assertion・実行時データを変更していない。これは試験の型不備でありアプリTDD Redではない。修正後typecheck/U3 139/lint/全体635成功。
3. 最初の最終coverage実行はexit1、55 files中54成功/1失敗、635 tests中634成功/1失敗、skip0、30.68秒。凍結済みU1 `uiCallbacks.tsx:577` の「AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する」が5000ms timeout。成功coverage値は出力されなかった。実際の品質検査失敗として保持し、新U3 Redや初回成功と扱わない。[root停止記録](verification-revision-02-root-stop.md)を参照。公式pause/本人の同条件Retry後、ソース・timeout5000ms・assertion・fixture・設定を一切変更せず同じcoverageコマンドが635件/lines85.95%で成功した。

Retryで依存追加、cache/.next削除、runner設定変更、条件緩和をしていない。ソース不変の成功済みlint/typecheck/通常635/U3 139はcoverage Retry時に重複実行していない。

## Unit Regression Commands and Evidence

初回Red/Green/RefactorとAC/BR/NFR対応は [実装証拠](bugfix-evidence-revision-02.md)、正本コマンドは [Unit試験手順](unit-test-instructions.md) に記録した。

```text
npm test -- tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/edits.test.ts --passWithNoTests=false
npm test -- tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false
npm test -- tests/u3-company-comparison/readiness.test.ts tests/u3-company-comparison/model.test.ts tests/u3-company-comparison/session.test.ts tests/u3-company-comparison/client.test.ts tests/u3-company-comparison/edits.test.ts tests/u3-company-comparison/export.test.ts tests/u3-company-comparison/legacy.test.ts tests/u3-company-comparison/ui.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

Business最終Refactor48/48、実PG12/12、UI最終Refactor24/24。型注記後の全U3 exactは9 files / 139 tests、skip0、exit0、5.84秒。新規20件=S5/C7/U6/I2、既存119件を保持。実PG専用schema/clientは既存afterAllでcleanup。API handler経由の結合とSSR/HookHarness/実callbackを実TCP HTTP・live DOMの証拠に読み替えない。

## Manual Limits and Handoff

rootによる限定CUAの観測・未達・3回の隔離preview cleanupは [手動記録](manual-revision-02-root.md) が正本。全M-R条件を完了したものと扱わず、Step9は未チェックを維持する。mobile/native倍率、明示rebase後の再保存、別企業保存、route往復/download等の未確認を自動試験成功で埋めない。R-03実本人切替、U2既存画面未達、実環境も未確認のまま。

Step10のコマンド検証は完了。アプリ/試験の変更は次の承認済み8ファイルだけで、以後developerからの変更・検査を停止しrootへ引き渡す。

- `src/lib/companyComparison/session.ts`
- `src/lib/companyComparison/edits.ts`
- `src/components/compare/ServerCompanyComparison.tsx`
- `src/components/compare/ComparisonFieldEditor.tsx`
- `tests/u3-company-comparison/session.test.ts`
- `tests/u3-company-comparison/edits.test.ts`
- `tests/u3-company-comparison/ui.test.ts`
- `tests/u3-company-comparison/comparison.integration.test.ts`

U1/U2、共有型/schema/client/API/DB/Auth、既存helper、docs/handoff、cloud-handoffは変更していない。Step11・累積manifest・hash・summary・trace・正式review・lifecycleはroot担当。ローカル検証成功を正式review成功、全受入完了、本番リリース完了とはしない。
