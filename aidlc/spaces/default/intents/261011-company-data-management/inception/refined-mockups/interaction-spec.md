# 操作仕様

## Common Rules
[Q1]〜[Q3]の実回答に基づく設計。要件・ストーリー・team-practicesを上流にする。native HTMLを優先。フォームは明示保存、変更の自動保存は追加しない。フォーカスや選択だけで画面遷移しない。エラーは対象欄の文字と全体要約で表示し、raw APIエラーを出さない。重複送信は同じ操作の扱いを契約で保証する。

## Component Specifications
### C01 — 共通ナビゲーション
| Field | Value |
|---|---|
| Component | AppNavigation |
| Description | ボード・比較・既存生成の移動 |
| Category | navigation |
| Inputs | activeScreen: string（必須）、authenticated: boolean（必須） |
| States | default、hover、focus、認証確認中、失効 |
| Responsive | 768px未満は折返し。隠れた入口を作らない |
| Accessibility | nav、現在位置aria-current、最初のスキップリンク |
フォーカスは移動後のh1。ログアウト後は保護表示と遅延応答を破棄し、ログイン画面へ。未保存入力がある場合はD01を先に解決する。

### C02 — 企業カードと状態ボード
| Field | Value |
|---|---|
| Component | CompanyBoard / CompanyCard |
| Description | 企業を保存済み状態ごとに表示 |
| Category | display / navigation |
| Inputs | companies: 本人企業配列、loadState: loading/ready/error、activeCount: number、showEnded: boolean（既定false） |
| States | loading、保存0件、通常表示対象0件、populated、error、長名・日付欠損 |
| Responsive | PC通常6列／再表示8列の領域スクロール、スマホ縦6／8グループ |
| Accessibility | 見出し＋企業list＋個別link。グループ移動時の見出しfocus |
社数は保存済み企業IDから集計。目標5〜15、警告>=15のみ。変更中に別列へ確定移動させない。boardスクロール領域は名称と左右移動ボタンを持ち、ドラッグを要求しない。

再承認されたFR3／FR4に従い、通常は未応募・検討中・応募済・書類選考・面接・内定の6状態、終了企業の再表示で辞退・不採用も表示。検討中は対応中に含めず、表示切替で集計・警告・保存状態を変えない。次の選考日はカードと企業詳細で明示ラベル付きの独立領域へ、補助情報より大きい約25px太字で表示する。未設定を文字で示し、応募締切とは区別する。

「終了した企業を表示／隠す」はbutton、aria-expandedと対象領域のaria-controlsを持つ。操作後もボタンへフォーカスを保ち、表示した状態をpoliteに通知する。隠した列と移動リンクはキーボード順序から除く。終了企業だけの通常表示対象0件は保存0件と区別する。列の表示切替は読み取り表示であり企業・メモを削除しない。

### C03 — 企業登録・編集フォーム
| Field | Value |
|---|---|
| Component | CompanyForm / StatusSelect |
| Description | 名前・任意項目・状態を明示保存 |
| Category | input |
| Inputs | values、mode: create/edit、saveState、fieldErrors、onSubmit、onCancel |
| States | default、focus、dirty、saving、validation-error、unknown、conflict |
| Responsive | 1列、PCでは日付等を2列。長い説明は折返し |
| Accessibility | label、任意注記、aria-invalid/describedby、エラー要約 |
必須名の空白は拒否。日付・URLは契約の形式で検証。任意空欄は許可。blurまたは送信で検証し、入力中に過剰なエラーを連続読み上げしない。saving時は二重送信抑制と説明。失敗で入力を保持。企業の志望度と理由の正本関係は未確定。

登録はD03の小さなdialogで名前だけを入力する。開いたら企業名欄へfocus、Tabをdialog内で移動、取消／Escapeは登録せず起動元へfocus復帰。dirtyな入力を閉じる際は同じdialog内で破棄確認し、取消で入力に戻る。送信結果不明の間は登録済みの可能性を表示し、入力を保持して確認する。保存確定後だけ詳細へ移動する。任意項目と8状態の変更はS03専用ページで明示保存する。

