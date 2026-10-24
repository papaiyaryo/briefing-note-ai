# U1：実PGタイムアウトの調査・最小修復の検証手順（改訂4）

## Scope and Preconditions

新しいPlan Approval後だけ実行。Node22、既存Vitest/v8、dummy Auth、使い捨てPostgreSQL17、5000ms test／4000ms UI待ち／40msunknownと全assertionを維持。範囲・回数・全体コマンドはcode-generation-plan.mdを正本とし、本書にはU1とそのfixture consumerのexact filesだけを書く。アプリ・設定・依存・U2/U3編集なし。全体635件とU1 253件は現状の基準値で新規追加数ではない。

## Runner Readiness — Step 1

```text
npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false
```

既存DBの正常・収集数・skip0・exitを確認する。準備失敗は対象Redではなく停止理由。

## Diagnostic Commands — Step 2

```text
npm test -- tests/u1-company-notes/ui.test.ts --passWithNoTests=false
npm test -- tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false
```

それぞれ1回、同条件の全体npm testは計画に従い1回。段階が不明なら許可既存fileの計測を入れた全体1回まで。接続・共有bootstrapのlock・migration・初期Auth・HTTP・waitFor・cleanupの到達／経過だけを記録し、session値／本文／SQLパラメータは記録しない。製品のHTTPではなく同一プロセスhandlerを通る実PG試験であることを明記し、ネットワークやブラウザ受入の証拠としない。

UIの期待は実保存メモversion一致と元draft値・元baseVersionの完全一致。Restoreは旧dump行復元時にlogout済みcookieが通る対照を保ち、共通復元SQL後のlogout済みcookie・別有効sessionの拒否、token0、保存データ不変、fresh login、再実行安全性を保つ。準備をhookへ移してtest時間から除く変更、timeout増加、固定sleep、mock-onlyへの置換はしない。

## Fixture Red Green Refactor — Steps 3 to 5

```text
npm test -- tests/u1-company-notes/fixtureLifecycle.test.ts --passWithNoTests=false
```

この新fileは、Step2で補助処理の原因を特定して必要な振る舞いを追加するときだけ作る。作る前はこのcommandを走らせて0件をRedにしない。最大6境界の必要部分：bootstrap／migration／初期Authの失敗cleanup、共有準備の競合と失敗後の再試行、schema/owner分離。Redは対象期待不成立を確認し、同じcommandのGreen→Refactorを記録する。故障注入を使う補助の単体試験を、実AccessControl／復元成功の代用にしない。

元2exact commandを再確認し、続いて既存Restore/AuthとFrontendの回帰を実行する。

```text
npm test -- tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/auth.test.ts --passWithNoTests=false
npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/draft.test.ts --passWithNoTests=false
```

## Whole U1 and Shared Fixture Consumers — Step 5

```text
npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/board.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/auth.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/routes.test.ts tests/u1-company-notes/existingRoutes.test.ts tests/u1-company-notes/ui.test.ts --passWithNoTests=false
npm test -- tests/u2-generated-notes/generation.integration.test.ts tests/u3-company-comparison/comparison.integration.test.ts --passWithNoTests=false
```

実ファイルの存在とconsumerのsetupDatabase/runtimeFixture利用を読み取り確認してから実行する。不在なら名前を推測して実行せず計画修正へ返す。consumerの試験は共有補助修正の退行確認だけで、U2/U3編集やUnit完了を認めない。各テストのschema/owner/認証隔離とcleanup、既存40ms結果不明・RLS・原子性のassertionを維持。

## Evidence and Completion

実行command・exit・実件数・skip・段階別経過・cleanup・対象版をtimeout-investigation-20261023.mdへ記録し、Red/Green/Refactorと診断失敗を区別する。原因未特定、またはアプリ修正／上限変更／許可外のfileが必要なら止まり、新しい案の承認を求める。全体の既定並列設定を変えず、修正後はnpm testを2回連続成功し、全app/src line80%以上とlint/typecheck/build/diffを満たす。

既存3修正と旧review/承認を保持し、source-manifestは累積所有を維持したうえで今回必要なfileだけ追加する。trace146IDsとDeferredを減らさない。実GUI・外部API・本番を確認したとしない。U2の未確認もそのまま引き継ぐ。

