# U3 revision02 — 比較画面の誤成功表示と削除後保存を修正

## 2026-10-25 追加確認 — 出力時404のR-02修正

ユーザーがClaude Codeで適用済みのexport.ts/export.test.tsの確認と正式記録への反映を依頼した。[専用handoff証拠](export-r02-handoff-evidence-2026-10-25.md)に現在2fileのhash、実装/新2試験、ユーザー報告TDDと今回の独立確認を分けて記録した。今回の限定Vitestは1file/14件成功・exit0。過去planの8file承認をこの2fileへ遡及適用せず、アプリ/試験/承認済plan/test-instructionsは編集していない。

現在修正後の実PG/full/coverage/buildは未実行。ユーザー報告のDBなし128件・typecheck/lint/prettier成功は今回の独立実行結果ではない。累積manifest29件と旧fingerprint/共有3file差分を保持し、下記の旧aggregate/全品質成功は当時のbytesに対する履歴として扱う。GUI Step9、Deferred、その他残条件は継続する。

## 再開時の追加記録

[再開証拠](resume-evidence-2026-10-25.md)を追加した。今回アプリ/試験変更0、成功済み試験の再実行0。追加CUAはログイン画面後に同一接続失敗が2回続き停止、M-R追加成功0、Step9未完。専用schema削除true、helper停止確認false、既知2PID消失は別々に記録。下記の前回mismatch0/aggregateは当時の結果で、現在共有3ファイルには保存hashとの差がある。累積manifest29件と今回担当8ファイルを保持し、前回品質成功を現在全bytesの再検証へ読み替えない。

## 変更した振る舞い
R-01は、当該intentと一致する確定outcomeを持つcommitted状態だけを保存成功の根拠にした。409→latest取得失敗は競合/入力保持/取得失敗と表示し、以前や別意図の確定結果を新しい成功へ流用しない。実commit後の読取失敗では確定ID/版を保持し、成功と取得失敗を区別する。

R-02は、参照の利用可否を保存操作のstatusから分離した。C3全選択404で選択対象の新規intent/save/rebaseをUIとcontroller双方で止め、原因列を推測しない。対象別readCompany/readMemoの本人/ID/版/要求世代を確認した成功だけで該当ガードを解除する。企業404は所属欄へ適用し、比較全体/出力は全C3成功まで停止する。通信失敗を削除と断定しない。dirty/base/frozen ID/body/unknown/committed履歴を保持し、送信済み同IDのlookup/明示retryを残す。自動新ID再送は追加していない。

## 所有ファイルと範囲
承認された今回のアプリ/試験変更は次の8fileだけ。新規sourcefile・削除・依存/設定/API/DB/Auth変更なし。

| ファイル | 変更 |
|---|---|
| src/lib/companyComparison/session.ts | owner/選択/要求世代に結び付く参照ガード、部分解除、draft/履歴保持 |
| src/lib/companyComparison/edits.ts | 新save/rebase停止、404と通信失敗分類、対象別latest世代検証、同ID解決維持 |
| src/components/compare/ComparisonFieldEditor.tsx | 確定outcome一致検査、入力/保存/rebaseガード、latest確認と文字通知 |
| src/components/compare/ServerCompanyComparison.tsx | 実refresh404配線、保持操作の正しい成功表示、古い参照/出力不可 |
| tests/u3-company-comparison/session.test.ts | 新S-R5件 |
| tests/u3-company-comparison/edits.test.ts | 新C-R7件、mock戻り値型だけ明示 |
| tests/u3-company-comparison/ui.test.ts | 新U-R6件、実callback/controllerと表示の対応 |
| tests/u3-company-comparison/comparison.integration.test.ts | 新I-R2件、実PG削除/404から保存制御まで |

既存dirtyと.worktrees/cloud-handoffは保全。開始時branch相違は同じHEADを確認して既存release/bolt-002-company-data-management-localへ戻した。commit/push/mergeなし。共有入口・U1/U2・docs/session-handoff.md・比較helper/docsは変更せず、記録は当U3内に限定した。

