# U3 — 比較の観測設計

## Verification and Diagnostics

| NFR | 解決策 | 証拠の種類 |
|---|---|---|
| NFR6.1 | LC2はC4 error requestId/codeと固定operation分類/経過時間、LC1/4は内容なし状態遷移だけを診断に使う。本文/理由/完全body/秘密をconsoleやauditへ出さない | 架空固有文字列をログ捕捉で探索。新外部trace/analytics/本文収集なし |
| NFR6.2 | モデル→client/coordinator→UIの適用層ごとにrunner確認後の受入Red→Green→Refactorをコード計画へ記す | commands/exit/対象AC・BR・NFR/結果をU3公式記録。既存APIの初回Greenを新Redと偽らず、先行境界への対応を示す |
| NFR6.3 | 既存lint/typecheck/test/buildと全app/src lines80%以上のCI条件を維持。source manifest/fingerprint/自己差分review/正式reviewで変更を固定 | 最終結果/coverage include/threshold、dummy・実PG回帰。CI未実行をlocalで合格化しない |
| NFR6.4 | 純粋モデル/API fake/実PG・HTTP/実DOM・browser/native zoom/性能を別の欄で記録 | OS/browser/SHA/fixture/command/成功/未実施/失敗/cleanup。実Auth・公開・本人担当Vercelは未確認として分離 |

## Metrics, Logs and Correlation

API p95/最大/失敗数とfixture bytes/DB sizeを既測定条件で確認し、新しい可用性率や警告閾値は追加しない。requestIdは安全な問い合わせ参照に使い、個人内容・session・完全要求の紐付け台帳を新設しない。U1の既存診断を使い、別dashboardサービスを用意しない。

画面通知は保存欄ごとにstatus領域を置き、未保存/送信中/確定/不明/競合と次の操作を文字で示す。input中にfocusを通知へ移さない。比較読取の失敗は再取得、更新unknownは同ID照会、commit後の失敗は最新読取だけを案内する。

## Evidence and Escalation

文書検査はJSON/ID/リンク/文字/空白/公式traceability。実装snippetなしのため、この文書作成だけでアプリ検査を反復しない。後続のコード計画でexact group/実画面操作/timeout/受入対応を具体化し、本人承認まで実装しない。

未達は隠さず現在Boltへ残す。U1/U2既知不備・native200%・既存auditを本Unitの検査で解消扱いにしない。実環境の未確認をローカル完了と混同せず、本人担当の作業は待機条件にしない。

## Sources

- [非機能要件: 性能](../nfr-requirements/performance-requirements.md)、[安全性](../nfr-requirements/security-requirements.md)、[規模](../nfr-requirements/scalability-requirements.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[観測](../nfr-requirements/observability-requirements.md)、[技術/画面](../nfr-requirements/tech-stack-decisions.md)。
- [機能設計](../functional-design/functional-spec.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[部品の所有者](../../../inception/domain-design/components.md)、[承認済み上限/検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現在の境界と未達](../../../../../../../../docs/session-handoff.md)。
