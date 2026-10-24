# U1：性能要件

## Targets

| ID | 目標と対象 | 判定方法 |
|---|---|---|
| NFR7.1 | 認証済みの新保存／読取／メモ一覧／20社比較参照APIはp95 2秒以内。50メモ付き企業削除はp95 3秒以内 | 同じSHAのPreview、dummy生成と架空データ、warm-up 5回後に操作別50回、同時2クライアントで計測 |
| NFR2.1 | 新APIはブラウザ15秒・処理10秒・DBトランザクション全体8秒の有限上限。取消し・ROLLBACK・接続返却まで対象 | 遅延／故障注入で期限と後始末を検証。期限後にSQLを残さず、応答途絶は結果不明として照合 |
| NFR7.2 | 代表100企業／1000メモを本文なしカード全件と本文なしメモページ（既定20・最大100）で扱う。比較は1〜20社・各社1メモ | 一覧に本文／OCRを含まないこと、cursorと本人／企業の結付け、正確な全所属件数を検証 |

## Benchmark Conditions

本文は880件約1000字・100件約5000字・20件約10000字、1社50メモの例を含む。OCR／構造化項目の長文、Web各4項目、10,000件の小さい操作記録を含む。企業状態・0/4/5/14/15/16対応中の境界も別fixtureで検証する。

通常ネットワーク、承認済み端末・ブラウザ、リージョン、SHA、fixture bytes、各計測のp95・最大・失敗数を記録する。平均だけで合格にしない。cold start、初回認証、休止復旧は通常のwarm計測と分け、結果を隠さない。実OCR／LLMは使わず、保存DBとネットワークは承認済み実環境で確認する。

「2同時クライアント」は今回の検証負荷であり、requests/secondや多人数SLAを推定しない。達成未確認。上限未達を無制限化・課金・対象縮小で解消したことにせず、修正／必要な計画確認を行う。

## Sources

- ../functional-design/functional-spec.md、rules.md — U1の操作順序・規則。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜NFR7。
- ../../../inception/contract-design/contract-summary.md — C1〜C6・有限再試行・版と原子性。
- ../../../inception/delivery-planning/bolt-plan.md — 選定・入力上限・性能／容量と検証条件。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 現行構成の静的記録。最新性・稼働証明ではない。
- nfr-requirements-questions.md Q1の本人回答a — 利用して変更した日の終了時と配置／保存形式変更前の手動バックアップ。