### C04 — メモ編集領域
| Field | Value |
|---|---|
| Component | MemoEditor / StructuredFields / SourcePanel |
| Description | 本文・比較用項目・原文出典を分離 |
| Category | input / display |
| Inputs | memoId、company、draftMarkdown、draftStructured、ocrText、event、adoptedWeb、saveState、onChange、onSave |
| States | loading、dirty、saving、saved、invalid、unknown、conflict、missing |
| Responsive | 本文PC分割、スマホ編集/preview切替。各領域は幅内折返し |
| Accessibility | named textarea、fieldset/legend、明示label、preview見出し |
「本文／比較用項目／原文・出典」と「編集／プレビュー」の切替はnamed tabsを採用。左右キーでタブfocus、Enter/Spaceで選択、Home/End端へ、Tabでパネルへ。切替だけで保存・破棄しない。入力欄にフォーカスを維持し、成功はpolite status。出力は表示／編集中本文と比較正本を混ぜない。

### C05 — 一時画像とOCR訂正
| Field | Value |
|---|---|
| Component | OcrReviewPanel |
| Description | 元画像を見てOCRを訂正する |
| Category | input / display |
| Inputs | selectedCompany、temporaryImage、ocrDraft、generationState、onCorrect、onGenerate |
| States | 画像なし、選択済、OCR中、訂正可能、生成中、失敗、不正結果、デモ |
| Responsive | PC左右、スマホ上下。拡大画像は独立領域 |
| Accessibility | file input label、画像alt、訂正textarea、進捗status |
型・サイズの具体上限は既存契約とDomain Designで確認。原画像を永続化しない。生成名による企業変更なし。失敗は訂正へ戻れる。外部保持条件の説明は調査済み条件を用いる。

### C06 — 比較選択と結果
| Field | Value |
|---|---|
| Component | ComparisonPicker / ComparisonResult |
| Description | 企業ごとに1構造化メモを選択 |
| Category | input / display |
| Inputs | companies、eligibleMemos、selectionByCompany、loadState、savedVersions |
| States | empty、no-selection、no-structured-memo、loading、ready、invalid、error、deleted-reference |
| Responsive | PC観点表、スマホ観点ごと企業縦並び |
| Accessibility | checkbox/select label、表caption・scope、同じ観点順 |
選択変更または参照削除後は以前の結果を最新と扱わない。再取得成功で最新保存項目へ。失敗なら出力停止理由を表示。Web補足は別区分。旧比較の入口は「このブラウザの旧比較」、新比較は「保存した企業を比較」。勝手な移行・旧データ削除なし。

### C07 — 破棄・削除ダイアログ
| Field | Value |
|---|---|
| Component | DiscardDialog / DeleteDialog |
| Description | 影響を明示して本人の確認を得る |
| Category | feedback |
| Inputs | targetLabel、affectedMemoCount、confirmationSnapshot、state、onCancel、onConfirm |
| States | 確認、送信中、変更検出、最新取得中、再確認、既削除、取得失敗、結果不明 |
| Responsive | 小画面でも内容をscroll、ボタンへ到達 |
| Accessibility | dialog＋aria-modal、title/description、初期focus取消、focus trap |
Escapeは実行を伴わず閉じる。背景クリックで削除を実行しない。閉じたら起動ボタンへ、削除済みでボタンが無ければ一覧見出しへ。新しいconfirmは最新取得後に本人が押す。危険操作のボタンは対象名を表示する。

