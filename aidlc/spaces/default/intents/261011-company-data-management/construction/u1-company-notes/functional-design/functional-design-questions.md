# U1：企業・メモ管理の機能設計の確認

## Confirmed Context

既存Intent `261011-company-data-management` の承認済みInception計画を引き継ぐ。本人確認、企業名だけの登録、保存8状態／通常6状態、次の選考日の強調、対応中社数、複数メモ、本文と構造化項目の分離、保存版・結果不明・確認付き削除は聞き直さない。

通常の完了チェックポイントは自動で進める選択を記録済み。コード計画承認、必要な未決定事項、検証失敗は本人へ確認する。本ファイルには実メモ・メールアドレス・秘密値を書かない。

## Q1 — 手入力メモへ比較用項目を追加する入口

以前の要件質問Q12では画像なしの手入力メモ、Q13では比較用の構造化項目の編集を選択済み。自由本文を自動構造化しない点も確定している。一方、構造化項目がまだない手入力メモへ、本人が後から項目を記入する入口を用意するかは明示されていない。編集画面と比較対象の判定を具体化するため、この点だけ確認する。

画像なしで作った手入力メモを、企業比較で使いたい場合はどうしますか？

A. 本人が「比較用項目を追加」を選び、事実・強み・印象などを手入力できるようにする。自由本文は変えず、未記入の項目は空欄のままにする。全項目の形式を検証して明示保存したメモを比較対象にできる。
B. 今回の手入力メモは自由本文の保存・編集・出力までにする。構造化項目なしの手入力メモは比較対象にせず、比較用項目の編集は既に構造化項目があるメモに限る。
X. Other (please specify)

[Answer]:a

## Impact and Sources

回答は新しい自動生成・本文解析・外部API利用を許可しない。Aを選んだ場合は、承認済みの本文と構造化項目の分離、および共通保存契約の範囲を照合して設計へ反映する。承認済み範囲や受入条件の変更が必要なら、実装前に変更を確認する。

- ../../../inception/requirements-analysis/requirements-analysis-questions.md Q12=A、Q13=A。
- ../../../inception/requirements-analysis/requirements.md FR6.1、FR7、FR8.2。
- ../../../inception/user-stories/stories.md AC6.1.2、AC7.1.2、AC7.1.3、AC8.1.3。
- ../../../inception/units-generation/unit-of-work.md、unit-of-work-story-map.md — U1の保存・編集責任とU3の比較責任。
- ../../../inception/domain-design/components.md — 本文と構造化項目の別正本。
- ../../../inception/contract-design/contract-summary.md C2／C3 — 手入力のstructuredContentはnull可、有効な構造化項目だけを比較参照へ返す。
- ../../../inception/delivery-planning/bolt-plan.md — 空本文拒否、入力制限、単一リリースと実装着手条件。
