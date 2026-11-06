# M-R5 フォーカス消失 — 修正提案（承認待ち）

## Diagnosis

2026-11-03のユーザー報告では、比較理由をTab→Enterで保存すると成功通知の一方でフォーカスがbodyへ移った。ComparisonFieldEditor.tsxはsaving時とdirty解消時に保存ボタンをdisabledにする。送信開始直後からフォーカスを失い得る構造が原因候補。実ブラウザでの再現・修正後確認は未実施。NFR5.3（tech-stack-decisions.md）と通知時に入力focusを奪わない条件を維持する。

## Candidate Fix

U3のComparisonFieldEditor.tsxとtests/u3-company-comparison/ui.test.tsに限定し、保存ボタンをフォーカス可能なままaria-disabledで操作不可を表し、同じ条件をクリック処理でも確認して保存を遮断する。送信中・未変更・競合・対象削除・復元待ちの条件を維持し、二重保存を防ぐ。通知から強制focusを行わない。入力欄の利用不可制御・API・DB・保存契約は変更しない。実装時の調査でこの案が不十分なら修正計画を再承認する。

## TDD and Verification

正式なcode-generation再開とPlan Approval後にrunner確認、保存中/保存後のfocus可能性、操作不可時の再クリック遮断、再編集後の保存再開を既存HookHarnessでRed→Green→Refactor。既存assertionの保護対象を維持する。疑似DOMの試験だけで実ブラウザのfocus合格にはしない。

既存のU3 UI試験、U3全9ファイル、npm run lint、npm run typecheck、npm test、既存coverageコマンド（lines80%以上）、npm run buildを実行。M-R5は同じTab→Enter操作で送信中・成功後のactiveElementとShiftTab/Tab、status通知、重複書込なしを確認する。画面確認手段は過去の安全停止を迂回せず、利用可能な正規手段または本人の確認報告を使う。実環境/モバイル等の既存Deferredは維持する。

## Estimated Impact

作業量：実装・回帰・品質検査・記録で約1〜2時間、実画面確認は別途。金銭：新依存・外部APIなし、追加サービス費用なし。リスク：aria-disabledはnative disabledと異なり手動遮断が必須。二重送信・古い状態による遮断漏れを回帰試験する。変更はU3のみ。commit/push/PR/deployは含めない。

## NFR Evidence Plan

169行を一括合格にしない。原典行を要素別に照合し、既存checkログ/テスト名で裏付けられる項目、追加ローカル測定、実環境を要する項目に対応付ける。性能は既存のwarmup5回・各操作50回・p95/最大/失敗数と環境条件、復元は架空DBの復元照合と所要時間、安全性は認可/ログ/保存境界の個別証拠が必要。今回の修正だけでこれらが解決するとはしない。追加測定コマンドや受入範囲変更は別途承認を得る。
