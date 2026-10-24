# U3 — 規模と共有資源の設計

## Bounded Client and Shared Store

| NFR | 解決策 | 具体的な境界 |
|---|---|---|
| NFR7.2 | LC1のselectionを順序付き1企業1メモに制限し、0なら要求なし。LC2/U1で1〜20、文字/code point/bytes/構造/Webの既承認制約を検証 | 0/1/20/21、重複/同名別ID、理由5000/5001、1MiB/256KiB。切詰めず入力保持。全文/配列の制約は要件正本を使う |
| NFR7.3 | U1の本人企業全カードと所属概要の既定20/最大100ページを使う。LC1はページの取得状態とnextCursorを企業/owner世代に結ぶ | 100社/1000メモ/10000操作/1社50件、本文混在fixture/各Web4、DB予算200MiBの実測。取得済み20件を所属全件数としない |
| NFR7.4 | U3は既存Next/DB/poolを共有し、新規永続表/cache/queue/自動課金/登録制限を作らない。操作起点の通信のみ | 16社以上の登録や終了企業を比較候補から除かない。idle追加API0、比較20件を保存上限にしない。容量超過は報告して本人判断へ |

## State Retention and Isolation

LC1は現在の結果、本人/対象別のdraftとfrozen intentを管理する。旧結果の一時保持と出力可能状態を分け、画面mount毎の再初期化を避ける。アプリinstanceの終了で未保存入力が失われる限界は明記する。メモリ削減のためにunknown/確定結果を勝手に削除して再書込へ戻さない。

同時更新はU1の企業ロック/版/operation一意性の範囲で扱う。U3に分散queue、sharding、replica読取、autoscale規則を追加しない。常時同期/オフライン永続化も範囲外。利用拡大の判断は既目標p95/失敗数/容量測定を根拠とし、新SLAや費用条件を推定しない。

## Legacy Capacity Boundary

LC6は旧localStorage形式を旧正本として保持する。新比較の永続cacheへ流用せず、自動migration/削除/修復なし。読取不能/不正/有効0を区別する。混在不正記録のある旧データを編集する場合も、元データを欠落させる全体上書きを避ける。安全に従来形式を保持できないときは説明して書込を止め、元文字列を壊さない。正常な従来データの既存操作は維持する。

## Sources

- [非機能要件: 性能](../nfr-requirements/performance-requirements.md)、[安全性](../nfr-requirements/security-requirements.md)、[規模](../nfr-requirements/scalability-requirements.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[観測](../nfr-requirements/observability-requirements.md)、[技術/画面](../nfr-requirements/tech-stack-decisions.md)。
- [機能設計](../functional-design/functional-spec.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[部品の所有者](../../../inception/domain-design/components.md)、[承認済み上限/検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現在の境界と未達](../../../../../../../../docs/session-handoff.md)。
