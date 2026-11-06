# Integration Test Instructions

## Scope and Setup
Standard戦略。U1保存/復元/認証、U2生成→保存、U3比較→独立欄保存/削除/競合を既存Vitest node環境と実PostgreSQL17の隔離schemaで検査する。U1_TEST_DATABASE_URLはcompose.test.ymlと同じloopback使い捨てDBのみ。全Unitのexact commandsはrun-validation.ps1がunit-test-instructions.mdから収集し、同一コマンドを1回実行する。

## Commands and Expected Results
各Unitのreadiness、対象regression、モデル、API、実PG結合、UI、全Unit、既存生成回帰を収集する。0件・failed・skippedを成功扱いしない。複数コマンドに同じテストが含まれるため件数を合算して固有coverageとしない。全体npm testの固有件数とv8全app/src lines80%以上を別記する。

## Manual U3 Acceptance
computer-useの実UIで既存 `node scripts/local-workspace-preview.mjs` を使い、各起動300000ms以内。PC通常表示で計画のM-R1〜5を確認し、HTTP数の自動証拠と画面観測を分ける。CDP/Playwright/browser fetch/状態注入は使わない。競合は独立した実画面の操作で作り、削除確認も架空データだけ。専用preview/schemaのcleanupを確認する。

## Human Deferrals and Findings
R-03実本人切替、mobile/native200/400%、U2画面、実Supabase/AuthはDeferred。残るPC U3確認を除外しない。cross-unit-traceabilityの未カバーは2026-11-01の人間判断により承認ゲートでの指摘事項とする。Unitの既存traceabilityは変更しない。

## Sources
build-and-test-plan.md、各Unit unit-test-instructions.md、target-inventory.json。
