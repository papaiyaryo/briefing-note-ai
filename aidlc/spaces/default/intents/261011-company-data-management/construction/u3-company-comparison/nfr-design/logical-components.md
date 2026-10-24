# U3 — 論理部品と障害の境界

## Component Inventory

下表はCompanyComparison/ApplicationExperience内の責任分解であり、新しいUnit/サービス/DB/APIではない。U3→U1だけの依存を維持する。

| ID | 論理部品 | 状態/責任 | 呼ぶ境界 | 障害時の影響 |
|---|---|---|---|---|
| LC1 | ComparisonSession | 本人/選択/入力/要求世代、owner/target/field別draft・pending・committed、選択/候補/結果状態。browser app instanceの内側で生成しSSR共有なし | 既存本人境界、LC2〜6 | 失効は保護表示停止、現世代以外の結果破棄。同本人メモリ復旧のみ |
| LC2 | ComparisonSourceClient | C4分類、有限期限/GET限定再試行、runtime schema・全参照整合検証 | U1 AccessControl/CompanyWorkspace C1/C3/C4 | read失敗はerror、更新unknownはLC4へ。全体ready/出力を阻止 |
| LC3 | ComparisonModel | 固定7観点、保存企業名/選択元/版/出自/出典・保存志望度/理由の派生、安全な比較Markdown材料 | 検証済みComparisonSnapshot、既存schema/7観点 | 不正値で成功比較なし。本文の自動事実化なし |
| LC4 | ComparisonEditCoordinator | 欄別base/draft/frozen request/outcome、連打抑制、unknown照会、commit後読取、競合latest別保持と明示rebase | LC1状態、LC2→U1 updateCompany/updateMemo/operations | 一欄の拒否/不明で他欄成功を消さない。mountは投影のみで意図を初期化しない |
| LC5 | ComparisonExportCoordinator | クリックごと全版照合、dirty/pending阻止、全世代照合、same saved snapshotから1ファイル | LC1/2/3 | 変更/削除/失敗/401/途中編集はfile0、最新確認/再クリックへ |
| LC6 | LegacyComparisonBoundary | 認証後明示旧入口、従来SavedCompanyMemo/正常な選択編集出力、破損/利用不可分離 | 旧browser storageのみ | 元の不正データを自動修復/消去せず、新保存へ送らない。新比較とは別の正本 |

## User Interface and Focus Ownership

| NFR | 設計上の担当 | 検証 |
|---|---|---|
| NFR5.2 | LC1のUI投影をPC table caption/row-column見出しとアクセス可能scroll領域、mobile観点別縦表示へ分け、同じLC3順序/参照/区分を使う | PC1366×768/mobile390×844、320/767/768、native200/400%で候補選択/比較/保存/復旧/出力/旧入口へ到達。色/dragだけに依存しない |
| NFR5.3 | app入口h1だけへfocus、再取得/保存/入力中は維持。欄ごとlabel/status、未保存取消しは起動元と保持入力に戻す | Tab/ShiftTab、取消し、長文、読み上げ可能通知の実DOM/実browser。SSR/callbackだけで達成しない |

## Infrastructure Mapping and Shared Resources

| 論理責任 | 既存配置 | U3からの追加 |
|---|---|---|
| LC1/3/4/5/6 | 既存アプリの保護browser画面と一時メモリ/旧browser storage | UI/純粋処理/調整ロジックだけ。新永続領域なし |
| LC2 | 既存同一サイトC4へのHTTP client | clientの比較読取意味・schema整合の受理境界。新routeなし |
| C1/C3/C4 | U1のNext.js API Routes、既存Auth/PostgreSQL/DB pool/権限/CI test PG | 追加サービス/環境変数/秘密/DDL/CI基盤なし |

共有資源のownerはU1のまま。Infrastructure Designで新資源を選定する必要はなく、既存配置と同じ境界でコード計画へ引き継げる。実Auth/実Supabase/本人担当Vercel/公開は未確認で、構築や利用成功を称さない。

## Assumptions & Open Questions

None.

設計は30詳細NFR・既承認C1/C3/C4・U3機能設計の具体化。新しい費用/機能/数値目標/依存/本人回答は追加しない。source変更はCode Generation Plan Approval後だけ。

## Sources

- [非機能要件: 性能](../nfr-requirements/performance-requirements.md)、[安全性](../nfr-requirements/security-requirements.md)、[規模](../nfr-requirements/scalability-requirements.md)、[整合性](../nfr-requirements/reliability-requirements.md)、[観測](../nfr-requirements/observability-requirements.md)、[技術/画面](../nfr-requirements/tech-stack-decisions.md)。
- [機能設計](../functional-design/functional-spec.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[部品の所有者](../../../inception/domain-design/components.md)、[承認済み上限/検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現在の境界と未達](../../../../../../../../docs/session-handoff.md)。
