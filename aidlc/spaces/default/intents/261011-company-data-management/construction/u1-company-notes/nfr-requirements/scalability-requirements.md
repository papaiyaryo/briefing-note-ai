# U1：保存量・同時利用・費用の要件

## Capacity Requirements

| ID | 条件 | 証拠・未達時の扱い |
|---|---|---|
| NFR7.3 | 代表100企業・1000メモ、長文約10000字、1社50メモ、Web各4項目、10,000小操作記録を含むDB全体の容量予算200 MiB以内 | JSON・索引・基礎領域・確認／session等の必要内部領域を含め実DBサイズを計測。概算だけで無料枠適合を宣言しない |
| NFR7.4 | 無料枠が第一条件。実プロジェクトの利用可能枠・休止影響・リージョン・DB版を確認し、課金／要件縮小を自動決定しない | 人間の新専用プロジェクト設定と使用量の確認。旧プロジェクト変更なし。不適合なら相談 |
| NFR3.1 | 同じ本人の2クライアントで保存・再取得・古い版拒否・同時再送が成立 | 独立クライアントと実DBで同じ操作／異なる操作、競合を検証。常時配信・オフライン同期は不要 |
| NFR7.5 | プロセスあたりDB接続最大3、接続待ちも有限。transaction poolerとTLS検証を使う承認方針を満たす | 配置／driver設定と接続返却・枯渇故障試験。環境との互換は実設定後に検証 |

## Growth and Triggers

100企業・1000メモ・15社警告は保存上限ではない。最大長の全項目を1000件へ適用して無料枠に収まる保証もしない。本文なし一覧、メモページ、選択参照で必要量を読み、常時複製ストアを作らない。

容量予算超過、承認性能未達、接続待ち失敗、実無料枠の不適合を見つけたら、本文・出典・成功操作記録を黙って削らず相談する。write_operationsは本人保存領域がある間保持し、削除済みIDの再利用を防ぐため容量に含める。期限切れ確認と終了sessionの不要tokenは用途終了後の処理対象だが、保存済み企業／メモや成功操作をTTLで消さない。具体的な後始末方法は後続設計へ。

## Sources

- ../functional-design/functional-spec.md、rules.md — U1の操作順序・規則。
- ../../../inception/requirements-analysis/requirements.md — NFR1〜NFR7。
- ../../../inception/contract-design/contract-summary.md — C1〜C6・有限再試行・版と原子性。
- ../../../inception/delivery-planning/bolt-plan.md — 選定・入力上限・性能／容量と検証条件。
- aidlc/spaces/default/codekb/briefing-note-ai/technology-stack.md — 現行構成の静的記録。最新性・稼働証明ではない。
- nfr-requirements-questions.md Q1の本人回答a — 利用して変更した日の終了時と配置／保存形式変更前の手動バックアップ。

