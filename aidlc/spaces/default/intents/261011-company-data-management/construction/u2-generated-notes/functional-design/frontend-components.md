# U2の画面構成と一時状態

## Component Responsibilities

| 論理部品 | 入力と表示 | 所有する一時状態／責務 |
|---|---|---|
| GenerationWorkspace | 本人コンテキスト・選択企業ID／名称・単発入口 | 作業世代、候補、保存意図。企業IDを生成名から変えない |
| TemporaryImagePanel | 既存形式画像・外部送信の短い案内 | 一時file／表示参照・順序、差替え／除去時の解放 |
| OcrCorrectionPanel | 元画像・OCR・訂正・イベント | 未保存入力、OCRの読込／失敗。本人の訂正だけを生成へ渡す |
| CandidateEditor | 本文・既存構造項目・選択企業と生成名 | 別正本の編集、要確認／未記載、dummy表示 |
| AdoptedSourcePanel | Web候補・採用checkbox・出典 | 採用項目だけを出力／保存。紙と独立 |
| GenerationSavePanel | 保存先・明示保存・状態通知 | 二重操作抑止、結果確認／同一要求再試行、成功とGET失敗の区別 |
| ExistingReviewAndExport | 従来生成入力・復習結果・対応出力 | 新DB読取／復習保存なし。結果とdownloadの対応 |

親は本人・作業世代・selectedCompanyIdを子へ渡し、結果callbackも世代を照合する。現在候補の保存意図・安定ID・凍結要求・保存確定は作業全体が所有し、OCR／既存復習の表示切替で保存欄が作り直されても保持する。保存欄はその状態の表示と明示操作を担当し、表示の開始だけで意図を初期化しない。秘密値・Auth token・DB接続設定を画面へ渡さない。成功後は同じU1メモ詳細に接続し、編集／削除を重複実装しない。

## Validation and Interaction

画像／OCR→訂正→生成→内容確認→明示保存→同じ企業のメモ再取得を基本順とする。保存先なしの単発利用は生成・復習・出力を保ち、保存操作は企業から開始する案内にする。画像形式と既存上限は入力側でも案内し、保存全体と各項目はサーバーでも再検証する。本文と構造は用途を表示し、片方の編集で他方を変えない。

保存中、未保存、保存済み、拒否、結果不明、再取得失敗を文字と状態通知で区別する。unknown中は元の送信内容を勝手に変えた再送を禁止し、現在の編集内容は別に保持する。認証失効時は保護結果を除去し、同一本人の再認証まで入力を隠す。

未保存のアプリ内移動・対象変更・候補置換は確認し、cancelは入力を維持する。同じ候補の保存後編集は同じmemoIdへの未保存変更とし、新規作成へ戻さない。明示的新生成の検証成功でのみ次候補へ移り、失敗は元の候補と保存確定を保持する。危険文字列を実行せず安全な出典URLだけリンク化する。ラベル、順序、focus、キーボード到達、PC／スマホと拡大表示は承認済み画面条件で後続検証する。競合時の最新確認はdraft破棄の移動操作と分け、draft／baselineを保ったまま確認する。

## Sources

- ../../../inception/units-generation/unit-of-work.md
- ../../../inception/units-generation/unit-of-work-story-map.md
- ../../../inception/requirements-analysis/requirements.md
- ../../../inception/domain-design/components.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/user-stories/stories.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md — 実環境設定の後回し、Vercel本人担当の現在方針。

