# U1：品質設計の決定根拠

## Confirmed Decisions

新しい製品・SLA・課金・自動同期を選ぶ質問はない。承認済みNFR条件とバックアップQ1=aから、本人・保存の直列化、軽量読取、有限接続・取消し、最小診断、手動backupと架空restoreを具体化する。本人の回答を推定して追加しない。

## Remaining Implementation Preconditions

実アカウント／DB版・リージョン／鍵・接続・権限の準備は配置設計で確認する。security-design.mdのAES-256-GCM／HMAC-SHA-256と標準crypto利用案の実runtime対応、鍵更新とbackup保護、DB取消し・poolerとロックの互換は承認コード計画で検証する。このファイルに秘密値や実メモを書かない。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

