# U1：内容を残さない診断と受入証拠

## OD1 — 最小の構造化診断

NFR1.7／NFR2.8／NFR7.6を対象に、要求ごとの不透明requestId、操作種別、結果code、経過時間、依存先の成功／失敗分類だけを診断用へ渡す。自由入力message、完全URL query、SQL params、本文／OCR／画像、password／token／鍵、完全要求・応答をログへ展開しない。schemaエラーの説明にも内容を複写しない。

共通境界で予期しない例外を安全なinternal_errorとrequestIdへ写し、入力欄では検証された欄エラーを表示する。HTTP codeと結果不明を区別し、運用診断から保存成功を推測しない。単一要求の相関はrequestIdで行い、企業・メモの識別子を外部通知へ流さない。新しい分散trace／常設dashboard／自動通知サービスは追加しない。

## OD2 — 測定とリリース確認

NFR6.1／NFR6.2／NFR6.4／NFR7.6を対象に、TDDのrunner確認と受入ID、Red／Green／Refactorのコマンド・結果を公式Unit記録へ残す。全アプリlines>=80、lint／typecheck／test／buildと実SQL・手動画面の結果を別の証拠として揃える。AI-DLCとテストファイル等の承認除外以外を隠さない。coverage依存とCI変更はコード計画承認後だけ。

同じSHA・fixture・端末・リージョンでp95／最大／失敗数とDB容量を測り、2秒／削除3秒／200 MiBに未達なら修正・確認する。cold start・認証初回・休止復旧を別記し、平均値で合格にしない。バックアップ成功日時と24時間目標の未達は本人管理の記録に置き、本体・個人内容を開発記録へ貼らない。

公開確認は人間merge後の実SHAとVercel成功／URL、ページ、health、承認済み利用導線を照合する。healthは浅い公開確認のみ。保存DBやAuthの障害を公開healthの秘密出力で診断しない。実provider利用が未許可なら公開生成受入を保留。新たな自動通知や保存データの自動削除は行わない。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

