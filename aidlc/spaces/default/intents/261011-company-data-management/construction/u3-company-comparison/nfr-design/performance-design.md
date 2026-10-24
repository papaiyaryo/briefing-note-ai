# U3 — 比較の性能設計

## Finite Request Pipeline

LC2は既存C4 clientを使い、U3の比較参照と更新の意味を分離する。GETだけの有限再試行を継承し、比較参照POSTの読取失敗を汎用送信のunknownへ読み替えない。LC1の本人/選択/要求世代とcancel tokenを要求に対応付け、期限/取消し/古い応答からreadyや保存成功を更新しない。

| NFR | 解決策 | 検証する境界 |
|---|---|---|
| NFR2.1 | LC2: browser15秒、U1 server10秒、DB全体8秒を継承。GETネットワーク/503に500ms後最大1回、比較POST/PATCH自動再送0。UIは有限終了と再取得/操作照会を分ける | fake clock期限前/期限、GET最大2試行、非GET1試行、取消し後late応答破棄。既存U1deadlineを変更しない |
| NFR7.1 | LC2のC4 HTTPを代表fixtureで計測。warmup5→2client×各50回、20社比較p95≤2秒、最大/失敗数/fixture bytes/対象SHA/環境を保存 | DB直呼び/HTTP/画面処理を別計測。cold start/初回認証/休止復旧は別記。50メモ削除p95≤3秒はU1境界に残す |

## Caching, Pooling and Derived Work

新しい共有cacheは作らない。LC1は現本人/選択世代の一時結果だけを持ち、staleな表示には出力不可を明記する。C4はprivate,no-storeを継承。LC3は検証済みsnapshotから表示用7観点とMarkdown材料を導出し、入力1文字ごとにサーバー取得しない。出力はLC5が明示クリックで再確認するため、前回の確認済み状態を次のクリックへ流用しない。

メモ候補は本文なしページング。複数選択を別々の詳細GETへ分解して比較snapshotを組み立てず、C3の一貫読取1回に集約する。U1既存pool最大3/プロセスをそのまま使い、U3専用pool/worker/queue/CDN cacheは追加しない。

## Measurement Limits

ローカルdummy Auth/使い捨てPG17の参考値は実Supabase/本番の達成と区別する。本人担当Vercelの作業を待つためにローカル検証を止めず、実環境は未確認と記録する。速度未達時にデータ切捨て・上限縮小・課金へ自動変更しない。

## Sources

- [非機能要件: 性能](../nfr-requirements/performance-requirements.md)、[安全性](../nfr-requirements/security-requirements.md)、[規模](../nfr-requirements/scalability-requirements.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[観測](../nfr-requirements/observability-requirements.md)、[技術/画面](../nfr-requirements/tech-stack-decisions.md)。
- [機能設計](../functional-design/functional-spec.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[部品の所有者](../../../inception/domain-design/components.md)、[承認済み上限/検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現在の境界と未達](../../../../../../../../docs/session-handoff.md)。
