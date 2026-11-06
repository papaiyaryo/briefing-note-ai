# Build Instructions

## Scope and Prerequisites
2026-10-31承認済み計画と2026-11-01の追加判断に従う。Node22.23.3、既存node_modules、Next.js、TypeScript、Vitest4.1.8。依存追加・設定変更は行わない。再現環境ではpackage-lock.jsonに従いnpm ciを行うが、今回の既存環境では再インストールしない。

## Environment Setup
既存compose.test.ymlのlocalhost:55432/workspace_test、架空データ、dummy OCR/structure/Web/interview providerを使う。必要時の起動は `docker compose -f compose.test.yml up -d --wait`。実Supabase/Auth・外部API・個人データを使わない。Node22をプロセスPATHで選択し、npmのcacheはOS一時領域へ向ける。秘密値をログへ出さない。

## Commands and Verification
`npm run lint` → `npm run typecheck` → `npm test` → `npm test -- --passWithNoTests=false --coverage` → `npm run build` を直列で各1回。追加Unit固有コマンドは全Unitのunit-test-instructions.mdから重複を除いて各1回。実行補助run-validation.ps1とcommand-results.jsonに順序、command、exit、時間、ログを残す。全app/srcのv8 lines80%以上、既存assertion/timeout/include/excludeを維持する。

## Troubleshooting
DBアクセス不能・runner不成立・収集0件をTDD Redにしない。失敗時はログを残し停止し、自動再試行やソース修正をしない。長時間でも完了まで待つ。build/healthのみで機能受入・公開確認としない。

## Sources
build-and-test-plan.md、全Unit code-generation/{code-generation-plan,unit-test-instructions,code-summary}.md、package.json、vitest.config.ts、compose.test.yml、.github/workflows/ci.yml。
