# Security Test Instructions

## Setup and Checks
架空owner、dummy署名/認証、loopback実PGだけを使用。既存Unit exact commandsと全体suiteで未認証401、他owner404、同一Origin、RLS、期限/refresh/logout、入力/URL/出典/構造の検証、画像非保存、HTML非実行、凍結要求と重複効果0、ログ非開示を確認する。秘密値・本文を記録へ複写しない。

## Commands and Coverage
各Unitのunit-test-instructions.md記載のauth/routes/crypto/provider/client/model/PG/UIコマンドをrun-validation.ps1で収集。全app/src lines80%以上は全体coverageで検査。SSR/callbackはGUI安全表示の証明ではない。実Auth/Supabase、実本人切替はDeferred。依存auditの過去指摘は今回の機能試験で解消済みとしない。新ツール・依存・設定は追加しない。

## Sources
各Unit nfr-requirements/security-requirements.md、nfr-design/security-design.md、code-generation-plan.md Testing Contract、target-inventory.json。
