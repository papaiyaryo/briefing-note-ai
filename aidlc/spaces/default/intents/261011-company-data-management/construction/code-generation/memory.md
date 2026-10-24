<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations

- 2026-10-22T09:16:21Z [unit u1-company-notes] — コード生成の再実施では既存の正しい修正を保持する。過去の実Red/Green/Refactorと今回の再検証を区別し、意図的に製品コードを壊して新しいRedを作らない。
- 2026-10-16T03:48:15Z [unit u2-generated-notes] — U2の計画は既存署名検証形式への発行追加とC2保存接続に限定した。実装前の計画段階であり、新しい本人承認・実行済み証拠を作っていない。
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-10-16T03:48:15Z [unit u2-generated-notes] — U1既知不備・依存audit残存・実環境未確認は未解消。U2のコード計画承認は別の本人回答が必要で、Vercel作業や実認証待ちへ戻さない。
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
