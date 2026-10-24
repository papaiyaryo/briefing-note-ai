# U1：既存環境での観測設計

## Metrics & KPIs

| Metric | Source | Threshold | Why it matters |
|---|---|---|---|
| 操作別p95／最大／失敗数 | 同候補SHA PreviewのAPI計測・最小Vercel診断 | 認証済み保存／読取／一覧／20社比較p95<=2秒、50メモ企業削除<=3秒 | 平均だけで利用体験を合格にしない |
| 全DBサイズ／fixture bytes | 実試験DB・Supabase管理画面 | JSON／索引／内部領域込み200 MiB予算 | 100企業／1000メモ／10,000操作の承認fixtureで確認 |
| 接続数・待ち・deadline超過 | pool診断の集計、Supabase既存表示 | 各プロセス最大3、server10秒・transaction8秒以内 | 水平実行時の合計や無料枠も別確認 |
| エラー分類／結果不明 | requestId、action、code、duration | unexpected／unknown増加、再試行後も未確定なら調査 | 個人内容なしで障害箇所を識別 |
| backup・restore確認 | 本人管理の実施日時／schema版／復元結果 | 変更日の終了時とdeployment／schema変更前 | 24hの手動運用目標と実復旧可否を分ける |
| リリース結果 | GitHub actual merge SHA／Vercel deployment summary／公開受入 | 該当SHA成功、page/health/承認flow確認 | 古いdeployment成功を現在Boltの受入にしない |

## Alerts

| Alert | Condition | Severity | Routes to |
|---|---|---|---|
| 性能・容量未達 | 承認条件の実測が閾値超過 | release blocker | 実測記録で本人へ提示し、今回の範囲で修正・再検証 |
| 権限／内容漏えい | 未認証／別所有者アクセス、tokenや本文のログ混入 | release blocker | 公開を進めず原因修正・検証 |
| 配置／受入失敗 | 対象SHA deployment失敗、公開health／flow不合格 | release blocker | 既存GitHub/Vercel表示とrelease記録。人間のrevert PR判断 |
| Free休止／接続枯渇／backup未実施 | 本人が既存管理画面・利用時に検知 | 要調査 | 本人用復旧手順。固定自動通知の到達保証はない |

新通知・常設アラーム・外部監視・有料dashboardは追加しない。この表は確認時の対応基準であり、自動通知が設定済みという記録ではない。

## SLIs / SLOs

| SLI | SLO target | Measurement window |
|---|---|---|
| 認証済みAPIの操作別時間 | p95<=2秒／企業削除<=3秒 | 同SHA／承認fixture／通常network／2クライアント。warm-up5後各50回 |
| deadline／取消し | ブラウザ15秒／server10秒／DB8秒以内、取消不能接続は破棄 | 期限・lock待ち・ROLLBACK・commit応答途絶の結合試験 |
| 復元整合性 | 内容・所有者・ID・版・成功操作・schema版が整合、ログインし直せる | schema変更前の使い捨て実DBrestore試験＋本人backup実施記録 |
| 公開受入 | actual merge SHA成功＋page／health／承認flow | 人間merge後、当該releaseごと |

cold start、初回Auth、Free休止復旧は別欄へ記録し、通常p95から隠して全部達成としない。固定uptime SLA、未承認RTO、自動RPOは設けない。

## Logs & Tracing

| 項目 | 方針 |
|---|---|
| 最小ログ | requestId／action／code／duration、必要な集計だけ。既存Vercelログで確認 |
| 記録しない内容 | 画像、OCR、Markdown、企業名、自由メモ、email、token、Cookie、Authorization、DB接続URL、SQL引数、鍵。生exception dumpを返さない |
| DBログ | アプリからSQL本文／引数ログを追加しない。provider既定ログ設定も本人が確認し、実メモ入りの診断をauditへ転載しない |
| request連携 | 同じrequestIdで最小診断を結ぶ。分散trace製品・追加dashboardはなし |
| health | 公開/api/healthのstatus:ok／service:briefing-note-ai。内部設定や私的データを返さず、health成功だけでDB/Auth/機能受入を宣言しない |
| 証拠 | SHA・実行条件・集計・期待結果・未確認だけ。スクリーンショットは架空データ、秘密表示なし |

## Sources

- ../nfr-design/observability-design.md、performance-design.md、scalability-design.md、reliability-design.md — OD1/OD2、計測・backup条件。
- infrastructure-specification.md — 既存観測源と接続制限。
- ../../../inception/delivery-planning/bolt-plan.md — 同SHAの実測と公開受入。

