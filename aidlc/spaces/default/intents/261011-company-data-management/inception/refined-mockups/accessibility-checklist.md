# アクセシビリティ確認表

## Target and Status
Q1 AでWCAG 2.1 AAを設計・確認目標とした。以下は実装・検証で使う確認表であり、チェック未実施を合格済みにしない。プレビューの目視確認と、実アプリのキーボード／支援技術／認証・保存の検証は別に扱う。

## Checklist
| ID | 対象／確認方法 | 期待結果 | 現時点 |
|---|---|---|---|
| A01 | 全画面lang/見出し/landmark | lang=ja、main、nav、順序のあるh1〜h3 | 設計済、実アプリ未確認 |
| A02 | keyboardでnav→board→detail→memo→compare | 全操作へ到達、visible focus、trapなし | 設計済、実アプリ未確認 |
| A03 | D01/D02/D03開閉・Escape・取消 | 破棄・削除は初期focus取消、登録は名前欄。dialog内にfocus、起動元へ復帰。dirty登録の取消を含め、危険操作を自動実行しない | 設計済、実アプリ未確認 |
| A04 | tabsの左右/Home/End/Enter/Tab | 適切なrole/stateとselected panel、切替で入力消失なし | 設計済、実アプリ未確認 |
| A05 | form label、任意注記、欄エラー | placeholderだけに依存しない、関連付け、要約、具体的訂正方法 | 設計済、実アプリ未確認 |
| A06 | 色なしで状態・警告・日付を読む | 保存8状態名、通常6／終了再表示、社数と>=15警告、次の選考日／未設定を文字で判定可能 | 設計済、実アプリ未確認 |
| A07 | 通常文字contrast | 4.5:1以上、対象large文字は3:1以上 | 設計目標、実際の全組合せ未確認 |
| A08 | 入力・focus等の識別contrast | 必要な部品境界／focus等3:1以上 | 設計目標、実際の全組合せ未確認 |
| A09 | 390×844・320px・767/768px | 通常6／再表示8状態、主要操作、長名へ到達。意図しない横溢れなし | モック確認範囲はpreview-validation.md、実アプリ未確認 |
| A10 | 200%/400%拡大 | 内容と操作の欠落なし。二次元表は名称付き領域で移動可能 | 設計済、実アプリ未確認 |
| A11 | 読込・保存・エラーの読み上げ | 成功polite、失敗alert、入力中の過剰通知なし、focusを奪わない | 設計済、実アプリ未確認 |
| A12 | 一時画像とOCR | 意味のあるalt・訂正label。本文をaltへ丸写しせず、両領域へアクセス可能 | 設計済、実アプリ未確認 |
| A13 | PC比較table／スマホ比較 | caption、scope、企業・参照メモ・観点が一致、色のみの意味なし | 設計済、実アプリ未確認 |
| A14 | 長文・日本語・特殊文字 | 折返し、読める入力とpreview、script実行なし、安全URLのみ | 設計済、実アプリ未確認 |
| A15 | motionとtap | reduced-motion対応、重要操作44px目標、固定領域が操作を遮らない | 設計済、実アプリ未確認 |
| A16 | 認証失効・競合・削除変更 | 保護内容の非表示、保持入力と最新内容を区別、再確認を読み取れる | 設計済、実アプリ未確認 |

## Board Design Checks

再承認済みFR3／FR4に対応して、A06/A09で「検討中」の文字表示、通常6状態と終了2状態の再表示、次の選考日の強調と未設定表示を確認する。終了企業の表示ボタンはaria-expandedと対象領域の関連を持ち、非表示状態のリンクをキーボード順序に残さない。切替後のfocusとpolite通知、終了企業だけの表示対象0件、保存0件と取得失敗の区別も確認する。モック上の見え方を確認したことは実アプリの適合証明ではない。

## Verification Handoff
具体的なブラウザ・支援技術・操作手順・記録方法はDelivery Planningで承認する。既存Vitestと手動確認を基本にし、新しいブラウザ自動試験依存を自動採用しない。手動キーボードと読み上げは自動scanだけで代替しない。文字数・保存規模・性能はここで上限化しない。

## Sources
refined-mockups-questions.md Q1、mockups.md、interaction-spec.md、design-system-mapping.md、../requirements-analysis/requirements.md NFR5、../user-stories/stories.md US3.1/US6.2、../practices-discovery/team-practices.md。
