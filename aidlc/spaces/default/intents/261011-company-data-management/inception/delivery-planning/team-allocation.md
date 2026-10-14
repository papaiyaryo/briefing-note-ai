# Bolt 002の担当

## Ownership

Boltは、動く改善を作り検証して公開する開発のまとまり。今回は3 Unitを1リリースへまとめる。Q5=aに従い、このセッションのAI開発担当`aidlc-developer-agent`が全Unitを直列実行する。複数の人間チームを新設せず、並列workerを起動する計画にはしない。

| 対象 | 実装担当 | 正本・責任 | 人間の役割 |
|---|---|---|---|
| U1 | aidlc-developer-agent | 本人確認、企業・メモ、版・削除・再送、共通画面と契約 | Supabase専用環境・本人の準備、計画・結果の確認 |
| U2 | aidlc-developer-agent | 生成候補と出自、訂正OCR、画像非保存、既存復習 | 生成・保存の画面確認、必要時の実provider利用判断 |
| U3 | aidlc-developer-agent | 選択メモ比較と出力、企業志望度とメモ理由、旧保存との区別 | 比較・出力の実操作と結果確認 |
| リリース全体 | 同じ開発担当、適用段階の品質・設計担当 | 90 AC、TDD、CI、容量・性能・公開証拠 | 最終Inception・コード計画・所定checkpoint承認、PRの最終マージ |

## Checkpoints and Shared Files

unit-major／serial、公式checkpointを保持する。必要な設計・品質レビューの担当はその段階の正式な指定に従い、本書で後続段階を省略・追加しない。今回は協力担当を並列に作業させる設定ではない。

共通認証・保存DTO・DBアダプタ・migrationはU1。U2／U3が必要な追加は該当Unitのコード計画で共通所有者と影響を明記する。生成がU1の保存規則を複製せず、比較が独自に正本を書き込まない。現在のユーザー編集や別担当の変更を取り消さず、差分を保全して調整する。

## Escalation and Sources

設定・無料枠・受入・既存API互換が成立しなければ人間へ具体的な差分と選択肢を示し、必要な計画変更を承認する。担当AIが承認を代行しない。Q5の実回答、unit-of-work／story-map、team-practices、bolt-planを根拠とする。
