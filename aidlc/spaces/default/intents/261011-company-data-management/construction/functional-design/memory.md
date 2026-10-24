<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-10-16T02:40:20Z [unit u2-generated-notes] — 生成候補と保存要求のsnapshotを分け、結果不明の同一要求再試行を明示した。既存契約から具体化し、新しい本人回答や実装承認は記録していない。
- 2026-10-14T15:28:24Z [unit u1-company-notes] — Q1の本人回答aに従い、手入力メモへの比較項目追加を本人の明示操作として具体化する。既存ManualCandidateとUpdateMemoの任意構造化項目を使い、自動本文解析と正本の同期は追加しない。
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-10-16T02:40:20Z [unit u2-generated-notes] — U1の競合後draft保持・復元session・削除期限の未修正事項はrelease受入へ残る。U2設計の最新確認導線を、U1の現行動作で達成済みとは扱わない。
- 2026-10-14T15:28:24Z [unit u1-company-notes] — 導入Boltの人間マージと対象SHA公開確認、専用認証・保存環境の準備は実装着手条件として残す。設計文書の存在を実設定・受入成功の証拠にしない。
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