## Source manifestと固定
[source-manifest.json](source-manifest.json)は初回からの累積29file・削除0を維持し、今回だけの8fileへ縮めていない。[source-fingerprints.json](source-fingerprints.json)は29file全てを実hashで更新。aggregateはsorted path:sha256をLF結合/末尾LFなしのSHA256で、現在 **59ededfa48d25cf900ad3bb58ab75db4a827b58f9d8e88c8c03ce3f77b72006f**。revision02前 **36a9f6f6cfaf75eeefdb116382f7a0d49ccfebe7436ca55d63421bac39d49d93**との差分は上の8fileだけ。

U1全96file/U2全41fileの保存hash照合はmismatch0。先行修復後のU1 aggregate e1d869dcb42cab9f57ac4bb5475ba5c1f4bf63e7f7bfd69cbb6a8bbf4b40d435、U2 aggregate9ab545c407d7a3405022628ac2f191215cea474f8ee0d44b5ccb92ca209e3478を保全。旧fingerprint内のresume/CDP配列は履歴であり、今回の変更file一覧ではない。

## TDD・品質検証
[実行証拠](bugfix-evidence-revision-02.md)にrunner→baseline→層別Red/Green/Refactorを記録。変更前U3 119/119、全体615/615、lines85.12%。新規20件=S5/C7/U6/I2で、既存119件を保持しU3は139/139。
Business Redは48件中11失敗（削除後PATCH1/2等を含む）、実PG Redは12件中2失敗、UI Redは24件中4失敗。正常対照の初回Greenや未実装参照APIによるTypeErrorは分け、全20件が失敗したとは主張しない。Business Green/Refactor48/48、実PG12/12、UI24/24。

[最終品質](verification-revision-02.md)：lint/typecheck exit0、通常全55files/635tests成功、coverage同635件成功/skip0、全app/src lines **85.95%(2962/3446)**、build exit0/18pages、git diff --check exit0。既存v8/include/exclude/lines80/timeout/assertion不変。実CI job未確認。

shell起動前の失敗、追加mock型のTS2345、最初のcoverageでの既存U1最新取得test5000ms timeoutは[停止履歴](verification-revision-02-root-stop.md)に保持。各Retryは本人回答後に同じ承認範囲で実施。型修正は戻り値注釈1箇所だけでnull入力/期待値不変、coverage再実行ではsource/時間/条件を変更しなかった。失敗をアプリTDD Redへ算入しない。

## 限定GUIの証拠と未確認
[CUA実観測](manual-revision-02-root.md)は同本人2タブの通常保存/確定ID、409/base/draft/latest分離、メモ削除404→入力保持/新規保存/出力停止、企業だけ再取得→当該欄のみ再開、企業と所属メモ削除→両欄停止を確認。PC幅1905/横overflowfalseとTab/ShiftTab/Enterの限定到達を実観測。全3previewはexit0/専用停止true/schema削除true、ownedtabsを閉じた。

実GUIでは明示rebase後再保存、残る別企業の確認保存、他欄dirty同時保存、route往復/.md実downloadを今回完了していない。390幅override/native拡大キーは実幅変化を確認できずmobile/native200/400未確認。旧CDPの幅/倍率結果を今回の測定に流用しない。故障注入経路は制御回帰試験でありライブDOM成功と称さない。Step9は未チェックを維持。R-03の実B/A→B→A・出力中の実本人変更は引き続きDeferred。

## 追跡と持越し
[traceability.json](traceability.json)は90AC/17BR/30NFRの137IDと全Deferred状態を維持。U3担当35ACと他Unit55ACの区別、局所証拠と共同/全受入の未確定を保持し、新しい局所成功で全受入を一括合格にしていない。

U1既知3件とU2重複保存は先行修復/checkpoint承認済み。U2の画面受入未確認、U3上記GUI/実B未確認、既存audit high5/critical1、実Auth/Supabase/外部API/実CI/本番mergeSHA/Vercel/公開フローは未確認・持越し。人間のrisk acceptanceや本番リリース完了を推定しない。

## 履歴
[revision02前summary](code-summary.before-revision-02.md)、[旧trace](traceability.before-revision-02.json)、[旧fingerprint](source-fingerprints.before-revision-02.json)と、[TDD履歴](tdd-evidence.md)、[品質履歴](verification-results.md)、[手動履歴](manual-evidence.md)、[手動受入表](manual-acceptance-status.md)を保存。過去の587件/83.50%や旧Step16は当時の範囲であり、現在の139/635件・11step計画へ混同しない。
