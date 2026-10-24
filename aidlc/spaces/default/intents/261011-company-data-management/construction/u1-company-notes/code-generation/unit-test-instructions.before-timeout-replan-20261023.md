# U1：既知の不具合3件の検証手順（改訂3）

## Scope and Preconditions

[改訂3計画](code-generation-plan.md)の新Plan Approval後、Node22・既存Vitest・dummy Auth/provider・隔離実PostgreSQL17を使う。U1の削除期限・復元後の旧session拒否・競合後draft保持をRed→Green→Refactorで検証する。実サービス/秘密/個人メモなし、依存・runner/config・coverage threshold変更なし。全体品質commandは計画にだけ記載し、本書はU1 exact commandに限定する。

## Runner Readiness — Step 1

```text
npm test -- tests/u1-company-notes/schema.test.ts --passWithNoTests=false
```

収集・正常試験・skip0・exit0を確認する。既存DB health、dummy role、隔離schemaの作成/片付けも確認。DB停止・権限不備・試験0件はRedではない。

## Repository Red Green Refactor — Steps 2 to 4

```text
npm test -- tests/u1-company-notes/repository.integration.test.ts --passWithNoTests=false
```

企業・メモ各ロック待ち中の期限超過、now=expiry、期限内成功、成功操作の期限後再送の5境界。拒否は410、対象/子/成功operationに新しい効果ゼロ。同じ親のロック保持を独立接続で観測し、有限barrierで待機を確認してから期限を越す。無限polling、任意sleepだけの到達推測、期限延長やassertion緩和は禁止。finallyで全lock/接続を必ず解放する。

## Restore Red Green Refactor — Steps 5 to 7

```text
npm test -- tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/auth.test.ts --passWithNoTests=false
```

新fileでは既存runtimeFixture/AccessControlと実migration/PGを使う。dummy Authの外部logout失敗を許容したまま、アプリlogout済みCookieが復元で認証復活する失敗を先に確認する。新復元SQLの不存在だけをRedにせず、旧の復元経路で実際にCookieが通ることと期待拒否との差を実行して記録する。

Green後は同じ実行SQLを適用して旧Cookieと全復元session拒否、token行ゼロ、企業/メモ/owner/ID/版/成功operation不変、fresh login成功、SQL再実行の安全性の6境界をassert。dump全手順は計画の別commandで確認し、session除外・古いdump由来行の除去・RLS・専用cleanupを実際に確認する。schema fingerprintと企業データの同一性をsession行の同一性から分け、sessionの復活を成功条件にしない。

## Frontend Red Green Refactor — Steps 8 to 10

```text
npm test -- tests/u1-company-notes/ui.test.ts tests/u1-company-notes/draft.test.ts --passWithNoTests=false
```

ui.test.tsはuiCallbacks.tsx/uiCases.tsxを実行する既存entry。企業とメモ各409→最新取得→元draft/base保持→本人の明示再編集、最新取得失敗、未承認再保存ゼロ、移動取消、本人隔離の6境界を実callback/状態で確認する。新依存なし。単なるSSR文言・source文字列検査だけで連続操作の成功にしない。

dummy previewの手動手順は計画Step10を実行する。保存済み最新版と未保存入力を別表示し、最新取得だけで破棄/送信しない。本人が再編集を選んだ後の明示保存を別クライアントで再取得する。操作と期待/実際・通信件数を記録し、専用browser/process/schemaを片付ける。実認証/実Bセッション/本番の成功へ拡張しない。

## U1 Regression — Step 11

```text
npm test -- tests/u1-company-notes/schema.test.ts tests/u1-company-notes/board.test.ts tests/u1-company-notes/workspace.test.ts tests/u1-company-notes/database.integration.test.ts tests/u1-company-notes/repository.integration.test.ts tests/u1-company-notes/session.integration.test.ts tests/u1-company-notes/restore.integration.test.ts tests/u1-company-notes/auth.test.ts tests/u1-company-notes/authRoutes.test.ts tests/u1-company-notes/crypto.test.ts tests/u1-company-notes/generationReceipt.test.ts tests/u1-company-notes/client.test.ts tests/u1-company-notes/draft.test.ts tests/u1-company-notes/routes.test.ts tests/u1-company-notes/existingRoutes.test.ts tests/u1-company-notes/ui.test.ts --passWithNoTests=false
```

exact16fileとそのimport先を実行し実件数・skip0・exitを記録する。元の40ms/operation_unknown、実DB原子性/RLS/成功再送/COMMIT応答途絶、失効/同時refresh/logout、本人隔離を維持。全体lint/typecheck/test/build/coverageと公式checkpointは計画のcommandで一度ずつ直列に実施し、Unit試験と混同しない。

## Evidence and Limits

各Red/Green/Refactorのcommand・exit・対象assertion・実件数・cleanupをU1の新しいbugfix-evidence.mdへ記録する。Runnerの準備失敗や他caseの失敗は対象不具合のRedにしない。旧587件成功・83.50%は履歴、新改訂の全体coverageは全app/src lines80%以上を新測定する。

前回レビュー・deadline修正履歴・既存source claimsは残し、今回の修正済み所見は実証後だけtraceabilityへ反映。今回結果をrelease完了/実Supabase/実Auth/Vercel/本番確認と呼ばない。秘密・dump・本文・Cookieをログ/auditへ載せない。

## Sources

- [計画改訂3](code-generation-plan.md)、[改訂2手順](unit-test-instructions-revision-02.md)、[前回所見](reviews/review-02.md)。
- [RD1/RD3](../nfr-design/reliability-design.md)、[WF6/WF7](../functional-design/functional-spec.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[共有契約](../../../inception/contract-design/contract-summary.md)。
