# U1：障害・再送・復旧の設計

## RD1 — 変更と操作結果の原子性

NFR2.2／NFR2.3／NFR3.2／NFR2.9を対象に、書込は本人session確認→同本人operationIdの直列化→親企業→対象メモの順に扱う。異なる要求で同じoperationIdなら拒否。同じ確定済み要求なら元結果を返し、対象存在・削除確認期限より前に成功照合する。作成IDの過去利用を操作履歴から検査し削除後も再利用しない。

未確定操作の版照合・必要な変更・新しい保存版・子集合版・成功操作結果を同じトランザクションで確定する。処理途中の失敗は全ROLLBACK。親を先に直列化する規則を作成／編集／削除へ一貫して適用し、同じ件数のメモ編集や理由変更もchildrenVersionへ反映する。

削除確認は一貫した読取で本人・対象・版・全所属集合を作り10分期限を付ける。新規確定削除は同じ親直列化の下で期限・版・子集合を再照合。変更なら409で最新再確認、期限切れ410、他人確認は内容非開示。単体は該当メモだけ、企業は全所属を同じ確定で消す。取消は書込を起こさない。メモページの件数で全所属確認を代用しない。

## RD2 — 結果不明・期限・再試行

NFR2.1／NFR2.4／NFR2.8を対象に、HTTP途絶・commit応答途絶は変更を推測せずunknown。UIは固定要求・operationIdと入力を一時保持し、本人の結果確認で確定履歴を読む。committedなら最新対象へ、unknownなら本人が同じ要求を再試行する。新内容／新IDを勝手に送らない。

要求deadlineは全依存へ伝え、実DB取消しと後始末を行う。確認できない接続は破棄し、次要求へ未完了SQL・所有者設定を漏らさない。新GETはネットワーク／503で500ms後1回のみ。書込／比較参照POSTは自動再送なし。無限polling・独自のバックオフ拡張・正常値fallbackで障害を隠す処理は作らない。今回の規模で新しいcircuit breaker／message queue／cache製品は必要とせず、有限な境界と明示障害を採用する。

## RD3 — 手動バックアップと復元

NFR2.5／NFR2.6／NFR2.7を対象に、本人が変更した日の終了時と配置／保存形式変更前に、整合した保存スナップショットのバックアップを取得する。所有者、企業／メモIDと版、所属、成功操作記録、必要な保存スキーマ版を一緒に保つ。本文・OCRを含む本体は私的データとして保護し、repo／audit／CI artifactへ置かない。取得方法・保管場所と保護・復元権限は配置／コード計画で本人管理手順として固定する。

現在のsession tokenやpasswordを通常の企業メモ復元資料として持ち出さない。Auth本人IDを元の保存ownerへ結び付けられる前提を検査し、復元後はsessionを新たに認証する。別Auth本人への勝手な所有者付替えをしない。成功操作履歴を落とした復元を、同じ再送契約を維持した成功とは扱わない。

使い捨てDBに架空データを作り、バックアップ取得→別の試験DBへ復元→企業／メモのID・内容・版・所属照合→旧操作の同要求再送確認を実行する。所要時間・対象サイズ・成否を記録する。24時間は手動運用目標であり、自動RPO保証ではない。未取得／失敗時の損失は最後の成功取得以降。

休止／Auth停止／DB停止は本人への明示障害として復旧手順へ進む。既存Vercelと保存先をむやみに再作成しない。rollbackは人間承認のrevert PRと実対象SHAの再配置確認、データ復旧は別の本人判断。backupだけ存在してもrestore未確認なら復旧検証済みとはしない。固定稼働率SLA／RTOを追加しない。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

