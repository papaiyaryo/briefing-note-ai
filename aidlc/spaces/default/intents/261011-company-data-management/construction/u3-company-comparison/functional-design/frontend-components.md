# U3 — 比較画面の責任と操作

## Scope and Hierarchy

画面の機能責任を記す。具体的なフレームワーク・実装ファイル・関数本体はコード計画で定める。

- 比較入口: 保存した企業を比較 / このブラウザの旧比較
- 新比較: 比較候補 → 企業ごとの参照メモ選択 → 比較状態と7観点 → 企業志望度欄/メモ理由欄 → 出典/参照情報 → 比較Markdown出力
- 復旧: 取得失敗、削除参照、欄別入力エラー、競合の保持入力と最新、結果不明の照会/同要求再試行
- 旧比較: 従来の選択・端末内コメント・対応出力。新保存先と混ぜない

## Component Contracts

| 責任 | 入力/表示状態 | 操作/結果 | 注意 |
|---|---|---|---|
| ComparisonEntry | 本人状態、選択入口 | 新/旧の明示選択 | ログアウト後は両保護表示を閉じる |
| ComparisonPicker | 所有企業、メモ概要ページ、選択順 | 企業選択/除外、メモ切替、追加ページ | 終了状態も候補。構造なし/0件/失敗を区別 |
| ComparisonView | 有効な全参照、7観点、各版 | 最新再取得、参照元確認 | 自由本文を項目へ変換しない |
| CompanyInterestEditor | companyId、企業版、保存値、draft | その企業志望度だけ明示保存 | null=未設定、undecided=未定 |
| MemoReasonEditor | companyId/memoId、メモ版、理由draft | 選択メモの理由だけ明示保存 | 5000 code points、空欄保存null |
| MutationFeedback | frozen intent、確定/不明/競合、保持入力/最新 | 操作照会、同要求再試行、明示基準更新 | 再表示で新意図を作らず、他欄の成功と混ぜない |
| ComparisonSources | 企業/メモ識別・版、出自、採用Web | 出典を別区分で確認 | sourceUrl/取得日/id/confidence保持 |
| ComparisonExport | 有効表示と同じ選択/版、draft/pending有無 | 再検証後だけ一つの.md | 変更後は最新確認ともう一度のクリック |
| LegacyComparison | 従来形式/利用状態 | 従来の本人編集・出力 | 新サーバー書込・自動移行/削除なし |

## State Ownership and Navigation

選択と比較結果は現本人・世代に結び、欄別draft・凍結要求・確定結果は対象の寿命で保持する。表示部品の再表示で保存中/不明/確定をreadyに戻さない。別欄の保存成功や最新取得で、後から入力した値・他欄draftを消さない。

新比較の保存は明示ボタンのみ。未保存のままメモ切替/企業除外/画面移動/旧入口へ進む場合は確認し、取消は選択・入力・focusを保つ。送信済み要求の画面離脱はサーバー処理の取消しを意味しない。未確定要求は同じ本人の一時メモリに保持し、再表示時は同ID確認から続ける。端末終了を越える保持は約束しない。

競合は旧入力と最新保存内容を同時に識別できる領域で示す。最新取得を入力破棄の条件にせず、本人の明示確認後だけ新基準で編集へ。確定後GET失敗は成功通知と取得失敗を別表示し、再保存を誘導しない。

## Validation and Accessibility

- 企業/メモ選択へ企業名と参照メモ識別を含むlabel。未選択と構造なしの理由を文字表示する。
- PCはcaptionと行/列見出しを持つ観点表。多数列は名前付きスクロール領域でキーボード操作できる。スマホは同じ観点ごとに企業を縦に並べ、データと順序を変えない。
- 入力欄の任意/上限/対象を明示し、拒否は欄別文字と安全な全体要約。入力途中にfocusを奪わず、成功はpolite、重要な失敗はalertとして通知する。
- 入口のh1へのfocusと確認取消の起動元復帰を区別する。再取得・保存通知・文字入力だけで見出しへ戻さない。
- 長い日本語・絵文字・改行・表区切り・HTML風文字を切詰めず安全に表示する。URLは安全な絶対http/httpsだけで、出典の取得日と紙/Web区分を示す。
- 0/1/20/21社、PC1366×768、スマホ390×844、320/767/768px、native200/400%拡大、Tab/ShiftTab/Enter/Space、通知・ラベルを後続の実画面確認へ渡す。viewport模擬やcallbackをnative操作達成へ読み替えない。

## Output and Refresh

出力用テキストは表示中の保存参照と同じデータから導く。未保存/未確定欄がある間は理由を示して無効化する。クリックごとにC3で全参照の企業版・メモ版を再確認し、変更時は最新表示と本人の再操作へ。取得失敗・無効参照・401で成功ファイルを作らない。コピー/ダウンロードの導線が古い成功結果を最新として迂回しないよう、プレビューも「未確認/出力不可」の状態を共有する。

## Sources

- [Unit定義](../../../inception/units-generation/unit-of-work.md)、[担当対応](../../../inception/units-generation/unit-of-work-story-map.md)、[要件](../../../inception/requirements-analysis/requirements.md)。
- [ストーリーと90AC](../../../inception/user-stories/stories.md)、[部品と所有者](../../../inception/domain-design/components.md)。
- [共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[操作仕様](../../../inception/refined-mockups/interaction-spec.md)、[入力上限・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現時点の引継ぎ](../../../../../../../../docs/session-handoff.md)。実装済みの部品があることを全受入・実環境成功の証明にしない。