### C08 — 保存・取得・競合のフィードバック
| Field | Value |
|---|---|
| Component | SaveStatus / ErrorNotice / ConflictPanel |
| Description | 確定結果と未確定状態を分離 |
| Category | feedback |
| Inputs | state、message、retainedDraft、latestSaved、recoveryAction |
| States | 未保存、保存中、確定成功、拒否、結果不明、競合、失効 |
| Responsive | 本文近くで折返し、画面下の固定通知に依存しない |
| Accessibility | 成功polite、失敗alert、復旧ボタンlabel |
成功は再取得できる確定応答だけ。結果不明時は入力を保持し再取得で照合してから再試行。競合は最新保存内容と保持入力を区別して見せ、自動合成しない。認証失効中は保護内容非表示。再認証による復帰を端末内の一時状態で扱い、未認証表示やlocalStorageへの私的本文保存で代用しない。実現する処理境界はDomain Designで確定する。

## User Flows
| Flow | 操作 | 成功結果 | 失敗／境界 |
|---|---|---|---|
| 企業登録 | S02追加→名前入力→保存 | 未応募で1企業、詳細へ | 名前空、二重送信、結果不明は入力保持 |
| 状態変更 | S03の8状態選択→保存 | 確定状態と対応中数が一致。終了状態は通常ボードから外れ、保存結果と再表示操作を案内 | 拒否は前の確定状態、競合は最新確認 |
| 終了企業の再表示 | S02表示／隠す | 通常6／再表示8状態、社数と警告は不変、詳細とメモを開ける | 終了企業だけは表示対象0件、取得失敗は0件と確定しない |
| OCR保存 | S03画像生成→S05訂正→生成確認→保存 | 同じ企業の1メモ | 画像非保存、根拠不明、構造不正、出典不足 |
| 手入力 | S03新規メモ→S04本文→保存 | 同じ企業に複数メモ | 自動事実化なし、保存失敗保持 |
| 編集・比較 | S04本文/項目を明示保存→S06企業/メモ選択 | 最新の選択項目で比較と出力 | 本文だけの更新でJSON変更なし、参照欠損は要確認 |
| 移動 | dirty S04→別画面 | D01破棄確認後に移動 | 取消は編集継続、ブラウザ離脱はbeforeunloadの制約を明記 |
| 削除 | S03/S04→D02→確認 | 対象と所属を一貫削除 | 変更検出は止め再取得→新D02、既削除は通知、旧データ不変 |
| 復習 | 既存生成→既存復習→出力 | 既存導線を維持 | 新DB連携・復習保存は追加しない |

## Deletion Concurrency Acceptance
Q3 Aと再承認済みAC6.4.5／AC6.5.6に一致する画面設計の期待結果。
- Given 企業の所属2メモを確認後に3件目が追加、When 古い確認で削除、Then 拒否し3件を残す。最新3件を表示し再確認まで削除しない。
- Given 確認した対象メモを別端末で編集、When 古い確認で削除、Then 最新の編集を保持し、新確認に対象の更新情報を表示する。
- Given 所属メモが確認後に編集／削除、When 企業削除、Then 変更を検出し最新集合で再確認する。件数が同じでも編集を見逃さない。
- Given 別端末ですでに対象削除、When 削除実行または再取得、Then 既削除を表示して一覧へ戻れる。他対象を削除しない。
- Given 最新取得の失敗、When 再確認へ進む、Then 実行を許可せず再取得へ。結果不明を成功としない。
実行時検査と削除を一貫した処理にし、検査後の新たな変更でも同じ保護が働く契約をDomain Designで設計する。

## Assumptions & Open Questions
本人の認証方式、新API制限・タイムアウト、正本の詳細、versionと削除の契約は後続設計へ。ブラウザ閉鎖・OS強制終了による入力の完全復元は保証せず、アプリ内移動確認とブラウザが提供する離脱確認の範囲を検証する。動作しないbeforeunload環境を同等保護と称さない。

## Sources
refined-mockups-questions.md Q1〜Q3、../user-stories/stories.md、../requirements-analysis/requirements.md、../practices-discovery/team-practices.md、既存UI/schemaの読取。component-spec-templateのField/States/Inputs/Responsive/Accessibilityを各部品へ適用。
