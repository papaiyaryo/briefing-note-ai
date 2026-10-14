# ストーリーとUnitの対応

## Coverage Meaning

全18ストーリーを分配する。対応済みは「担当を定めた」という意味であり、実装・試験の合格を示さない。横断するストーリーは主担当と共同確認を明示し、全Unitの統合で90受入条件を確認する。traceability.jsonの各targetはこの表のUnit IDへ対応する。

## Story Map

| Story ID | 利用者の目的 | 主担当Unit ID | Directory | 共同確認Unit ID／Directory | 境界と確認内容 |
|---|---|---|---|---|---|
| US1.1 | 本人ログイン・安全な終了 | U1 | u1-company-notes | U2/u2-generated-notes, U3/u3-company-comparison | 共通本人確認と直接要求の拒否。生成・比較の追加入口も失効・遅延応答を確認 |
| US1.2 | PC・スマホで同じデータを再取得 | U1 | u1-company-notes | U2/u2-generated-notes, U3/u3-company-comparison | 所有者・保存・再取得。生成メモと比較も同じ本人データを使う |
| US2.1 | 企業名だけで登録 | U1 | u1-company-notes | なし | 未応募、安定ID、任意空欄、入力検証、二重送信 |
| US2.2 | 企業情報を後から編集 | U1 | u1-company-notes | U3/u3-company-comparison | 日付・名前・所属保持。企業共通志望度の比較への反映 |
| US3.1 | ボードから詳細とメモへ | U1 | u1-company-notes | なし | 保存8状態／通常6状態／終了再表示、表示対象0件と保存0件、強調日付・未設定・締切、PC／スマホ |
| US3.2 | 選考状態を明示変更 | U1 | u1-company-notes | なし | 保存確定・拒否・結果不明、終了状態後の再表示、検討中の区別 |
| US4.1 | 対応中社数と警告 | U1 | u1-company-notes | なし | 0/4/5/14/15/16社、企業ID単位、検討中除外、表示切替で不変、操作非制限 |
| US5.1 | 訂正OCRから企業へ保存 | U2 | u2-generated-notes | U1/u1-company-notes | 同じ企業の保存・再取得、生成名の不一致、不正結果、画像非保存、重複・結果不明 |
| US5.2 | 根拠と情報区分を確認 | U2 | u2-generated-notes | U1/u1-company-notes, U3/u3-company-comparison | 紙・印象・HR・質問・ES・Webと出典、要確認、dummy判別を保存・比較・出力でも保持 |
| US6.1 | 画像なしの手入力メモ追加 | U1 | u1-company-notes | なし | 所属と複数メモ、自由本文の自動事実化なし、再取得・失敗・二重送信 |
| US6.2 | 保存メモ編集と未保存保護 | U1 | u1-company-notes | U2/u2-generated-notes | 選択メモ本文と項目を別正本、生成保存後の同じ編集導線、未保存・破棄確認・安全表示 |
| US6.3 | 古い端末からの上書き防止 | U1 | u1-company-notes | U2/u2-generated-notes, U3/u3-company-comparison | 企業・状態・本文・項目の版と入力保持。追加画面の更新も同じ契約へ接続 |
| US6.4 | 確認してメモ削除 | U1 | u1-company-notes | U3/u3-company-comparison | 対象・拒否・結果不明・確認後変更・再確認はU1、AC6.4.3の比較参照無効化はU3 |
| US6.5 | 所属メモも確認して企業削除 | U1 | u1-company-notes | U3/u3-company-comparison | 所属と件数・部分変更防止・確認後変更はU1、比較候補／参照無効化はU3、旧データを自動削除しない |
| US7.1 | 比較用項目を本文と別に編集 | U1 | u1-company-notes | U3/u3-company-comparison | 編集と保存はU1、AC7.1.1の比較再取得と修正値の使用はU3。理由と企業自由メモも区別 |
| US8.1 | 企業ごとに参照メモを選び比較 | U3 | u3-company-comparison | U1/u1-company-notes | 最新保存データ・1企業1参照・未記載／要確認・所有者・旧比較。志望度は企業共通、理由は選択メモ |
| US9.1 | 対応するMarkdown出力 | U1 | u1-company-notes | U2/u2-generated-notes, U3/u3-company-comparison | 本文出力はU1、生成と既存復習はU2、比較参照と比較出力はU3。全導線で情報区分・出典・失敗を確認 |
| US9.2 | 既存面接前復習を維持 | U2 | u2-generated-notes | U1/u1-company-notes | 本人確認後の既存生成→復習→出力。新DB復習接続や既知不具合の一括修正は追加しない |

## Within-Unit Implementation Approach

各Unitの内部では正式契約と対象のrunnerを確認し、受入条件ごとに失敗テストを実行するRed、最小実装のGreen、greenを保つRefactorを繰り返す。setup失敗をRedにしない。後のコード計画にコマンド・対象・受入との対応を記録する。

| Unit | 内部で依存する確認の流れ |
|---|---|
| U1 | 本人と対象所有者→企業／メモの保存と再取得→状態・社数・日付→版・再試行・削除整合性→画面の一連の操作と本文出力。各目的のUI・API・保存・検証を一緒に確認 |
| U2 | 本人と保存先の確認→一時画像とOCR訂正→生成候補の検証と区分→明示保存と再取得→失敗・画像非保存・既存復習／出力の回帰 |
| U3 | 本人と保存参照の確認→企業／メモ選択と7観点→志望度／理由の明示更新→参照変更・削除・失敗による無効化→同じ参照からの出力・旧比較の区別 |

この表はUnit内の必要な処理・検証の関係であり、Unit間の経済的な実行順を決めるものではない。手動確認、PC／スマホ・キーボード、line coverageと共通検査、リリース全体・対象SHAの本番確認はDelivery Planningで具体化する。

## Coverage Check

上流18USを各1行で分配し、すべてに主担当がある。U1・U2・U3すべてに主担当ストーリーと必要な共同確認がある。横断条件を主担当だけで完了と扱わない。完全な受入証拠は後続のUnit記録とリリース全体の検証に残す。

## Sources

../user-stories/stories.md、../requirements-analysis/requirements.md、../domain-design/components.mdとdecisions.md、units-generation-questions.md Q1の実回答、unit-of-work.md、unit-of-work-dependency.md。
