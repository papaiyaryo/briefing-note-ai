# U1：内容を残さず失敗と品質を確認する要件

## Requirements and Indicators

| ID | 記録・判定対象 | 内容と境界 |
|---|---|---|
| NFR1.7 | requestId、操作種別、成否／エラー分類、経過時間等の必要最小の診断 | 本文・OCR・画像・password・token・鍵・完全要求／応答・他人IDをログに複写しない。失敗本文を例外ログへ自動展開しない |
| NFR7.6 | 性能SLIは対象別p95／最大／失敗数、容量SLIは実DB bytesとfixture規模 | performance／scalability要件の条件・SHA・端末・リージョンと一緒に記録。平均だけ／cold startの除外だけで合格にしない |
| NFR6.1 | 新規変更は受入に結付くRed→Green→Refactor、runner確認、全アプリlines>=80、lint／typecheck／test／build | 公式Unit記録にコマンドと実結果。未計測ファイルを隠さない。0テストを成功にしない。Docker変更時確認 |
| NFR6.2 | リリースと公開確認は実merge SHAのVercel成功・URL、ページ、health、承認済み利用導線の証拠 | 古い配置／healthのみを機能受入にしない。失敗を直してから次Bolt。生成実providerの公開確認が未許可なら保留 |
| NFR2.8 | 版競合、確認変更、結果不明、依存障害、復旧／バックアップ未達を本人に文字で知らせる | 対象内容をログへ貼らず、画面の入力保持と復旧操作で判断できる。正常空と失敗を区別 |

## Monitoring and Alerting Scope

新しい常設監視基盤・通知・外部dashboard・distributed tracing製品は追加しない。既存のホスティング／CIと最小サーバー診断、画面の明示エラー、承認済みベンチマークで確認する。単一アプリのrequestIdで要求内の診断を結び、秘密を含むURL queryやSQL paramsを記録しない。

判定条件はp95 2秒／削除3秒超過、代表容量200 MiB超過、失敗数・不整合発生、24時間バックアップ目標未達。これらは検証・本人確認の基準で、未承認の自動通知や自動課金・データ削除の引金ではない。既存ログの保持条件は実配置設定で確認し、新しい長期保存を作らない。

## Sources

- ../functional-design/functional-spec.md、rules.md — U1の操作順序・規則。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜NFR7。
- ../../../inception/contract-design/contract-summary.md — C1〜C6・有限再試行・版と原子性。
- ../../../inception/delivery-planning/bolt-plan.md — 選定・入力上限・性能／容量と検証条件。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 現行構成の静的記録。最新性・稼働証明ではない。
- nfr-requirements-questions.md Q1の本人回答a — 利用して変更した日の終了時と配置／保存形式変更前の手動バックアップ。

