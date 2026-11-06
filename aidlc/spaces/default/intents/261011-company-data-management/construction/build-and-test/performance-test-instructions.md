# Performance Test Instructions

## Targets and Setup
target-inventory.jsonにNFR要件・設計の数値条件を出典付きで保持する。API p95<=2秒、50メモ企業削除p95<=3秒、100企業/1000メモ/10000操作のDB<=200MiB。warmup5、同時2client、操作別50回、p95/最大/失敗数、cold/初回認証は別記。有限期限browser15/server10/DB8秒、GET500ms後最大1回、POST/PATCH自動再送0を既存Unit試験で確認する。

## Execution and Evidence
今回指定されたlint/typecheck/test/build/coverageおよびU3 PC画面受入を実行する。機能試験の所要時間をAPI p95達成の証拠としない。既存性能履歴は今回実測と区別する。今回の範囲で専用性能測定を実行しなかった目標はUnverifiedとして明示し、追加測定や除外を勝手に適用しない。実Supabase/Auth側面は人間判断Deferred、次Intentが未作成なら後段検証予約済みと称さない。

## Sources
全Unit nfr-requirements/performance-requirements.md、scalability-requirements.md、nfr-design/performance-design.md、build-and-test-plan.md。
