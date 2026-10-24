# U1：容量と負荷の設計

## SC1 — 共有配置と所有者分離

NFR7.2／NFR7.3／NFR7.4／NFR7.5／NFR3.1を対象に、既存の単一アプリと1保存先の共有配置を維持する。処理を別サービスへ分割せず、複数の実行プロセスでも権限・操作ID・session更新・親直列化を共有保存側で保証する。プロセス内の状態を唯一の整合性根拠にしない。所有者で必要範囲だけを読み、初期からsharding／複製正本／queueを追加しない。

transaction poolerとプロセス最大3接続、期限付き待ち、正常／異常時返却で資源を限定する。session refreshと企業書込はそれぞれのidentityで直列化し、別企業まで一つの全体ロックで止めない。比較読取は整合スナップショット、ページは軽量結果を返す。

## SC2 — 容量測定と後始末

代表100企業／1000メモ・本文配分・50メモ企業・Web各4・10,000操作記録で、JSON／索引／内部領域を含む実DBサイズを測り200 MiB予算と比較する。各項目の最大入力だけを全件適用する無料枠保証はしない。保存上限を15社・100社へ縮めない。

期限切れの削除確認、終了sessionの不要tokenは用途と本人／期限を検査して削除可能な領域へ分ける。成功操作記録は対象削除と独立に保持する。TTLで消して古い操作を再実行可能にしない。新しい常設cron製品を前提にせず、既存処理内の有限な後始末または本人管理の保守手順を配置／コード計画で固定する。

容量・性能・無料枠が未達なら、大本文や過去操作を勝手に削除せず、測定値と候補改善を示して確認する。実リージョン・DB版・無料枠の利用可能性、pooler互換は配置設計で確認する。水平実行の自動増加はホスティング既存機能に従い、新たなautoscaling／料金設定を追加しない。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

