# U2の観測設計

## OD1 — Minimal Correlation and Outcome Signals

対象: NFR1.5、NFR2.7、NFR7.6。

各server要求の不透明requestIdと処理種別・安全なcode・経過時間で失敗を関連付ける。既存C5エラー形式は維持し、内部診断IDを加えるために既存必須bodyを破壊的変更しない。U1操作照会の結果は既存operationIdを使い、画像・本文・訂正OCR・完全payload・証明・token・資格情報をloggerへ渡さない。provider例外の全文をそのまま表示／logしない。

画面通知は読込中・生成中・候補未保存・保存中・拒否・結果不明・操作確認・保存確定・再取得失敗を別状態で表現する。色だけに依存せずariaの既存通知方式とlabelを用い、必要な診断IDと再試行操作を示す。unknownを未実行、失敗を0件と決めない。

通知の表示寿命を保存意図の寿命にしない。OCR／既存復習から戻った表示はワークスペースの現在の保存状態を参照し、確定済みを未保存へ戻さず、結果不明を新規保存可能へ変えない。

## Metrics, Verification and Escalation

warmup5回＋2clients×各50回の代表試験でp95／最大／失敗数、fixture bytes、対象版、ブラウザ／OS、測定境界を記録する。生成の有限deadline、local adapter、実HTTP／実Supabase／公開結果を分ける。実外部未実施なら未確認と記録する。

外部telemetry、分散trace、常駐dashboard、alert配送、独自alert閾値は追加しない。性能・容量・期限超過を診断して承認範囲で修正し、課金や要件変更が必要なら本人確認へ戻す。diagnostic fixtureは架空のみ。運用問い合わせの証拠に実メモを不要に複写しない。

## Sources

- ../nfr-requirements/performance-requirements.md
- ../nfr-requirements/security-requirements.md
- ../nfr-requirements/scalability-requirements.md
- ../nfr-requirements/reliability-requirements.md
- ../nfr-requirements/observability-requirements.md
- ../nfr-requirements/tech-stack-decisions.md
- ../functional-design/functional-spec.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/domain-design/components.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md

