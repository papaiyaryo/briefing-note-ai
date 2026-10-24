# U3 — 企業比較の性能要件

## Scope and Latency Budgets

共有APIの既承認上限・測定条件を引き継ぐ。新しい速度保証や常時通信を追加しない。下記IDはU3内の詳細要件であり、別Unitの同番号と一緒にするときはUnit名を付ける。

| ID | 測定可能な条件 | 確認方法 |
|---|---|---|
| NFR2.1 | 比較参照・更新・一覧・結果照会はブラウザ1要求15秒、サーバー10秒、DB全トランザクション8秒。GETのネットワーク失敗／503だけ500ms後に最大1回。比較参照POST・更新PATCHの自動再送0回。401/404/入力拒否/競合は自動再試行しない | fake clockで期限前・期限・取消し後の遅い成功、GET最大2試行、POST/PATCH1試行を確認。取得POSTの失敗を変更unknownへ分類しない。期限の実装を無期限Promise放置で代用しない |
| NFR7.1 | 認証済み20社比較・関連読取/更新/一覧APIはp95 2秒以内というBolt目標を維持。50メモ企業削除p95 3秒はU1の目標であり、U3の画面操作へ付け替えない | 代表fixture、warmup5回後に2クライアント・各操作50回、p95/最大/失敗数を測る。対象SHA、OS/ブラウザ、地域、fixture bytes、初回認証/cold start/休止復旧を別記 |

## Measurement Boundaries

100企業/1000メモ/10000操作の既承認fixtureで、20の異なる企業と各社1メモの選択順を固定する。ネットワーク越しHTTPとDB adapter直呼びの時間を別に記録する。取得成功から表示/出力処理を観察しても、その時間をAPI p95へ混ぜない。平均値だけで達成を認定しない。

ローカルdummy Auth・使い捨てPostgreSQL17・架空メモで実装と参考測定を先行する。実Supabase/本番のp95達成は未確認。本人担当のVercel・公開環境測定をローカル工程の待機条件へ戻さず、未実施として引き継ぐ。既存U1の参考測定をU3比較HTTPの証拠として再利用しない。

## Resource Controls

1要求1〜20社、各社1メモ。0件は要求0回。選択変更で旧要求を取消しまたは世代無効化する。候補のメモ一覧はページを順に取得し、全メモ本文の無条件取得で代用しない。表示と出力は同じ検証済み参照を使い、出力クリックごとの確認要求は1回。無限polling・background refreshは追加しない。容量の正本は[scalability-requirements.md](scalability-requirements.md)。

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[画面責任](../functional-design/frontend-components.md)。
- [NFR1〜7](../../../inception/requirements-analysis/requirements.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[Boltの上限・測定・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [既存技術の調査記録](../../../../../codekb/briefing-note-ai/technology-stack.md)。調査時点の依存一覧であり、現行設定・安全性の保証ではない。
- [現状と本人担当の境界](../../../../../../../../docs/session-handoff.md)。
