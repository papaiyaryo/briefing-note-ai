# 次Bolt開始前の整理・方針再検討

## Human Direction — 2026-11-03

> じゃあ次のboltでいいや。こうやって次のboltでやること多くなっているから次のbolt始める前に整理して今後のbolt方針を立て直そう

M-R5保存後フォーカス消失の修正は今Boltでは実施せず、次Boltの候補へ持ち越す。次Boltの実装開始前に持越し全体を整理し、今後のBolt方針を人間と再検討する。次Boltへ全項目を一括投入する承認ではない。今回の全体fail・個別Unverified・結果未承認を維持する。

## Carryover Inventory

| 項目 | 現状 | 計画時に決めること |
|---|---|---|
| M-R5保存後focus消失 | ユーザー報告あり。原因候補と修正案はfocus-repair-proposal.md。修正未実施 | 対象Bolt、TDD回帰、実画面の完了条件 |
| D-01 実B / A→B→A | 人間判断でDeferred | 本人切替・認可境界を確認する環境と担当 |
| D-02 モバイル・200%/400%拡大 | 人間判断でDeferred | 対応端末・倍率と確認する導線 |
| D-03 U2画面受入 | 人間判断でDeferred | 生成→保存→再表示の確認範囲とdummy/実API境界 |
| D-04 実Supabase/Auth | 人間判断でDeferred | 環境準備・認証・保存・競合・削除・出力の受入 |
| 個別NFR目標169行 | 全てUnverified。169件の別々の不具合という意味ではない | 原典の複合/重複を対応付け、証拠のある目標と追加測定を要する目標を分ける |
| FR/NFR/ACの横断対応 | cross-unit-traceability.mdに不足・Deferred記載 | 既存テスト/ファイルとの対応を照合。範囲変更と証拠不足を区別 |
| Bolt 2の公開確認 | 結果承認・PR・人間merge・当該SHAのVercel/health/利用導線の完了は未確認 | 現リリースをどう完了させるか。公開確認前に次Boltを実装しない |

## Proposed Planning Approach — 未承認

1. この一覧・現在のアプリ・実際の公開結果を入力に、持越しを重複なしで整理する。各項目に利用者への影響、依存関係、必要な環境、完了条件を付ける。
2. 既存機能の受入・安定化と、新しく得たい利用価値の優先順を人間と選ぶ。全部を次Boltに集めない。秘密情報や実メモを計画に入れない。
3. Boltごとに利用者が試せる到達点を1つ明確にし、必要なUI/API/データ/確認を含める。候補Boltの順序・対象外・検証・所要見込みを示す。
4. 重要な安全性・保存・本人境界の未確認は単に後回しとせず、リリース判断への影響を明示する。繰り越す場合は理由と再検討条件を記載する。
5. 合意後、次の1 Boltだけ正式なInceptionへ落とし込む。計画承認前に実装しない。Bolt番号はdelivery planningで未使用番号を確認して確定する。

## Current Repair Attempt

Loop-back 1はtest-results.mdに記録したが、全Unitまとめての再開が必要との応答で変更されていない。人間は全Unit再開を選ばず、修正を次Bolt候補へ回した。code-generation再開・修正・新規検査・結果承認・合格は記録していない。

## Sources

- build-and-test-plan.md（D-01〜04、残るPC受入）
- manual-acceptance-results.md（M-R1〜5本人報告）
- focus-repair-proposal.md（修正候補・影響）
- target-inventory.json / target-verification-matrix.md
- cross-unit-traceability.md / test-results.md
- docs/roadmap.md（テーマ・履歴。現在の承認計画の代替にはしない）
