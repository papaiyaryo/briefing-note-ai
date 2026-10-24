# U1：30秒テスト待機上限の検証手順（改訂6）

## Scope and Preconditions

本改訂のPlan Approval後だけ実行。変更は計画に列挙した既存3件のit timeout 30000msだけ。テスト・hook全体の既定、UI waitFor4000ms、40msunknown、製品期限、既定並列、assertion、実PG/Auth/handlerとcleanupは維持する。性能調査と観測器の追加実装・診断実行は後続。Node22の既存実行ファイルを明示しprocess-local PATHを使う。dummy providersとlocalhost/workspace_testのみ。今回の設定・文書変更に人工TDD Redや新規件数追加は不要。

## Runner Readiness — Step 1

```text
npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false
```

1回のみ。対象fileの収集・Node22・既存Vitest/v8・全app/src lines80を確認。0件や環境不備をRedとしない。必要時のDB準備は計画の既存compose commandのみ。新規依存・DBリセットなし。

## Target Regression — Step 3

```text
npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/restore.integration.test.ts --passWithNoTests=false
```

1回のみ。latest取得と元draft/base保持、logout cookie/別session拒否を含め、既存2ファイルを全件実行する。該当3件は30000ms以内で期待結果を満たすこと。残りの試験とhookの期限は変更しない。UI内部4000ms待ちを維持する。旧dumpの対照、復元token0、保存データ不変、fresh login、再実行安全、通常cleanupを全て維持する。失敗時は停止し自動Retryや追加緩和をしない。

## Whole U1 — Step 4

```text
npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/board.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/auth.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/routes.test.ts tests/u1-company-notes/existingRoutes.test.ts tests/u1-company-notes/ui.test.ts tests/u1-company-notes/fixtureLifecycle.test.ts --passWithNoTests=false
```

既存の観測制御試験も含めて1回実行し、未完了B1を隠さない。file存在を確認してから実行。不在なら推測しない。失敗時は結果を提示して止まり、無断修復・除外をしない。

## Evidence and Quality

全体品質と登録済みcheckpointはcode-generation-plan.mdのVerification Commandsを正本とする。各commandを直列に1回ずつ実行し、exit、件数、skip0、経過、coverage全app/src lines80%以上、cleanup失敗の有無を記録する。通常npm testにも既存fixtureLifecycle試験を含める。子診断runnerを起動せず、旧診断の予算を再演しない。

30秒内成功は機能の期待結果を満たした証拠であり、性能改善・タイムアウト原因解消や上流p95目標の合格ではない。性能調査と未解決B1は後続事項へ明示する。通常fixture cleanupは既存どおりawaitし、今回所有を証明できない資源や過去schemaへ操作しない。source-manifest/summary/traceの累積履歴・Deferredを保持し、公式state/audit/receiptは手書きしない。

