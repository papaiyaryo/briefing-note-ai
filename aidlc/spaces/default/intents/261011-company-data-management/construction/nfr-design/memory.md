<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-10-16T03:19:43Z [unit u2-generated-notes] — U2の失敗境界を一時生成作業と凍結保存意図に分け、U1の本人／保存経路を共用した。新しいインフラ・SLA・依存は導入しない。
- 2026-10-14T16:24:15Z [unit u1-company-notes] — 承認済みの品質条件を具体化し、新しい製品選定・SLA・本人回答を追加しない。保存直列化は複数実行プロセスでも共通境界で成立する設計にする。
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
- 2026-10-16T03:19:43Z [unit u2-generated-notes] — U1の未修正事項と実環境未確認はrelease受入へ引継ぐ。sourceUrlの対応はC2 mapperで明示し、前段の凍結文書を変更しない。
- 2026-10-14T16:24:15Z [unit u1-company-notes] — 実poolerでのロック・取消し、暗号方式／鍵更新、backupの保護・復元手順は配置／コード計画で検証する。導入BoltのVercel成功は確認したが、本番ページ／health／基本操作の確認は未完了。
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
