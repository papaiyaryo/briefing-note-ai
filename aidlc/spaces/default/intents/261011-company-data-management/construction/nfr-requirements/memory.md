<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-10-16T03:00:35Z [unit u2-generated-notes] — 生成45秒等を有限待機条件として性能目標から分離した。既存の計画・契約を具体化し、新しいSLAや課金条件を作らない。
- 2026-10-14T16:02:46Z [unit u1-company-notes] — Q1の本人回答aにより、変更した日の終了時とデプロイ／保存形式変更前の手動バックアップを採用する。24時間以内の成功取得は運用目標であり、自動RPO保証とは扱わない。
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-10-16T03:00:35Z [unit u2-generated-notes] — 実Supabase・外部provider・公開確認は未確認として本人へ引継ぐ。U1の競合・復元session・削除期限問題は未修正のままrelease受入へ残る。
- 2026-10-14T16:02:46Z [unit u1-company-notes] — overviewの名称・登壇者欄の500／5000上限適用にある機能設計の軽微な指摘を後続設計／コード計画へ引き継ぐ。承認計画の500を勝手に緩和しない。
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
